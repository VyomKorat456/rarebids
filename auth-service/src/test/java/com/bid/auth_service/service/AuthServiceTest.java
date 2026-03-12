package com.bid.auth_service.service;

import com.bid.auth_service.dto.*;
import com.bid.auth_service.entity.User;
import com.bid.auth_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@email.com");
        registerRequest.setPassword("password");

        testUser = User.builder()
                .id("1")
                .username("testuser")
                .email("test@email.com")
                .password("encodedPassword")
                .roles(Set.of("USER"))
                .build();
    }

    @Test
    void registerUser_Success() {
        // Scenario: New user registers with unique username and email
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        assertDoesNotThrow(() -> authService.registerUser(registerRequest));

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_DuplicateUsername() {
        // Scenario: Registration fails because username is already taken
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.registerUser(registerRequest));

        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        // Scenario: User logs in with correct credentials
        LoginRequest loginRequest = new LoginRequest("testuser", "password");
        UserDetails userDetails = mock(UserDetails.class);

        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("refresh-token");

        TokenResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("access-token", response.getAccess_token());
        assertEquals("refresh-token", response.getRefresh_token());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void refreshToken_Success() {
        // Scenario: Valid refresh token is used to generate a new access token
        String refreshToken = "valid-refresh-token";
        UserDetails userDetails = mock(UserDetails.class);

        when(jwtService.extractUsername(refreshToken)).thenReturn("testuser");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtService.isTokenValid(refreshToken, userDetails)).thenReturn(true);
        when(jwtService.generateToken(userDetails)).thenReturn("new-access-token");

        TokenResponse response = authService.refreshToken(refreshToken);

        assertNotNull(response);
        assertEquals("new-access-token", response.getAccess_token());
        assertEquals(refreshToken, response.getRefresh_token());
    }

    @Test
    void refreshToken_Invalid() {
        // Scenario: Refresh fails because the token is invalid or expired
        String refreshToken = "invalid-token";
        when(jwtService.extractUsername(refreshToken)).thenReturn("testuser");
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtService.isTokenValid(refreshToken, userDetails)).thenReturn(false);

        assertThrows(RuntimeException.class, () -> authService.refreshToken(refreshToken));
    }

    @Test
    void getUserById_Success() {
        // Scenario: Retrieving user details by ID
        when(userRepository.findById("1")).thenReturn(Optional.of(testUser));

        UserResponse response = authService.getUserById("1");

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
    }
}
