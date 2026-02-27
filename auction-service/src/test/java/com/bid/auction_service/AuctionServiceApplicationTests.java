package com.bid.auction_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@SpringBootTest
class AuctionServiceApplicationTests {

	@MockBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
