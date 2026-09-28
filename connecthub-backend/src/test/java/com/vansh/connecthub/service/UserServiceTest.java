package com.vansh.connecthub.service;

import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User adminUser;
    private User normalUser;
    private User projectManagerUser;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username("superadmin")
                .role("ADMIN")
                .status("ACTIVE")
                .build();

        normalUser = User.builder()
                .id(2L)
                .username("jane_dev")
                .role("MEMBER")
                .status("ACTIVE")
                .build();

        projectManagerUser = User.builder()
                .id(3L)
                .username("pm_lead")
                .role("PROJECT_MANAGER")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Should return all users from repository")
    void testGetAllUsers() {
        when(userRepository.findAll()).thenReturn(Arrays.asList(adminUser, normalUser));

        List<User> users = userService.getAllUsers();

        assertNotNull(users);
        assertEquals(2, users.size());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should retrieve user by username")
    void testGetUserByUsername_Success() {
        when(userRepository.findByUsername("jane_dev")).thenReturn(Optional.of(normalUser));

        User user = userService.getUserByUsername("jane_dev");

        assertNotNull(user);
        assertEquals("jane_dev", user.getUsername());
        verify(userRepository, times(1)).findByUsername("jane_dev");
    }

    @Test
    @DisplayName("Should throw exception if user not found by username")
    void testGetUserByUsername_NotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                userService.getUserByUsername("ghost")
        );

        assertEquals("User not found!", exception.getMessage());
    }

    @Test
    @DisplayName("Should create user with encoded password and default MEMBER role")
    void testCreateUser_Success() {
        User input = User.builder()
                .username("newbie")
                .password("plain123")
                .build();

        when(userRepository.existsByUsername("newbie")).thenReturn(false);
        when(passwordEncoder.encode("plain123")).thenReturn("encoded123");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User created = userService.createUser(input);

        assertNotNull(created);
        assertEquals("MEMBER", created.getRole());
        assertEquals("encoded123", created.getPassword());
        verify(userRepository, times(1)).save(input);
    }

    @Test
    @DisplayName("Should throw exception if username already exists during creation")
    void testCreateUser_DuplicateUsername() {
        User input = User.builder()
                .username("jane_dev")
                .password("password")
                .build();

        when(userRepository.existsByUsername("jane_dev")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                userService.createUser(input)
        );

        assertEquals("Username already taken!", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should update user role")
    void testUpdateRole_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        userService.updateRole(2L, "PROJECT_MANAGER");

        assertEquals("PROJECT_MANAGER", normalUser.getRole());
        verify(userRepository, times(1)).save(normalUser);
    }

    @Test
    @DisplayName("Admin can suspend/block a user successfully")
    void testManageUser_AdminBlocksUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));

        userService.manageUser(1L, 2L, "BLOCK");

        assertEquals("SUSPENDED", normalUser.getStatus());
        verify(userRepository, times(1)).save(normalUser);
    }

    @Test
    @DisplayName("Admin can unblock/activate a user successfully")
    void testManageUser_AdminUnblocksUser_Success() {
        normalUser.setStatus("SUSPENDED");
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));

        userService.manageUser(1L, 2L, "UNBLOCK");

        assertEquals("ACTIVE", normalUser.getStatus());
        verify(userRepository, times(1)).save(normalUser);
    }

    @Test
    @DisplayName("Project Manager can also manage user status")
    void testManageUser_ProjectManagerCanManage_Success() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(projectManagerUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));

        userService.manageUser(3L, 2L, "BLOCK");

        assertEquals("SUSPENDED", normalUser.getStatus());
        verify(userRepository, times(1)).save(normalUser);
    }

    @Test
    @DisplayName("Non-admin user attempting to block another user must be denied")
    void testManageUser_NonAdminDenied() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                userService.manageUser(2L, 1L, "BLOCK")
        );

        assertTrue(exception.getMessage().contains("Access Denied"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Delete user deletes from repository")
    void testDeleteUser_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(normalUser));
        doNothing().when(userRepository).delete(normalUser);

        userService.deleteUser(2L);

        verify(userRepository, times(1)).delete(normalUser);
    }
}
