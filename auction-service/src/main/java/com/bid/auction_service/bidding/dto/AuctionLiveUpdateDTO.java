package com.bid.auction_service.bidding.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuctionLiveUpdateDTO {
    private Long auctionId;
    private Double highestBid;
    private String highestBidUser;
    private LocalDateTime endTime;
    private Integer extensionCount;
    private String status;
    private java.util.List<ParticipantDTO> participants;
    private Integer participantCount;
    private String type; // BID, JOIN, LEAVE, START, END, TOGGLE_ANONYMOUS
    private String eventUser; // User who triggered this event
}
