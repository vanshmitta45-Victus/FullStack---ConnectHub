package com.vansh.connecthub.controller;

import com.vansh.connecthub.model.AuditLog;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.AuditLogRepository;
import com.vansh.connecthub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost", "http://localhost:80", "http://host.docker.internal:5173", "http://host.docker.internal"})
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Helper method to record audit log
    private void recordAudit(String log) {
        recordAudit(log, "System", "SYSTEM", "USER", null, null, null);
    }

    private void recordAudit(String log, String actor, String actionType, String entityType, String entityId, String prev, String next) {
        try {
            AuditLog audit = AuditLog.builder()
                    .actionLog(log)
                    .actor(actor)
                    .actionType(actionType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .previousValue(prev)
                    .newValue(next)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            auditLogRepository.save(audit);
        } catch (Exception e) {
            System.err.println("Failed to write audit log: " + e.getMessage());
        }
    }

    // Helper to get actor
    private String getActor(Authentication authentication) {
        return (authentication != null && authentication.getName() != null) ? authentication.getName() : "System";
    }

    // RBAC Permission Evaluator
    private String getActorRole(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return "VIEWER";
        Optional<User> actorOpt = userRepository.findByUsername(authentication.getName());
        return actorOpt.map(u -> u.getRole() != null ? u.getRole().toUpperCase() : "MEMBER").orElse("VIEWER");
    }

    private boolean canManageUsers(String role) {
        return "ADMIN".equals(role) || "PROJECT_MANAGER".equals(role);
    }

    private boolean canDeleteUsers(String role) {
        return "ADMIN".equals(role);
    }

    // Comprehensive Permission Matrix Endpoint (Requirement 11)
    @GetMapping("/permissions")
    public ResponseEntity<?> getPermissionsMatrix() {
        Map<String, Object> matrix = new LinkedHashMap<>();

        matrix.put("ADMIN", Map.of(
                "title", "Workspace Administrator",
                "description", "Complete administrative and governance control over workspace, users, and audit logs.",
                "permissions", Map.of(
                        "workspaceAccess", "FULL",
                        "projectAccess", "FULL",
                        "taskCreation", true,
                        "taskEditing", "ALL",
                        "taskDeletion", true,
                        "userManagement", "FULL",
                        "auditHistory", "FULL",
                        "reports", "FULL",
                        "settings", "FULL",
                        "chatAdministration", "FULL"
                )
        ));

        matrix.put("PROJECT_MANAGER", Map.of(
                "title", "Project Manager",
                "description", "Manages roadmaps, project deliverables, sprint backlogs, and invites team members.",
                "permissions", Map.of(
                        "workspaceAccess", "FULL",
                        "projectAccess", "FULL",
                        "taskCreation", true,
                        "taskEditing", "ALL",
                        "taskDeletion", true,
                        "userManagement", "INVITE_AND_ASSIGN",
                        "auditHistory", "READ_ONLY",
                        "reports", "FULL",
                        "settings", "LIMITED",
                        "chatAdministration", "CHANNEL_CREATE"
                )
        ));

        matrix.put("TEAM_LEAD", Map.of(
                "title", "Team Lead",
                "description", "Leads functional squads, balances workloads, manages sprint tasks, and guides execution.",
                "permissions", Map.of(
                        "workspaceAccess", "STANDARD",
                        "projectAccess", "ASSIGNED_ONLY",
                        "taskCreation", true,
                        "taskEditing", "TEAM_TASKS",
                        "taskDeletion", false,
                        "userManagement", "VIEW_AND_ASSIGN",
                        "auditHistory", "NONE",
                        "reports", "SQUAD_ONLY",
                        "settings", "NONE",
                        "chatAdministration", "SQUAD_CHANNELS"
                )
        ));

        matrix.put("MEMBER", Map.of(
                "title", "Team Member",
                "description", "Executes assigned deliverables, creates tasks, comments, and communicates in team channels.",
                "permissions", Map.of(
                        "workspaceAccess", "STANDARD",
                        "projectAccess", "ASSIGNED_ONLY",
                        "taskCreation", true,
                        "taskEditing", "ASSIGNED_ONLY",
                        "taskDeletion", false,
                        "userManagement", "DIRECTORY_READ_ONLY",
                        "auditHistory", "NONE",
                        "reports", "PERSONAL_ONLY",
                        "settings", "PROFILE_ONLY",
                        "chatAdministration", "POST_AND_REPLY"
                )
        ));

        matrix.put("VIEWER", Map.of(
                "title", "Stakeholder / Viewer",
                "description", "Read-only workspace visibility for progress tracking and observing sprint status.",
                "permissions", Map.of(
                        "workspaceAccess", "READ_ONLY",
                        "projectAccess", "READ_ONLY",
                        "taskCreation", false,
                        "taskEditing", "NONE",
                        "taskDeletion", false,
                        "userManagement", "NONE",
                        "auditHistory", "NONE",
                        "reports", "READ_ONLY",
                        "settings", "PROFILE_ONLY",
                        "chatAdministration", "READ_ONLY"
                )
        ));

        return ResponseEntity.ok(matrix);
    }

    // Fetch user directory with optional status and search filters
    @GetMapping({"", "/", "/directory", "/all"})
    public ResponseEntity<List<User>> getUserDirectory(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        List<User> allUsers = userRepository.findAll();
        
        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            allUsers = allUsers.stream()
                    .filter(u -> status.equalsIgnoreCase(u.getStatus()))
                    .toList();
        }

        if (search != null && !search.trim().isEmpty()) {
            String query = search.trim().toLowerCase();
            allUsers = allUsers.stream()
                    .filter(u -> (u.getUsername() != null && u.getUsername().toLowerCase().contains(query)) ||
                                 (u.getEmail() != null && u.getEmail().toLowerCase().contains(query)) ||
                                 (u.getRole() != null && u.getRole().toLowerCase().contains(query)) ||
                                 (u.getDepartment() != null && u.getDepartment().toLowerCase().contains(query)))
                    .toList();
        }

        return ResponseEntity.ok(allUsers);
    }

    // Invite new user (Enforces RBAC)
    @PostMapping({"", "/", "/invite", "/create"})
    public ResponseEntity<?> inviteUser(@RequestBody Map<String, String> payload, Authentication authentication) {
        String actorRole = getActorRole(authentication);
        if (!canManageUsers(actorRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access Denied: Requires ADMIN or PROJECT_MANAGER role to invite users."));
        }

        try {
            String username = payload.get("username");
            String email = payload.get("email");
            String role = payload.getOrDefault("role", "MEMBER").toUpperCase();
            String department = payload.get("department");
            String temporaryPassword = payload.get("password");

            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
            }

            if (userRepository.existsByUsername(username.trim())) {
                return ResponseEntity.badRequest().body(Map.of("error", "A user with this username already exists"));
            }

            if (email != null && !email.trim().isEmpty() && userRepository.existsByEmail(email.trim())) {
                return ResponseEntity.badRequest().body(Map.of("error", "A user with this email already exists"));
            }

            if (temporaryPassword == null || temporaryPassword.trim().isEmpty()) {
                temporaryPassword = "Temp@" + UUID.randomUUID().toString().substring(0, 8);
            }

            User user = new User();
            user.setUsername(username.trim());
            user.setEmail(email != null && !email.trim().isEmpty() ? email.trim() : null);
            user.setPassword(passwordEncoder.encode(temporaryPassword));
            user.setRole(role);
            user.setStatus("INVITED");
            user.setDepartment(department != null && !department.trim().isEmpty() ? department.trim() : null);
            String phone = payload.get("phone");
            if (phone != null && !phone.trim().isEmpty()) user.setPhone(phone.trim());
            String gender = payload.get("gender");
            if (gender != null && !gender.trim().isEmpty()) user.setGender(gender.trim());

            User saved = userRepository.save(user);

            String actor = getActor(authentication);
            recordAudit("User @" + actor + " dispatched workspace invitation to @" + user.getUsername() + " with role " + role,
                    actor, "USER_INVITED", "USER", "user-" + saved.getId(),
                    null,
                    "{\"username\":\"" + user.getUsername() + "\",\"role\":\"" + role + "\",\"department\":\"" + (department != null ? department : "General") + "\",\"status\":\"INVITED\"}");

            return ResponseEntity.ok(Map.of(
                    "message", "Invitation sent successfully to " + user.getUsername(),
                    "user", saved,
                    "temporaryPassword", temporaryPassword
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Update User Role (Enforces RBAC)
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String actorRole = getActorRole(authentication);
        if (!canManageUsers(actorRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access Denied: Requires ADMIN or PROJECT_MANAGER role to modify user roles."));
        }

        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) return ResponseEntity.notFound().build();

        String newRole = payload.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        User user = optionalUser.get();
        String oldRole = user.getRole();
        user.setRole(newRole.trim().toUpperCase());
        userRepository.save(user);

        String actor = getActor(authentication);
        recordAudit("User @" + actor + " updated role of @" + user.getUsername() + " from " + oldRole + " to " + user.getRole(),
                actor, "ROLE_CHANGED", "USER", "user-" + user.getId(),
                "{\"username\":\"" + user.getUsername() + "\",\"role\":\"" + oldRole + "\"}",
                "{\"username\":\"" + user.getUsername() + "\",\"role\":\"" + user.getRole() + "\"}");

        return ResponseEntity.ok(Map.of("message", "User role updated successfully", "user", user));
    }

    // Update User Profile (email, department, role) - ADMIN or PROJECT_MANAGER only
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String actorRole = getActorRole(authentication);
        if (!canManageUsers(actorRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access Denied: Requires ADMIN or PROJECT_MANAGER role to update users."));
        }

        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) return ResponseEntity.notFound().build();
        User user = optionalUser.get();

        String email = payload.get("email");
        if (email != null && !email.trim().isEmpty() && !email.trim().equalsIgnoreCase(user.getEmail())) {
            Optional<User> clash = userRepository.findByEmail(email.trim());
            if (clash.isPresent() && !clash.get().getId().equals(user.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "A user with this email already exists"));
            }
            user.setEmail(email.trim());
        }

        String department = payload.get("department");
        if (department != null) {
            user.setDepartment(department.trim().isEmpty() ? null : department.trim());
        }

        String phone = payload.get("phone");
        if (phone != null) {
            user.setPhone(phone.trim().isEmpty() ? null : phone.trim());
        }

        String gender = payload.get("gender");
        if (gender != null) {
            user.setGender(gender.trim().isEmpty() ? null : gender.trim());
        }

        String role = payload.get("role");
        if (role != null && !role.trim().isEmpty()) {
            user.setRole(role.trim().toUpperCase());
        }

        User saved = userRepository.save(user);

        String actor = getActor(authentication);
        recordAudit("User @" + actor + " updated profile of @" + user.getUsername(),
                actor, "USER_UPDATED", "USER", "user-" + user.getId(),
                null,
                "{\"username\":\"" + user.getUsername() + "\",\"email\":\"" + user.getEmail() + "\",\"role\":\"" + user.getRole() + "\",\"department\":\"" + user.getDepartment() + "\"}");

        return ResponseEntity.ok(Map.of("message", "User updated successfully", "user", saved));
    }

    // Toggle Account Status (ACTIVE, INVITED, SUSPENDED)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String actorRole = getActorRole(authentication);
        if (!canManageUsers(actorRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access Denied: Requires ADMIN or PROJECT_MANAGER role to change user status."));
        }

        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) return ResponseEntity.notFound().build();

        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        User user = optionalUser.get();
        String oldStatus = user.getStatus();
        user.setStatus(newStatus.trim().toUpperCase());
        userRepository.save(user);

        String actor = getActor(authentication);
        recordAudit("User @" + actor + " changed status of @" + user.getUsername() + " from " + oldStatus + " to " + user.getStatus(),
                actor, "STATUS_CHANGED", "USER", "user-" + user.getId(),
                "{\"username\":\"" + user.getUsername() + "\",\"status\":\"" + oldStatus + "\"}",
                "{\"username\":\"" + user.getUsername() + "\",\"status\":\"" + user.getStatus() + "\"}");

        return ResponseEntity.ok(Map.of("message", "User status updated successfully", "user", user));
    }

    // Delete / Revoke user (Only ADMIN)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        String actorRole = getActorRole(authentication);
        if (!canDeleteUsers(actorRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access Denied: Only ADMIN role can permanently delete user accounts."));
        }

        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) return ResponseEntity.notFound().build();

        User user = optionalUser.get();
        userRepository.delete(user);

        String actor = getActor(authentication);
        recordAudit("User @" + actor + " removed user account @" + user.getUsername(),
                actor, "USER_DELETED", "USER", "user-" + user.getId(),
                "{\"username\":\"" + user.getUsername() + "\",\"role\":\"" + user.getRole() + "\",\"status\":\"" + user.getStatus() + "\"}",
                "{\"deleted\":true}");

        return ResponseEntity.ok(Map.of("message", "User @" + user.getUsername() + " deleted successfully"));
    }

    // Existing list endpoint for chat mentions/directory...
    @GetMapping("/list")
    public ResponseEntity<List<User>> getActiveUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}