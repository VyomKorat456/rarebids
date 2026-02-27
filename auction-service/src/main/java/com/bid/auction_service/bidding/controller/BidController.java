package com.bid.auction_service.bidding.controller;

import com.bid.auction_service.bidding.entity.Bid;
import com.bid.auction_service.bidding.service.BidService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bids")
public class BidController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(BidController.class);

    private final BidService bidService;

    public BidController(BidService bidService) {
        this.bidService = bidService;
    }

    @PostMapping
    public ResponseEntity<?> placeBid(@RequestParam Long auctionId, @RequestParam Double amount,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String userId = jwt.getClaimAsString("sub");
            logger.info("Placing bid for user: {} on auction: {}", userId, auctionId);
            Bid bid = bidService.placeBid(auctionId, userId, amount);
            logger.info("Bid placed successfully. Bid ID: {}", bid.getId());
            return ResponseEntity.ok(bid);
        } catch (IllegalArgumentException e) {
            logger.error("Bad request for bid placement: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Internal error placing bid", e);
            return ResponseEntity.internalServerError().body("Error placing bid: " + e.getMessage());
        }
    }

    @GetMapping("/check-eligibility")
    public ResponseEntity<Boolean> checkEligibility(@RequestParam Long auctionId, @RequestParam String userId) {
        return ResponseEntity.ok(bidService.hasUserBid(auctionId, userId));
    }

    @GetMapping("/my-bids")
    public ResponseEntity<List<Bid>> getUserBids(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        logger.info("Fetching bids for user: {}", userId);
        List<Bid> bids = bidService.getUserBids(userId);
        logger.info("Found {} bids for user: {}", bids.size(), userId);
        return ResponseEntity.ok(bids);
    }

    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<List<Bid>> getBidsByAuctionId(@PathVariable Long auctionId) {
        logger.info("Fetching all bids for auction: {}", auctionId);
        List<Bid> bids = bidService.getBidsByAuctionId(auctionId);
        logger.info("Found {} bids for auction: {}", bids.size(), auctionId);
        return ResponseEntity.ok(bids);
    }
}
