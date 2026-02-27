package com.bid.auction_service.auction.service;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.enums.AuctionStatus;
import com.bid.auction_service.auction.repository.AuctionRepository;
import com.bid.auction_service.bidding.dto.AuctionLiveUpdateDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.bid.auction_service.bidding.repository.BidRepository;
import com.bid.auction_service.bidding.dto.ParticipantDTO;
import com.bid.auction_service.user.service.CachedUserService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AuctionService {

    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);

    private final AuctionRepository auctionRepository;
    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final CachedUserService cachedUserService;
    private final BidRepository bidRepository;

    @Value("${app.upload.dir:/app/uploads/images}")
    private String uploadDir;

    public AuctionService(AuctionRepository auctionRepository,
            StringRedisTemplate redisTemplate,
            SimpMessagingTemplate messagingTemplate,
            CachedUserService cachedUserService,
            BidRepository bidRepository) {
        this.auctionRepository = auctionRepository;
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.cachedUserService = cachedUserService;
        this.bidRepository = bidRepository;
    }

    public Auction createAuction(Auction auction, MultipartFile image) throws IOException {
        // Save Image
        if (image != null && !image.isEmpty()) {
            String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
            Path path = Paths.get(uploadDir, fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, image.getBytes());
            auction.setImageUrl("/images/" + fileName);
        }

        // Validate Price for Razorpay Test Mode Limits
        if (auction.getStartPrice() != null && auction.getStartPrice() > 500000) {
            throw new IllegalArgumentException("Start Price cannot exceed ₹5,00,000 in Test Mode.");
        }
        if (auction.getBuyNowPrice() != null && auction.getBuyNowPrice() > 500000) {
            throw new IllegalArgumentException("Buy Now Price cannot exceed ₹5,00,000 in Test Mode.");
        }

        auction.setStatus(AuctionStatus.PENDING); // Default status for Admin Approval
        auction.setCreatedAt(LocalDateTime.now());
        // Start time/End time handling if null
        if (auction.getStartTime() == null)
            auction.setStartTime(LocalDateTime.now());
        if (auction.getEndTime() == null)
            auction.setEndTime(LocalDateTime.now().plusDays(7));

        return auctionRepository.save(auction);
    }

    public List<Auction> getAllAuctions() {
        return auctionRepository.findAll();
    }

    public List<Auction> getOpenAuctions() {
        return auctionRepository.findByStatusIn(
                java.util.Arrays.asList(AuctionStatus.OPEN, AuctionStatus.WAITING_LIVE, AuctionStatus.LIVE));
    }

    public List<Auction> getPublicAuctions() {
        return auctionRepository
                .findByStatusIn(java.util.Arrays.asList(AuctionStatus.OPEN, AuctionStatus.WAITING_LIVE,
                        AuctionStatus.LIVE, AuctionStatus.SOLD, AuctionStatus.CLOSED));
    }

    public Auction getAuctionById(Long id) {
        return auctionRepository.findById(id).orElseThrow(() -> new RuntimeException("Auction not found"));
    }

    public void approveAuction(Long id) {
        Auction auction = getAuctionById(id);
        auction.setStatus(AuctionStatus.OPEN);
        auctionRepository.save(auction);
    }

    public Auction updateAuction(Long id, Auction updatedInfo) {
        Auction auction = getAuctionById(id);

        if (updatedInfo.getTitle() != null)
            auction.setTitle(updatedInfo.getTitle());
        if (updatedInfo.getDescription() != null)
            auction.setDescription(updatedInfo.getDescription());
        if (updatedInfo.getStartPrice() != null)
            auction.setStartPrice(updatedInfo.getStartPrice());
        if (updatedInfo.getBuyNowPrice() != null)
            auction.setBuyNowPrice(updatedInfo.getBuyNowPrice());
        if (updatedInfo.getCategoryId() != null)
            auction.setCategoryId(updatedInfo.getCategoryId());
        if (updatedInfo.getItemCondition() != null)
            auction.setItemCondition(updatedInfo.getItemCondition());
        if (updatedInfo.getShippingInfo() != null)
            auction.setShippingInfo(updatedInfo.getShippingInfo());
        if (updatedInfo.getTags() != null)
            auction.setTags(updatedInfo.getTags());
        if (updatedInfo.getEndTime() != null)
            auction.setEndTime(updatedInfo.getEndTime());

        return auctionRepository.save(auction);
    }

    public void rejectAuction(Long id) {
        Auction auction = getAuctionById(id);
        auction.setStatus(AuctionStatus.REJECTED);
        auctionRepository.save(auction);
    }

    public void markAsSold(Long id, String winnerId) {
        markAsSold(id, winnerId, false);
    }

    public void markAsSold(Long id, String winnerId, boolean paid) {
        Auction auction = getAuctionById(id);
        auction.setStatus(AuctionStatus.SOLD);
        auction.setWinnerId(winnerId);
        auction.setPaid(paid);
        // Only update end time if it's naturally closing (no end time set)
        if (auction.getEndTime() == null) {
            auction.setEndTime(LocalDateTime.now());
        }
        auctionRepository.save(auction);
    }

    public void closeAuction(Long id) {
        Auction auction = getAuctionById(id);
        auction.setStatus(AuctionStatus.CLOSED);
        auction.setEndTime(LocalDateTime.now());
        auctionRepository.save(auction);
    }

    public void startLiveAuction(Long id) {
        Auction auction = getAuctionById(id);
        if (auction.getStatus() != AuctionStatus.WAITING_LIVE && auction.getStatus() != AuctionStatus.OPEN) {
            throw new IllegalStateException("Auction can only be started LIVE if it is OPEN or WAITING_LIVE.");
        }

        auction.setStatus(AuctionStatus.LIVE);
        auctionRepository.save(auction);
        log.info("Auction ID {} starting LIVE.", auction.getId());

        // Initialize Redis State
        LocalDateTime endTime = LocalDateTime.now().plusSeconds(30);
        redisTemplate.opsForValue().set("auction:" + id + ":highestBid", String
                .valueOf(auction.getCurrentPrice() != null ? auction.getCurrentPrice() : auction.getStartPrice()));
        redisTemplate.opsForValue().set("auction:" + id + ":highestBidUser", "None");
        redisTemplate.opsForValue().set("auction:" + id + ":endTime", endTime.toString());
        redisTemplate.opsForValue().set("auction:" + id + ":extensionCount", "0");

        // Broadcast START event
        broadcastAuctionStatus(id, "START");
    }

    public void joinAuction(Long auctionId, String userId, boolean isAdmin) {
        log.info("User {} joining auction {}", userId, auctionId);
        String participantsKey = "auction:" + auctionId + ":participants";
        String maskedKey = "auction:" + auctionId + ":participant:" + userId + ":maskedId";

        // Generate masked ID if not exists
        if (redisTemplate.opsForValue().get(maskedKey) == null) {
            String shortCode = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            redisTemplate.opsForValue().set(maskedKey, "Bidder#" + shortCode);
        }

        // Add to participants list regardless of hasBid (tracking all active users)
        redisTemplate.opsForSet().add(participantsKey, userId);

        boolean hasBid = bidRepository.existsByAuctionIdAndUserId(auctionId, userId);
        if (hasBid || isAdmin) {
            broadcastAuctionStatus(auctionId, "JOIN", userId);
        } else {
            log.info("User {} joined as viewer", userId);
            broadcastAuctionStatus(auctionId, "JOIN", userId);
        }
    }

    public void leaveAuction(Long auctionId, String userId) {
        log.info("User {} leaving auction {}", userId, auctionId);
        String participantsKey = "auction:" + auctionId + ":participants";
        redisTemplate.opsForSet().remove(participantsKey, userId);
        broadcastAuctionStatus(auctionId, "LEAVE");
    }

    public void toggleAnonymous(Long auctionId, String userId) {
        String anonKey = "auction:" + auctionId + ":participant:" + userId + ":anonymous";
        String current = redisTemplate.opsForValue().get(anonKey);
        boolean newVal = !"true".equals(current);
        redisTemplate.opsForValue().set(anonKey, String.valueOf(newVal));

        broadcastAuctionStatus(auctionId, "TOGGLE_ANONYMOUS");
    }

    public Double getHighestBidFallback(Long auctionId) {
        String highestBidStr = redisTemplate.opsForValue().get("auction:" + auctionId + ":highestBid");
        if (highestBidStr != null && !"0.0".equals(highestBidStr)) {
            return Double.parseDouble(highestBidStr);
        }

        // Fallback to Auction entity currentPrice (which should be updated by
        // BidService)
        Auction auction = getAuctionById(auctionId);
        return auction.getCurrentPrice() != null ? auction.getCurrentPrice() : auction.getStartPrice();
    }

    public void extendTime(Long auctionId) {
        String keyEndTime = "auction:" + auctionId + ":endTime";
        String endTimeStr = redisTemplate.opsForValue().get(keyEndTime);
        if (endTimeStr != null) {
            LocalDateTime endTime = LocalDateTime.parse(endTimeStr).plusSeconds(30);
            redisTemplate.opsForValue().set(keyEndTime, endTime.toString());
            broadcastAuctionStatus(auctionId, "TIME_EXTENDED");
        }
    }

    public void updateAuctionPrice(Long auctionId, Double newPrice) {
        Auction auction = getAuctionById(auctionId);
        auction.setCurrentPrice(newPrice);
        auctionRepository.save(auction);
    }

    public List<ParticipantDTO> getParticipants(Long auctionId) {
        String participantsKey = "auction:" + auctionId + ":participants";
        java.util.Set<String> userIds = redisTemplate.opsForSet().members(participantsKey);
        Auction auction = getAuctionById(auctionId);

        return userIds.stream().map(uid -> {
            String anonKey = "auction:" + auctionId + ":participant:" + uid + ":anonymous";
            String maskedKey = "auction:" + auctionId + ":participant:" + uid + ":maskedId";
            boolean isAnon = "true".equals(redisTemplate.opsForValue().get(anonKey));
            String maskedId = redisTemplate.opsForValue().get(maskedKey);
            String displayName = cachedUserService.getUserName(uid);

            return ParticipantDTO.builder()
                    .userId(uid)
                    .displayName(displayName)
                    .maskedId(maskedId)
                    .isAnonymous(isAnon)
                    .isCreator(uid.equals(auction.getCreatedBy()))
                    .isAdmin(false) // Simplified, could check roles
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    public void broadcastAuctionStatus(Long auctionId, String type) {
        broadcastAuctionStatus(auctionId, type, null);
    }

    public void broadcastAuctionStatus(Long auctionId, String type, String triggerUser) {
        Auction auction = getAuctionById(auctionId);
        String highestBidStr = redisTemplate.opsForValue().get("auction:" + auctionId + ":highestBid");
        String highestBidUser = redisTemplate.opsForValue().get("auction:" + auctionId + ":highestBidUser");
        String endTimeStr = redisTemplate.opsForValue().get("auction:" + auctionId + ":endTime");
        String extCountStr = redisTemplate.opsForValue().get("auction:" + auctionId + ":extensionCount");

        List<ParticipantDTO> participants = getParticipants(auctionId);

        // Masking logic if needed for highestBidUser
        String maskedHighestBidUser = highestBidUser;
        String maskedTriggerUser = triggerUser;

        for (ParticipantDTO p : participants) {
            if (highestBidUser != null && p.getUserId().equals(highestBidUser)) {
                maskedHighestBidUser = p.isAnonymous() ? p.getMaskedId() : p.getDisplayName();
            }
            if (triggerUser != null && p.getUserId().equals(triggerUser)) {
                maskedTriggerUser = p.isAnonymous() ? p.getMaskedId() : p.getDisplayName();
            }
        }

        AuctionLiveUpdateDTO updateDTO = new AuctionLiveUpdateDTO();
        updateDTO.setAuctionId(auctionId);
        updateDTO.setHighestBid(
                highestBidStr != null ? Double.parseDouble(highestBidStr) : getHighestBidFallback(auctionId));
        updateDTO.setHighestBidUser(maskedHighestBidUser != null ? maskedHighestBidUser : "None");
        updateDTO.setEndTime(endTimeStr != null ? LocalDateTime.parse(endTimeStr) : auction.getEndTime());
        updateDTO.setExtensionCount(extCountStr != null ? Integer.parseInt(extCountStr) : 0);
        updateDTO.setStatus(auction.getStatus().toString());
        updateDTO.setParticipants(participants);
        updateDTO.setParticipantCount(participants.size());
        updateDTO.setType(type);
        updateDTO.setEventUser(maskedTriggerUser);

        log.info("Broadcasting update for Auction {}: Type={}, Status={}", auctionId, type, updateDTO.getStatus());
        messagingTemplate.convertAndSend("/topic/auction/" + auctionId, updateDTO);
    }

    public void stopAuction(Long id) {
        Auction auction = getAuctionById(id);
        if (auction.getStatus() != AuctionStatus.LIVE) {
            return; // Already stopped
        }

        // Determine winner
        String highestBidUser = redisTemplate.opsForValue().get("auction:" + id + ":highestBidUser");

        if (highestBidUser != null && !"None".equals(highestBidUser)) {
            auction.setWinnerId(highestBidUser);
            auction.setStatus(AuctionStatus.SOLD);
            log.info("Auction ID {} sold to user {}.", id, highestBidUser);
        } else {
            auction.setStatus(AuctionStatus.CLOSED); // Or UNSOLD if you prefer
            log.info("Auction ID {} closed with no winner.", id);
        }

        auction.setEndTime(LocalDateTime.now());
        auctionRepository.save(auction);

        // Broadcast END via WebSocket before cleanup
        broadcastAuctionStatus(id, "END");

        // Cleanup Redis
        String pKey = "auction:" + id + ":participants";
        redisTemplate.delete(Set.of(
                "auction:" + id + ":highestBid",
                "auction:" + id + ":highestBidUser",
                "auction:" + id + ":endTime",
                "auction:" + id + ":extensionCount",
                pKey));
    }

    public Auction reopenAuction(Long id, Auction updatedInfo) {
        Auction auction = getAuctionById(id);

        if (auction.getStatus() == AuctionStatus.OPEN || auction.getStatus() == AuctionStatus.WAITING_LIVE
                || auction.getStatus() == AuctionStatus.LIVE) {
            throw new IllegalStateException("Cannot reopen an active auction. Close it first.");
        }

        if (auction.isPaid()) {
            throw new IllegalStateException("Cannot reopen a PAID auction.");
        }

        auction.setWinnerId(null);
        auction.setPaid(false);
        auction.setStatus(AuctionStatus.OPEN);

        if (updatedInfo.getEndTime() != null) {
            auction.setEndTime(updatedInfo.getEndTime());
        } else {
            auction.setEndTime(LocalDateTime.now().plusDays(1));
        }

        if (updatedInfo.getStartPrice() != null) {
            auction.setStartPrice(updatedInfo.getStartPrice());
            auction.setCurrentPrice(updatedInfo.getStartPrice());
        }

        if (updatedInfo.getBuyNowPrice() != null) {
            auction.setBuyNowPrice(updatedInfo.getBuyNowPrice());
        }

        log.info("Auction ID {} REOPENED.", auction.getId());
        return auctionRepository.save(auction);
    }

    public String getRedisValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteAuction(Long id) {
        auctionRepository.deleteById(id);
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60000) // Every minute
    public void cleanupUnpaidAuctions() {
        List<Auction> soldAuctions = auctionRepository.findByStatusAndPaidFalse(AuctionStatus.SOLD);
        LocalDateTime now = LocalDateTime.now();

        for (Auction auction : soldAuctions) {
            if (auction.getEndTime() != null && auction.getEndTime().plusMinutes(30).isBefore(now)) {
                log.info("Auction {} unpaid for 30 minutes. Marking as UNSOLD.", auction.getId());
                auction.setStatus(AuctionStatus.UNSOLD);
                auction.setWinnerId(null);
                auctionRepository.save(auction);
                broadcastAuctionStatus(auction.getId(), "END");
            }
        }
    }
}
