package com.bid.notification_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@SpringBootTest(properties = {
		"eureka.client.enabled=false",
		"spring.cloud.discovery.enabled=false",
		"spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/rarebids"
})
class NotificationServiceApplicationTests {

	@MockitoBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
