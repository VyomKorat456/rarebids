package com.bid.auction_service.bidding.repository;

import com.bid.auction_service.bidding.entity.Bid;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAuctionIdOrderByAmountDesc(Long auctionId);

    Optional<Bid> findTopByAuctionIdOrderByAmountDesc(Long auctionId);

    // Check if user has placed a bid on this auction (for gatekeeping)
    boolean existsByAuctionIdAndUserId(Long auctionId, String userId);

    List<Bid> findByUserId(String userId);
}
