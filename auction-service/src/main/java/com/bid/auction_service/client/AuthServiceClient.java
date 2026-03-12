package com.bid.auction_service.client;

import com.bid.auction_service.user.dto.UserEvent; // Reusing this DTO for response
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service")
public interface AuthServiceClient {

    @GetMapping("/auth/users/username/{username}")
    UserEvent getUserByUsername(@PathVariable("username") String username);

    @GetMapping("/auth/users/{id}")
    UserEvent getUserById(@PathVariable("id") String id);
}
