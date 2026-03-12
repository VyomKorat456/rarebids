package com.bid.auction_service.user.service;

import com.bid.auction_service.client.AuthServiceClient;
import com.bid.auction_service.user.dto.UserEvent;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class CachedUserService {

    private final AuthServiceClient authServiceClient;
    private final StringRedisTemplate redisTemplate;

    public CachedUserService(AuthServiceClient authServiceClient, StringRedisTemplate redisTemplate) {
        this.authServiceClient = authServiceClient;
        this.redisTemplate = redisTemplate;
    }

    public String getUserName(String userId) {
        if (userId == null || userId.isEmpty()) {
            return "Unknown Seller";
        }

        String cacheKey = "user_name:" + userId;
        try {
            String cachedName = redisTemplate.opsForValue().get(cacheKey);
            if (cachedName != null) {
                return cachedName;
            }
        } catch (Exception e) {
            System.err.println("Redis is down or unreachable: " + e.getMessage());
            // Fallback to direct fetch if Redis fails
        }

        return fetchAndCacheUser(userId, cacheKey);
    }

    private String fetchAndCacheUser(String userId, String cacheKey) {
        try {
            UserEvent user;
            if (isUUID(userId)) {
                user = authServiceClient.getUserById(userId);
            } else {
                user = authServiceClient.getUserByUsername(userId);
            }
            
            String fullName = (user.getFirstName() != null ? user.getFirstName() : "") +
                    (user.getLastName() != null ? " " + user.getLastName() : "");
            String finalName = fullName.trim().isEmpty() ? user.getUsername() : fullName.trim();

            if (finalName != null && !finalName.isEmpty()) {
                try {
                    redisTemplate.opsForValue().set(cacheKey, finalName, 1, TimeUnit.HOURS);
                } catch (Exception e) {
                    System.err.println("Failed to cache user name: " + e.getMessage());
                }
            }
            return finalName;
        } catch (Exception e) {
            System.err.println("Failed to fetch user from auth-service for ID " + userId + ": " + e.getMessage());
            return "User: " + (userId.length() > 8 ? userId.substring(0, 8) : userId); // Graceful fallback
        }
    }

    private boolean isUUID(String str) {
        if (str == null) return false;
        return str.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    }
}
