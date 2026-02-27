package com.bid.auth_service.dto;

import lombok.Data;

@Data
public class TokenResponse {
    private String access_token;
    private String refresh_token;
    private long expires_in;
    private long refresh_expires_in;
    private String token_type;
    private String id_token;
    private int not_before_policy;
    private String session_state;
    private String scope;
}
