package com.bid.auth_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@SpringBootTest
class AuthServiceApplicationTests {

	@MockBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
