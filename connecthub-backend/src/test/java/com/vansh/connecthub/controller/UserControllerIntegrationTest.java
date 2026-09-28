package com.vansh.connecthub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.UserRepository;
import com.vansh.connecthub.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class UserControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String memberToken;
    private User testMember;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        userRepository.findByUsername("integration_admin").ifPresent(userRepository::delete);
        userRepository.findByUsername("integration_member").ifPresent(userRepository::delete);

        User admin = User.builder()
                .username("integration_admin")
                .password("pass123")
                .role("ADMIN")
                .status("ACTIVE")
                .build();
        userRepository.save(admin);

        testMember = User.builder()
                .username("integration_member")
                .password("pass123")
                .role("MEMBER")
                .status("ACTIVE")
                .build();
        testMember = userRepository.save(testMember);

        adminToken = jwtUtils.generateToken("integration_admin");
        memberToken = jwtUtils.generateToken("integration_member");
    }

    @Test
    @DisplayName("Unauthenticated request to protected /api/users/list should return 401 Unauthorized")
    void testGetUsers_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/users/list"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Authenticated user can view /api/users/list")
    void testGetUsers_Authenticated_Returns200() throws Exception {
        mockMvc.perform(get("/api/users/list")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin can update role of a user")
    void testUpdateRole_AsAdmin_Success() throws Exception {
        mockMvc.perform(put("/api/users/" + testMember.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "TEAM_LEAD"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Regular MEMBER cannot change role of another user (Returns 403 Forbidden)")
    void testUpdateRole_AsMember_Returns403() throws Exception {
        mockMvc.perform(put("/api/users/" + testMember.getId() + "/role")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "ADMIN"))))
                .andExpect(status().isForbidden());
    }
}
