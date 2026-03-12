package com.bid.auction_service.auction.repository;

import com.bid.auction_service.auction.entity.Auction;
import com.bid.auction_service.auction.enums.AuctionStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    List<Auction> findByStatus(AuctionStatus status);

    List<Auction> findByCreatedBy(String createdBy);

    List<Auction> findByStatusIn(List<AuctionStatus> statuses);

    List<Auction> findByCreatedByOrWinnerId(String createdBy, String winnerId);

    List<Auction> findByStatusAndPaidFalse(AuctionStatus status);

    Page<Auction> findByStatusIn(List<AuctionStatus> statuses, Pageable pageable);

    Page<Auction> findByTitleContainingIgnoreCaseAndStatusIn(String title, List<AuctionStatus> statuses, Pageable pageable);
    
    Page<Auction> findByCategoryIdAndStatusIn(Long categoryId, List<AuctionStatus> statuses, Pageable pageable);

    Page<Auction> findByTitleContainingIgnoreCaseAndCategoryIdAndStatusIn(String title, Long categoryId, List<AuctionStatus> statuses, Pageable pageable);

}
