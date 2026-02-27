package com.bid.auction_service.common.security;

import com.bid.auction_service.bidding.service.BidService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    private final BidService bidService;
    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    public WebSocketAuthInterceptor(
            @org.springframework.context.annotation.Lazy com.bid.auction_service.bidding.service.BidService bidService,
            @org.springframework.context.annotation.Lazy JwtDecoder jwtDecoder,
            @org.springframework.context.annotation.Lazy JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.bidService = bidService;
        this.jwtDecoder = jwtDecoder;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    Jwt jwt = jwtDecoder.decode(token);
                    AbstractAuthenticationToken authentication = jwtAuthenticationConverter.convert(jwt);
                    accessor.setUser(authentication);
                    log.info("WebSocket user authenticated: {}", authentication.getName());
                } catch (Exception e) {
                    log.error("WebSocket auth failed for token: {} - Error: {}",
                            token.substring(0, Math.min(token.length(), 10)) + "...", e.getMessage());
                }
            } else {
                log.warn("WebSocket connection attempt without valid Bearer token in CONNECT header");
            }
        }

        return message;
    }
}
