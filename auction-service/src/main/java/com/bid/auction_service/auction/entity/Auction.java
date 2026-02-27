package com.bid.auction_service.auction.entity;

import com.bid.auction_service.auction.enums.AuctionStatus;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "auctions")
@AllArgsConstructor
@NoArgsConstructor
public class Auction {

    // Getters and Setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 1000)
    private String description;

    private Double startPrice;
    private Double currentPrice;
    private Double buyNowPrice; // Instant buy price

    @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startTime;

    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endTime;

    private Long categoryId; // References Category ID
    private String itemCondition; // NEW, USED, REFURBISHED
    private String shippingInfo; // Free Shipping, Paid, Pickup
    private String tags; // Comma separated tags

    @Enumerated(EnumType.STRING)
    private AuctionStatus status; // PENDING, OPEN, LIVE, etc.

    private Integer bidCount = 0; // Local count of bids

    private String imageUrl; // /images/filename.jpg

    private String createdBy; // userId from JWT

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private String winnerId; // ID of the buyer

    private boolean paid = false;

    @Transient
    private String sellerName;

    @Transient
    private String winnerName;

}
