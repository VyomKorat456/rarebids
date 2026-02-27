package com.bid.auction_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@SpringBootTest(properties = {
		"eureka.client.enabled=false",
		"spring.cloud.discovery.enabled=false",
		"spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/rarebids",
		"spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class AuctionServiceApplicationTests {

	@MockitoBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
