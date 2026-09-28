package com.vansh.connecthub.controller;

import com.vansh.connecthub.constant.AppConstants;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.service.AuthService;
import com.vansh.connecthub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(AppConstants.AUTH_API)
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "connecthub-backend"));
    }

    @PostMapping({"/signup", "/register"})
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> payload) {
        try {
            User user = new User();
            user.setUsername(payload.get("username"));
            // REMOVED: user.setEmail() - aligning with the new streamlined Neumorphic UI
            user.setPassword(payload.get("password"));

            String message = authService.register(user);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginRequest) {
        try {
            String username = loginRequest.get("username");
            String password = loginRequest.get("password");

            String token = authService.login(username, password);
            User user = userService.getUserByUsername(username);

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "role", user.getRole().toString(),
                    "username", user.getUsername()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }
}