package com.vansh.connecthub.controller;

import com.vansh.connecthub.model.ChatGroup;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.ChatGroupRepository;
import com.vansh.connecthub.repository.UserRepository;
import com.vansh.connecthub.service.ChatGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/groups")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatGroupController {

    @Autowired
    private ChatGroupService chatGroupService;

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private UserRepository userRepository;

    // Helper method to get the currently logged-in user from the JWT Token
    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in DB"));
    }

    // POST: Create a new group
    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, String> payload, Authentication authentication) {
        try {
            User creator = getAuthenticatedUser(authentication);
            String name = payload.get("name");
            String description = payload.get("description");

            ChatGroup newGroup = chatGroupService.createGroup(name, description, creator);
            return ResponseEntity.ok(Map.of("message", "Group created successfully", "groupName", newGroup.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST: Add a member to a group (Creator/Admin only)
    @PostMapping("/{groupName}/add-member")
    public ResponseEntity<?> addMember(@PathVariable String groupName, @RequestBody Map<String, String> payload, Authentication authentication) {
        try {
            User requester = getAuthenticatedUser(authentication);
            String usernameToAdd = payload.get("username");

            chatGroupService.addMemberToGroup(groupName, usernameToAdd, requester);
            return ResponseEntity.ok(Map.of("message", usernameToAdd + " has been securely added to " + groupName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST: Remove a member or Leave group
    @PostMapping("/{groupName}/remove-member")
    public ResponseEntity<?> removeMember(@PathVariable String groupName, @RequestBody Map<String, String> payload, Authentication authentication) {
        try {
            User requester = getAuthenticatedUser(authentication);
            String usernameToRemove = payload.get("username");

            ChatGroup group = chatGroupRepository.findByName(groupName)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            boolean isCreator = group.getCreatedBy().getId().equals(requester.getId());
            boolean isSelf = requester.getUsername().equals(usernameToRemove);

            if (!isCreator && !isSelf) {
                return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized: Only the creator can remove members"));
            }

            group.getMembers().removeIf(m -> m.getUsername().equals(usernameToRemove));
            chatGroupRepository.save(group);

            return ResponseEntity.ok(Map.of("message", usernameToRemove + " removed from #" + groupName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT: Archive / Disable channel (Creator only)
    @PutMapping("/{groupName}/toggle-disable")
    public ResponseEntity<?> toggleDisableGroup(@PathVariable String groupName, Authentication authentication) {
        try {
            User requester = getAuthenticatedUser(authentication);
            ChatGroup group = chatGroupRepository.findByName(groupName)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            if (!group.getCreatedBy().getId().equals(requester.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized: Only the creator can change channel status"));
            }

            group.setDisabled(!group.isDisabled());
            chatGroupRepository.save(group);

            return ResponseEntity.ok(Map.of(
                    "message", "Channel status updated",
                    "disabled", group.isDisabled()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET: List all groups the current user belongs to
    @GetMapping("/my-groups")
    public ResponseEntity<?> getMyGroups(Authentication authentication) {
        try {
            User currentUser = getAuthenticatedUser(authentication);
            List<ChatGroup> myGroups = chatGroupService.getUserGroups(currentUser);
            return ResponseEntity.ok(myGroups);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}