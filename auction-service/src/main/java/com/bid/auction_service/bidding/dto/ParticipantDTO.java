package com.bid.auction_service.bidding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ParticipantDTO {
    private String userId;
    private String displayName;
    private String maskedId;
    private boolean isAnonymous;
    private boolean isCreator;
    private boolean isAdmin;
}
