package com.bid.auction_service.auction.service;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.enums.AuctionStatus;
import com.bid.auction_service.auction.repository.AuctionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class AuctionScheduler {

    private static final Logger log = LoggerFactory.getLogger(AuctionScheduler.class);

    private final AuctionRepository auctionRepository;
    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuctionService auctionService;

    public AuctionScheduler(AuctionRepository auctionRepository,
            StringRedisTemplate redisTemplate,
            SimpMessagingTemplate messagingTemplate,
            AuctionService auctionService) {
        this.auctionRepository = auctionRepository;
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.auctionService = auctionService;
    }

    @Scheduled(fixedRate = 1000) // Pulse every second
    @Transactional
    public void monitorLiveAuctions() {
        List<Auction> liveAuctions = auctionRepository.findByStatus(AuctionStatus.LIVE);
        if (liveAuctions.isEmpty())
            return;

        LocalDateTime now = LocalDateTime.now();

        for (Auction auction : liveAuctions) {
            String endTimeStr = redisTemplate.opsForValue().get("auction:" + auction.getId() + ":endTime");
            if (endTimeStr != null) {
                LocalDateTime endTime = LocalDateTime.parse(endTimeStr);
                if (now.isAfter(endTime)) {
                    log.info("Auction {} expired. Ending now.", auction.getId());
                    auctionService.stopAuction(auction.getId());
                }
            }
        }
    }

    /* The second scheduler is now consolidated above */
}
