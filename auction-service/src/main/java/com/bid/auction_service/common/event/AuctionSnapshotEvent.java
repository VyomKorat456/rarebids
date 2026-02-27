package com.bid.auction_service.common.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class AuctionSnapshotEvent {

    // Getters and Setters
    private Long auctionId;
    private String status; // OPEN, READY_CHECK, LIVE, SOLD
    private List<String> participants;
    private List<String> readyUsers;
    private String currentTurnUser;
    private LocalDateTime turnExpiry;
    private Double highestBid;
    private String highestBidUser;
    private LocalDateTime lastBidTime;
    private Double minimumIncrement;
    private LocalDateTime auctionEndTime;
    private Long version;

}
