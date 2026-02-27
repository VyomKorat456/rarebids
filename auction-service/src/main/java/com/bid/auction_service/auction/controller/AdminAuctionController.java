package com.bid.auction_service.auction.controller;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.service.AuctionService;
import com.bid.auction_service.user.service.CachedUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/auctions")
public class AdminAuctionController {

    private final AuctionService auctionService;
    private final CachedUserService cachedUserService;

    public AdminAuctionController(AuctionService auctionService, CachedUserService cachedUserService) {
        this.auctionService = auctionService;
        this.cachedUserService = cachedUserService;
    }

    @GetMapping
    public ResponseEntity<List<Auction>> getAllAuctions() {
        List<Auction> auctions = auctionService.getAllAuctions();
        auctions.forEach(this::populateNames);
        return ResponseEntity.ok(auctions);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approveAuction(@PathVariable Long id) {
        auctionService.approveAuction(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> rejectAuction(@PathVariable Long id) {
        auctionService.rejectAuction(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/start-live")
    public ResponseEntity<Void> startLiveAuction(@PathVariable Long id) {
        auctionService.startLiveAuction(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/stop-sold")
    public ResponseEntity<Void> stopAuction(@PathVariable Long id) {
        auctionService.stopAuction(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/extend-time")
    public ResponseEntity<Void> extendTime(@PathVariable Long id) {
        auctionService.extendTime(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<Void> closeAuction(@PathVariable Long id) {
        auctionService.closeAuction(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAuction(@PathVariable Long id) {
        auctionService.deleteAuction(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reopen")
    public ResponseEntity<Auction> reopenAuction(@PathVariable Long id, @RequestBody Auction updatedInfo) {
        Auction auction = auctionService.reopenAuction(id, updatedInfo);
        populateNames(auction);
        return ResponseEntity.ok(auction);
    }

    private void populateNames(Auction auction) {
        if (auction == null)
            return;
        try {
            if (auction.getCreatedBy() != null) {
                auction.setSellerName(cachedUserService.getUserName(auction.getCreatedBy()));
            }
            if (auction.getWinnerId() != null) {
                auction.setWinnerName(cachedUserService.getUserName(auction.getWinnerId().toString()));
            }
        } catch (Exception e) {
            System.err.println("Failed to populate names for auction " + auction.getId() + ": " + e.getMessage());
        }
    }
}
