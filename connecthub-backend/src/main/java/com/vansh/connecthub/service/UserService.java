package com.vansh.connecthub.service;

import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Temporarily commented out until Phase 3 (Teams & Projects) Database models are created
    // public List<User> getTeamMembers(Long teamId) {
    //     return userRepository.findByTeamId(teamId);
    // }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already taken!");
        }

        // FIX: Using String instead of UserRole Enum
        if (user.getRole() == null) {
            user.setRole("MEMBER");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        userRepository.delete(user);
    }

    public User updateUser(Long userId, User updatedUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // FIX: Removed user.setEmail() because the email field was removed from the User model
        user.setUsername(updatedUser.getUsername());

        return userRepository.save(user);
    }

    public void updateRole(Long userId, String newRoleStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // FIX: Using String directly instead of converting to Enum
        user.setRole(newRoleStr.toUpperCase());
        userRepository.save(user);
    }

    public void manageUser(Long blockerId, Long targetId, String action) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new RuntimeException("Actor not found!"));
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("Target user not found!"));

        // FIX: Using String.equals() instead of Enum '==' operator
        boolean isAdmin = "ADMIN".equals(blocker.getRole()) || "PROJECT_MANAGER".equals(blocker.getRole());

        // Note: Team logic removed temporarily until Phase 3 models are built
        if (!isAdmin) {
            throw new RuntimeException("Access Denied: You cannot manage this user.");
        }

        // FIX: Using setStatus("SUSPENDED"/"ACTIVE") instead of setActive(false/true)
        if ("BLOCK".equalsIgnoreCase(action)) {
            target.setStatus("SUSPENDED");
            userRepository.save(target);
        } else if ("UNBLOCK".equalsIgnoreCase(action)) {
            target.setStatus("ACTIVE");
            userRepository.save(target);
        }
    }
}