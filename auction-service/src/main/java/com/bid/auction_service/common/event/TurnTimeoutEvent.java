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
public class TurnTimeoutEvent {
    private Long auctionId;
    private String skippedUser;
    private LocalDateTime timestamp;

}

