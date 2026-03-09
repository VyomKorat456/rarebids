package com.bid.auth_service.service;

import com.bid.auth_service.dto.*;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.ws.rs.core.Response;

@Service
public class AuthService {

    private final Keycloak keycloak;
    private final RestTemplate restTemplate;

    @Value("${keycloak.realm:bid-realm}")
    private String realm;

    @Value("${keycloak.auth-server-url:http://localhost:8180}")
    private String keycloakServerUrl;

    public AuthService(Keycloak keycloak, RestTemplate restTemplate) {
        this.keycloak = keycloak;
        this.restTemplate = restTemplate;
    }

    public void registerUser(RegisterRequest request) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmailVerified(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setValue(request.getPassword());
        credential.setTemporary(false);
        credential.setType(CredentialRepresentation.PASSWORD);

        user.setCredentials(Collections.singletonList(credential));

        UsersResource usersResource = keycloak.realm(realm).users();
        System.out.println(
                ">>> KEYCLOAK CREATE USER START: " + request.getUsername() + " | Email: " + request.getEmail());
        Response response = usersResource.create(user);
        System.out.println(">>> KEYCLOAK CREATE USER STATUS: " + response.getStatus());

        if (response.getStatus() >= 400) {
            String errorMsg = response.readEntity(String.class);
            System.err.println(">>> KEYCLOAK ERROR STATUS: " + response.getStatus());
            System.err.println(">>> KEYCLOAK ERROR BODY: " + errorMsg);
            throw new RuntimeException("Keycloak user creation failed: " + response.getStatus() + " " + errorMsg);
        }
        System.out.println(">>> KEYCLOAK CREATE USER SUCCESS!");
    }

    public TokenResponse login(LoginRequest request) {
        String url = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", "bid-app-client");
        form.add("grant_type", "password");
        form.add("username", request.getUsername());
        form.add("password", request.getPassword());

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);

        ResponseEntity<TokenResponse> response = restTemplate.postForEntity(url, entity, TokenResponse.class);
        return response.getBody();
    }

    public TokenResponse refreshToken(String refreshToken) {
        String url = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", "bid-app-client");
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);

        ResponseEntity<TokenResponse> response = restTemplate.postForEntity(url, entity, TokenResponse.class);
        return response.getBody();
    }

    public List<UserResponse> getAllUsers(String search, int first, int max) {
        List<UserRepresentation> users;
        if (search != null && !search.trim().isEmpty()) {
            users = keycloak.realm(realm).users().search(search, first, max);
        } else {
            users = keycloak.realm(realm).users().list(first, max);
        }
        return users.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public UserResponse getUserById(String id) {
        return mapToResponse(keycloak.realm(realm).users().get(id).toRepresentation());
    }

    public void updateUser(String id, UserResponse request) {
        UserRepresentation existing = keycloak.realm(realm).users().get(id).toRepresentation();
        existing.setFirstName(request.getFirstName());
        existing.setLastName(request.getLastName());
        existing.setEmail(request.getEmail());
        existing.setEnabled(request.isEnabled());
        keycloak.realm(realm).users().get(id).update(existing);
    }

    public void deleteUser(String id) {
        keycloak.realm(realm).users().get(id).remove();
    }

    public int getUserCount(String search) {
        if (search != null && !search.trim().isEmpty()) {
            return keycloak.realm(realm).users().count(search);
        }
        return keycloak.realm(realm).users().count();
    }

    private UserResponse mapToResponse(UserRepresentation rep) {
        return new UserResponse(
                rep.getId(),
                rep.getUsername(),
                rep.getEmail(),
                rep.getFirstName(),
                rep.getLastName(),
                rep.isEnabled());
    }
}
