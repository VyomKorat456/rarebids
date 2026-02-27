package com.bid.auction_service.user.repository;

import com.bid.auction_service.user.entity.AuctionUser;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionUserRepository extends JpaRepository<AuctionUser, String> {
}
