package com.bid.auction_service.auction.controller;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.repository.AuctionRepository;
import com.bid.auction_service.auction.service.AuctionService;
import com.bid.auction_service.user.service.CachedUserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import com.bid.auction_service.bidding.dto.AuctionLiveUpdateDTO;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping
public class AuctionController {

    private final AuctionService auctionService;
    private final CachedUserService cachedUserService;
    private final AuctionRepository auctionRepository;

    @GetMapping("/debug/info")
    public ResponseEntity<java.util.Map<String, String>> getDebugInfo() {
        java.util.Map<String, String> info = new java.util.HashMap<>();
        info.put("version", "1.0.1-REFIX");
        info.put("status", "UP");
        info.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(info);
    }

    @Value("${app.upload.dir:/app/uploads/images}")
    private String uploadDir;

    public AuctionController(AuctionService auctionService,
                             CachedUserService cachedUserService, AuctionRepository auctionRepository) {
        this.auctionService = auctionService;
        this.cachedUserService = cachedUserService;
        this.auctionRepository = auctionRepository;
    }

    @PostMapping(path = "/auctions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Auction> createAuction(
            @ModelAttribute Auction auction,
            @RequestParam(required = false) MultipartFile image,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        System.out.println(">>> createAuction controller HIT <<<");

        if (jwt != null) {
            auction.setCreatedBy(jwt.getSubject());
        }

        Auction createdAuction = auctionService.createAuction(auction, image);
        return ResponseEntity.ok(createdAuction);
    }

    private void populateSellerName(Auction auction) {
        if (auction.getCreatedBy() != null) {
            String sellerName = cachedUserService.getUserName(auction.getCreatedBy());
            auction.setSellerName(sellerName);
        }
        if (auction.getWinnerId() != null) {
            String winnerName = cachedUserService.getUserName(auction.getWinnerId());
            auction.setWinnerName(winnerName);
        }
    }

    // --- USER APIs ---

    @GetMapping("/auctions")
    public ResponseEntity<List<Auction>> getAllAuctions() {
        // Return only OPEN auctions
        List<Auction> auctions = auctionService.getOpenAuctions();
        auctions.forEach(this::populateSellerName);
        return ResponseEntity.ok(auctions);
    }

    @GetMapping("/auctions/all")
    public ResponseEntity<List<Auction>> getPublicAuctions() {
        // Return OPEN, SOLD, CLOSED (Publicly visible)
        List<Auction> auctions = auctionService.getPublicAuctions();
        auctions.forEach(this::populateSellerName);
        return ResponseEntity.ok(auctions);
    }

    @GetMapping("/auctions/{id}")
    public ResponseEntity<Auction> getAuctionById(@PathVariable Long id) {
        Auction auction = auctionService.getAuctionById(id);
        populateSellerName(auction);
        return ResponseEntity.ok(auction);
    }

    @GetMapping("/auctions/history")
    public ResponseEntity<List<Auction>> getAuctionHistory(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null)
            return ResponseEntity.status(401).build();
        String userId = jwt.getSubject();
        List<Auction> history = auctionRepository.findByCreatedByOrWinnerId(userId, userId);
        history.forEach(this::populateSellerName);
        return ResponseEntity.ok(history);
    }

    // --- JOIN / BIDDING APIs ---

    @GetMapping("/auctions/{id}/status")
    public ResponseEntity<com.bid.auction_service.bidding.dto.AuctionLiveUpdateDTO> getAuctionLiveStatus(
            @PathVariable Long id) {
        Auction auction = auctionService.getAuctionById(id);

        String highestBidStr = auctionService.getRedisValue("auction:" + id + ":highestBid");
        String highestBidUser = auctionService.getRedisValue("auction:" + id + ":highestBidUser");
        String endTimeStr = auctionService.getRedisValue("auction:" + id + ":endTime");
        String extensionCountStr = auctionService.getRedisValue("auction:" + id + ":extensionCount");

        com.bid.auction_service.bidding.dto.AuctionLiveUpdateDTO status = new com.bid.auction_service.bidding.dto.AuctionLiveUpdateDTO();
        status.setAuctionId(id);
        status.setHighestBid(auctionService.getHighestBidFallback(id));
        status.setHighestBidUser(highestBidUser != null ? highestBidUser : "None");
        status.setEndTime(endTimeStr != null ? LocalDateTime.parse(endTimeStr) : auction.getEndTime());
        status.setExtensionCount(extensionCountStr != null ? Integer.parseInt(extensionCountStr) : 0);
        status.setStatus(auction.getStatus().toString());

        java.util.List<com.bid.auction_service.bidding.dto.ParticipantDTO> participants = auctionService
                .getParticipants(id);
        status.setParticipants(participants);
        status.setParticipantCount(participants.size());

        return ResponseEntity.ok(status);
    }

    @PostMapping("/auctions/{id}/start")
    public ResponseEntity<String> startAuction(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        try {
            Auction auction = auctionService.getAuctionById(id);
            String userId = jwt.getSubject();
            boolean isAdmin = jwt.getClaimAsStringList("realm_access.roles") != null &&
                    jwt.getClaimAsStringList("realm_access.roles").contains("ADMIN");

            if (!isAdmin && !userId.equals(auction.getCreatedBy())) {
                return ResponseEntity.status(403).body("Only Admin or Creator can start the auction.");
            }

            auctionService.startLiveAuction(id);
            return ResponseEntity.ok("Auction " + id + " is now LIVE");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error starting auction: " + e.getMessage());
        }
    }

    @PostMapping("/auctions/{id}/force-end")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> forceEndAuction(@PathVariable Long id) {
        try {
            auctionService.stopAuction(id);
            return ResponseEntity.ok("Auction " + id + " force ended.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error ending auction: " + e.getMessage());
        }
    }

    @PostMapping("/auctions/{id}/toggle-anonymous")
    public ResponseEntity<String> toggleAnonymous(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        try {
            auctionService.toggleAnonymous(id, jwt.getSubject());
            return ResponseEntity.ok("Anonymous state toggled");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error toggling anonymous: " + e.getMessage());
        }
    }

    @PostMapping("/auctions/{id}/extend")
    public ResponseEntity<String> extendAuctionTime(@PathVariable Long id) {
        try {
            auctionService.extendTime(id);
            return ResponseEntity.ok("Auction " + id + " time extended");
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error extending auction: " + e.getMessage());
        }
    }

    @PostMapping("/auctions/{id}/join")
    public ResponseEntity<String> joinAuction(@PathVariable Long id, @RequestParam String userId) {
        try {
            auctionService.joinAuction(id, userId, false);
            return ResponseEntity.ok("Joined auction " + id);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error joining auction: " + e.getMessage());
        }
    }

    // --- PUBLIC APIs ---

    @GetMapping("/debug/storage")
    public ResponseEntity<List<String>> debugStorage() throws IOException {
        Path path = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!java.nio.file.Files.exists(path)) {
            return ResponseEntity.ok(List.of("Directory NOT FOUND: " + path.toString()));
        }
        List<String> files = java.nio.file.Files.list(path)
                .map(p -> p.getFileName().toString())
                .collect(java.util.stream.Collectors.toList());
        files.add(0, "Resolved Dir: " + path.toString());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) throws MalformedURLException {
        // Decode filename just in case it's double encoded
        String decodedFilename = java.net.URLDecoder.decode(filename, java.nio.charset.StandardCharsets.UTF_8);

        Path path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(decodedFilename);
        System.out.println(">>> Requested: " + filename + " | Resolved to: " + path.toString());

        if (!java.nio.file.Files.exists(path)) {
            System.err.println(">>> FILE NOT FOUND at: " + path.toString());
            // Try one more time with the original (undecoded) filename if different
            if (!decodedFilename.equals(filename)) {
                path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
                if (java.nio.file.Files.exists(path)) {
                    System.out.println(">>> Found with UNDECODED filename: " + path.toString());
                } else {
                    return ResponseEntity.notFound().build();
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        }

        Resource resource = new UrlResource(path.toUri());
        if (resource.exists() || resource.isReadable()) {
            String contentType = "image/jpeg";
            if (decodedFilename.toLowerCase().endsWith(".png"))
                contentType = "image/png";
            if (decodedFilename.toLowerCase().endsWith(".gif"))
                contentType = "image/gif";
            if (decodedFilename.toLowerCase().endsWith(".webp"))
                contentType = "image/webp";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
