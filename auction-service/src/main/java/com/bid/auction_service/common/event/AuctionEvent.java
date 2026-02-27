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
public class AuctionEvent {
    private Long auctionId;
    private String status;
    private String eventType;
    private String message;
    private LocalDateTime timestamp;

}

