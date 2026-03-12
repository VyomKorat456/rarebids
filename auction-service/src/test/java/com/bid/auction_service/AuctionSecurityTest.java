package com.bid.auction_service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuctionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void publicAuctionsEndpoint_ShouldReturnOk() throws Exception {
        mockMvc.perform(get("/auctions"))
                .andExpect(status().isOk());
    }

    @Test
    void publicCategoriesEndpoint_ShouldReturnOk() throws Exception {
        mockMvc.perform(get("/categories"))
                .andExpect(status().isOk());
    }

    @Test
    void createAuction_WithoutJwt_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(post("/auctions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoint_WithoutJwt_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/admin/auctions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoint_WithUserRole_ShouldReturnForbidden() throws Exception {
        mockMvc.perform(get("/admin/auctions")
                        .with(jwt().authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminEndpoint_WithAdminRole_ShouldReturnOk() throws Exception {
        mockMvc.perform(get("/admin/auctions")
                        .with(jwt().authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());
    }
}
