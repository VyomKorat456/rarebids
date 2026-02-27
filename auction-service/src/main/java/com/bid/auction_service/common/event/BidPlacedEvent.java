package com.bid.auction_service.common.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class BidPlacedEvent {
    private String id;
    private Long auctionId;
    private String userId;
    private Double amount;
    private LocalDateTime timestamp;

}
