package com.bid.auction_service.config;

import com.bid.auction_service.auction.service.AuctionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final AuctionService auctionService;

    // Session ID -> (Auction ID, User ID) mapping
    private final Map<String, SessionInfo> sessionTracker = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("Received a new web socket connection");
    }

    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        String sessionId = headerAccessor.getSessionId();

        if (destination != null && destination.startsWith("/topic/auction/")) {
            try {
                Long auctionId = Long.parseLong(destination.substring("/topic/auction/".length()));
                String userId = (headerAccessor.getUser() != null) ? headerAccessor.getUser().getName() : null;

                if (userId != null) {
                    logger.info("User {} subscribed to auction {}", userId, auctionId);
                    sessionTracker.put(sessionId, new SessionInfo(auctionId, userId));
                    auctionService.joinAuction(auctionId, userId, false);
                }
            } catch (Exception e) {
                logger.error("Error tracking subscription", e);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        SessionInfo info = sessionTracker.remove(sessionId);
        if (info != null) {
            logger.info("User {} disconnected from session {}", info.userId, sessionId);
            auctionService.leaveAuction(info.auctionId, info.userId);
        }
    }

    private static class SessionInfo {
        final Long auctionId;
        final String userId;

        SessionInfo(Long auctionId, String userId) {
            this.auctionId = auctionId;
            this.userId = userId;
        }
    }
}
