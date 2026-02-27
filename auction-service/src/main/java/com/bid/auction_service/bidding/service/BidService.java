package com.bid.auction_service.bidding.service;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.enums.AuctionStatus;
import com.bid.auction_service.auction.service.AuctionService;
import com.bid.auction_service.bidding.dto.AuctionLiveUpdateDTO;
import com.bid.auction_service.bidding.entity.Bid;
import com.bid.auction_service.bidding.repository.BidRepository;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class BidService {

    private final BidRepository bidRepository;
    private final StringRedisTemplate redisTemplate;
    private final AuctionService auctionService;
    private final SimpMessagingTemplate messagingTemplate;

    // Per-auction locks for thread-safe validation
    private final Map<Long, ReentrantLock> auctionLocks = new ConcurrentHashMap<>();

    public BidService(BidRepository bidRepository,
            StringRedisTemplate redisTemplate,
            AuctionService auctionService,
            SimpMessagingTemplate messagingTemplate) {
        this.bidRepository = bidRepository;
        this.redisTemplate = redisTemplate;
        this.auctionService = auctionService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Bid placeBid(Long auctionId, String userId, Double amount) {
        ReentrantLock lock = auctionLocks.computeIfAbsent(auctionId, k -> new ReentrantLock());
        lock.lock();
        try {
            // 1. Validate Auction is LIVE
            Auction auction = auctionService.getAuctionById(auctionId);
            if (auction.getStatus() != AuctionStatus.LIVE &&
                    auction.getStatus() != AuctionStatus.OPEN &&
                    auction.getStatus() != AuctionStatus.WAITING_LIVE) {
                throw new IllegalStateException("Bids can only be placed on OPEN, WAITING_LIVE, or LIVE auctions.");
            }

            // 2. Validate Bid Amount > Current Highest
            String keyHighestBid = "auction:" + auctionId + ":highestBid";
            String highestBidStr = redisTemplate.opsForValue().get(keyHighestBid);
            Double currentHighest = highestBidStr != null ? Double.parseDouble(highestBidStr) : 0.0;

            if (currentHighest == 0.0) {
                Optional<Bid> dbHighest = bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId);
                if (dbHighest.isPresent()) {
                    currentHighest = dbHighest.get().getAmount();
                }
            }

            String highestBidUser = redisTemplate.opsForValue().get("auction:" + auctionId + ":highestBidUser");
            boolean isFirstBid = "None".equals(highestBidUser);

            if (isFirstBid) {
                if (amount < currentHighest) {
                    throw new IllegalArgumentException(
                            "First bid must be at least " + currentHighest);
                }
            } else {
                if (amount <= currentHighest) {
                    throw new IllegalArgumentException(
                            "Bid amount must be higher than current highest bid: " + currentHighest);
                }
            }

            // 3. Save Bid (DB)
            Bid bid = new Bid();
            bid.setAuctionId(auctionId);
            bid.setUserId(userId);
            bid.setAmount(amount);
            bid.setTimestamp(LocalDateTime.now());

            Bid savedBid = bidRepository.save(bid);

            // 4. Update Auction Entity in DB (Sync)
            auctionService.updateAuctionPrice(auctionId, amount);

            // 5. Update Redis Live State
            LocalDateTime endTime = LocalDateTime.now().plusSeconds(30);

            redisTemplate.opsForValue().set(keyHighestBid, String.valueOf(amount));
            redisTemplate.opsForValue().set("auction:" + auctionId + ":highestBidUser", userId);
            redisTemplate.opsForValue().set("auction:" + auctionId + ":endTime", endTime.toString());

            // 6. Broadcast Update via WebSocket
            auctionService.broadcastAuctionStatus(auctionId, "BID", userId);

            return savedBid;
        } finally {
            lock.unlock();
            // Optional: periodically clean up old locks if memory is a concern
        }
    }

    public boolean hasUserBid(Long auctionId, String userId) {
        return bidRepository.existsByAuctionIdAndUserId(auctionId, userId);
    }

    public java.util.List<Bid> getUserBids(String userId) {
        return bidRepository.findByUserId(userId);
    }

    public java.util.List<Bid> getBidsByAuctionId(Long auctionId) {
        return bidRepository.findByAuctionIdOrderByAmountDesc(auctionId);
    }
}
