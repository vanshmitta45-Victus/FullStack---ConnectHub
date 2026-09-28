package com.vansh.connecthub.service;

import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.UserRepository;
import com.vansh.connecthub.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use the new String status field to prevent suspended users from logging in
        if ("SUSPENDED".equals(user.getStatus())) {
            throw new RuntimeException("Your account has been suspended. Contact an administrator.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtils.generateToken(authentication);
    }

    public String register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("MEMBER");
        user.setStatus("ACTIVE");

        userRepository.save(user);
        return "User registered successfully!";
    }
}