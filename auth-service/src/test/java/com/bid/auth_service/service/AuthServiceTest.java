package com.bid.auth_service.service;

import com.bid.auth_service.dto.*;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private Keycloak keycloak;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private RealmResource realmResource;

    @Mock
    private UsersResource usersResource;

    @Mock
    private UserResource userResource;

    @InjectMocks
    private AuthService authService;

    private final String realm = "test-realm";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "realm", realm);
        ReflectionTestUtils.setField(authService, "keycloakServerUrl", "http://localhost:8180");
    }

    @Test
    void registerUser_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password");
        request.setFirstName("Test");
        request.setLastName("User");

        when(keycloak.realm(realm)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        Response response = mock(Response.class);
        when(response.getStatus()).thenReturn(201);
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);

        assertDoesNotThrow(() -> authService.registerUser(request));

        ArgumentCaptor<UserRepresentation> userCaptor = ArgumentCaptor.forClass(UserRepresentation.class);
        verify(usersResource).create(userCaptor.capture());
        UserRepresentation capturedUser = userCaptor.getValue();
        assertEquals("testuser", capturedUser.getUsername());
        assertEquals("test@example.com", capturedUser.getEmail());
        assertTrue(capturedUser.isEnabled());
    }

    @Test
    void registerUser_Failure() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");

        when(keycloak.realm(realm)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        Response response = mock(Response.class);
        when(response.getStatus()).thenReturn(400);
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.registerUser(request));
        assertTrue(exception.getMessage().contains("Failed to create user. Status: 400"));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password");

        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setAccess_token("access-token");

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(TokenResponse.class)))
                .thenReturn(ResponseEntity.ok(tokenResponse));

        TokenResponse result = authService.login(request);

        assertNotNull(result);
        assertEquals("access-token", result.getAccess_token());
    }

    @Test
    void getAllUsers_WithSearch() {
        UserRepresentation userRep = new UserRepresentation();
        userRep.setId("1");
        userRep.setUsername("testuser");
        userRep.setEnabled(true);

        when(keycloak.realm(realm)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.search("test", 0, 10)).thenReturn(Collections.singletonList(userRep));

        List<UserResponse> result = authService.getAllUsers("test", 0, 10);

        assertEquals(1, result.size());
        assertEquals("testuser", result.get(0).getUsername());
    }

    @Test
    void getUserById_Success() {
        UserRepresentation userRep = new UserRepresentation();
        userRep.setId("1");
        userRep.setUsername("testuser");
        userRep.setEnabled(true);

        when(keycloak.realm(realm)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.get("1")).thenReturn(userResource);
        when(userResource.toRepresentation()).thenReturn(userRep);

        UserResponse result = authService.getUserById("1");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
    }

    @Test
    void updateUser_Success() {
        UserResponse request = new UserResponse("1", "testuser", "test@example.com", "New", "Name", true);
        UserRepresentation existing = new UserRepresentation();

        when(keycloak.realm(realm)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.get("1")).thenReturn(userResource);
        when(userResource.toRepresentation()).thenReturn(existing);

        authService.updateUser("1", request);

        verify(userResource).update(any(UserRepresentation.class));
        assertEquals("New", existing.getFirstName());
        assertEquals("Name", existing.getLastName());
    }

    @Test
    void deleteUser_Success() {
        when(keycloak.realm(realm)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.get("1")).thenReturn(userResource);

        authService.deleteUser("1");

        verify(userResource).remove();
    }
}
