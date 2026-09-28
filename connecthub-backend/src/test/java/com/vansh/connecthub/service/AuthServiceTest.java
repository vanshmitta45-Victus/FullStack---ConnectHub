package com.vansh.connecthub.service;

import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.UserRepository;
import com.vansh.connecthub.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthService authService;

    private User activeUser;
    private User suspendedUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(1L)
                .username("john_doe")
                .password("encoded_pass")
                .role("MEMBER")
                .status("ACTIVE")
                .build();

        suspendedUser = User.builder()
                .id(2L)
                .username("bad_actor")
                .password("encoded_pass")
                .role("MEMBER")
                .status("SUSPENDED")
                .build();
    }

    @Test
    @DisplayName("Should successfully authenticate active user and return JWT token")
    void testLogin_Success() {
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(activeUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(jwtUtils.generateToken(authentication)).thenReturn("mocked-jwt-token");

        String token = authService.login("john_doe", "raw_password");

        assertNotNull(token);
        assertEquals("mocked-jwt-token", token);
        verify(userRepository, times(1)).findByUsername("john_doe");
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtUtils, times(1)).generateToken(authentication);
    }

    @Test
    @DisplayName("Should throw exception when attempting to log in a non-existent user")
    void testLogin_UserNotFound() {
        when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                authService.login("unknown_user", "password")
        );

        assertEquals("User not found", exception.getMessage());
        verify(authenticationManager, never()).authenticate(any());
        verify(jwtUtils, never()).generateToken(any(Authentication.class));
    }

    @Test
    @DisplayName("Should throw exception when suspended user attempts to log in")
    void testLogin_SuspendedUser() {
        when(userRepository.findByUsername("bad_actor")).thenReturn(Optional.of(suspendedUser));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                authService.login("bad_actor", "password")
        );

        assertTrue(exception.getMessage().contains("suspended"));
        verify(authenticationManager, never()).authenticate(any());
        verify(jwtUtils, never()).generateToken(any(Authentication.class));
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when password is wrong")
    void testLogin_InvalidCredentials() {
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(activeUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () ->
                authService.login("john_doe", "wrong_password")
        );

        verify(jwtUtils, never()).generateToken(any(Authentication.class));
    }

    @Test
    @DisplayName("Should successfully register a new user with hashed password and MEMBER role")
    void testRegister_Success() {
        User newUser = User.builder()
                .username("new_member")
                .password("plain_text_pw")
                .build();

        when(userRepository.existsByUsername("new_member")).thenReturn(false);
        when(passwordEncoder.encode("plain_text_pw")).thenReturn("hashed_pw");

        String result = authService.register(newUser);

        assertEquals("User registered successfully!", result);
        assertEquals("hashed_pw", newUser.getPassword());
        assertEquals("MEMBER", newUser.getRole());
        assertEquals("ACTIVE", newUser.getStatus());
        verify(userRepository, times(1)).save(newUser);
    }

    @Test
    @DisplayName("Should reject registration when username is already taken")
    void testRegister_UsernameAlreadyExists() {
        User duplicateUser = User.builder()
                .username("john_doe")
                .password("plain_text_pw")
                .build();

        when(userRepository.existsByUsername("john_doe")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                authService.register(duplicateUser)
        );

        assertTrue(exception.getMessage().contains("already taken"));
        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }
}
