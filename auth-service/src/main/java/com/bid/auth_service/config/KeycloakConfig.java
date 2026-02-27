package com.bid.auth_service.config;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakConfig {

    @org.springframework.beans.factory.annotation.Value("${keycloak.server-url:http://localhost:8180}")
    private String serverUrl;

    @org.springframework.beans.factory.annotation.Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    @Bean
    public Keycloak keycloak() {
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("master")
                .clientId("admin-cli")
                .username(adminUsername)
                .password(adminPassword)
                .build();
    }
}
