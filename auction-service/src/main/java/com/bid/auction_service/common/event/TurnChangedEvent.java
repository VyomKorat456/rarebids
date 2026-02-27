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
public class TurnChangedEvent {
    private Long auctionId;
    private String activeUser;
    private LocalDateTime turnExpiresAt;
    private List<String> nextCheck; // IDs of upcoming users

}

