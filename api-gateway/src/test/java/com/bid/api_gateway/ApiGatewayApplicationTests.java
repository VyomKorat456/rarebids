package com.bid.api_gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@SpringBootTest
class ApiGatewayApplicationTests {

	@MockBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
