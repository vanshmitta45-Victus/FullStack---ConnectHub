package com.vansh.connecthub.controller;

import com.vansh.connecthub.model.ChatMessage;
import com.vansh.connecthub.model.MessageReaction;
import com.vansh.connecthub.repository.ChatMessageRepository;
import com.vansh.connecthub.repository.MessageReactionRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private MessageReactionRepository messageReactionRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // --- WEBSOCKET MESSAGING ENDPOINTS ---

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setRecipient("Global");
        ChatMessage saved = chatMessageRepository.save(chatMessage);
        messagingTemplate.convertAndSend("/topic/public", saved);
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        ChatMessage saved = chatMessageRepository.save(chatMessage);
        messagingTemplate.convertAndSend("/topic/user." + chatMessage.getRecipient(), saved);
        messagingTemplate.convertAndSend("/topic/user." + chatMessage.getSender(), saved);
    }

    @MessageMapping("/chat.sendGroupMessage")
    public void sendGroupMessage(@Payload ChatMessage chatMessage) {
        ChatMessage saved = chatMessageRepository.save(chatMessage);
        messagingTemplate.convertAndSend("/topic/group." + chatMessage.getRecipient(), saved);
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload ChatMessage chatMessage) {
        if ("Global".equals(chatMessage.getRecipient())) {
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        } else if (chatMessage.getRecipient() != null && chatMessage.getRecipient().startsWith("Group_")) {
            messagingTemplate.convertAndSend("/topic/group." + chatMessage.getRecipient(), chatMessage);
        } else {
            messagingTemplate.convertAndSend("/topic/user." + chatMessage.getRecipient(), chatMessage);
        }
    }

    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload ChatMessage chatMessage) {
        chatMessageRepository.markMessagesAsRead(chatMessage.getRecipient(), chatMessage.getSender());
        messagingTemplate.convertAndSend("/topic/user." + chatMessage.getRecipient(), chatMessage);
    }

    // --- SPRINT 2: EMOJI REACTIONS ---

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionPayload {
        private Long messageId;
        private String emoji;
        private String username;
        private String recipient;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionBroadcastResponse {
        private String type;
        private Long messageId;
        private List<MessageReaction> reactions;
    }

    @MessageMapping("/chat.react")
    public void handleReaction(@Payload ReactionPayload payload) {
        if (payload.getMessageId() == null) return;

        var existing = messageReactionRepository.findByMessageIdAndUsernameAndEmoji(
                payload.getMessageId(), payload.getUsername(), payload.getEmoji());

        if (existing.isPresent()) {
            messageReactionRepository.delete(existing.get());
        } else {
            MessageReaction reaction = MessageReaction.builder()
                    .messageId(payload.getMessageId())
                    .username(payload.getUsername())
                    .emoji(payload.getEmoji())
                    .build();
            messageReactionRepository.save(reaction);
        }

        List<MessageReaction> currentReactions = messageReactionRepository.findByMessageId(payload.getMessageId());
        ReactionBroadcastResponse response = new ReactionBroadcastResponse("REACTION_UPDATE", payload.getMessageId(), currentReactions);

        if ("Global".equals(payload.getRecipient())) {
            messagingTemplate.convertAndSend("/topic/public", response);
        } else if (payload.getRecipient() != null && !payload.getRecipient().isEmpty()) {
            messagingTemplate.convertAndSend("/topic/group." + payload.getRecipient(), response);
            messagingTemplate.convertAndSend("/topic/user." + payload.getRecipient(), response);
            messagingTemplate.convertAndSend("/topic/user." + payload.getUsername(), response);
        }
    }

    @PostMapping("/api/chat/reactions/batch")
    public ResponseEntity<List<MessageReaction>> getReactionsForMessages(@RequestBody List<Long> messageIds) {
        return ResponseEntity.ok(messageReactionRepository.findByMessageIdIn(messageIds));
    }

    // --- SPRINT 2: THREADED REPLIES REST ENDPOINTS ---

    @GetMapping("/api/chat/messages/{messageId}/thread")
    public ResponseEntity<List<ChatMessage>> getThreadReplies(@PathVariable Long messageId) {
        return ResponseEntity.ok(chatMessageRepository.findByParentMessageIdOrderByIdAsc(messageId));
    }

    @PostMapping("/api/chat/messages/thread-counts")
    public ResponseEntity<Map<Long, Long>> getThreadCounts(@RequestBody List<Long> messageIds) {
        Map<Long, Long> countsMap = new HashMap<>();
        if (messageIds == null || messageIds.isEmpty()) {
            return ResponseEntity.ok(countsMap);
        }

        List<Map<String, Object>> results = chatMessageRepository.countRepliesByParentIds(messageIds);
        for (Map<String, Object> row : results) {
            Long parentId = ((Number) row.get("parentId")).longValue();
            Long count = ((Number) row.get("replyCount")).longValue();
            countsMap.put(parentId, count);
        }
        return ResponseEntity.ok(countsMap);
    }

    // --- SPRINT 2: FULL-TEXT SEARCH ENDPOINT ---

    @GetMapping("/api/chat/search")
    public ResponseEntity<List<ChatMessage>> searchMessages(
            @RequestParam String query,
            @RequestParam String channel,
            Authentication authentication
    ) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        String currentUser = authentication.getName();
        List<ChatMessage> results = chatMessageRepository.searchMessagesInChannel(query.trim(), channel, currentUser);
        return ResponseEntity.ok(results);
    }

    // --- REST HISTORY ENDPOINTS (Only Top-Level Messages) ---

    @GetMapping("/api/chat/history/global")
    public ResponseEntity<List<ChatMessage>> getGlobalChatHistory() {
        return ResponseEntity.ok(chatMessageRepository.findMainGlobalMessages());
    }

    @GetMapping("/api/chat/history/group")
    public ResponseEntity<List<ChatMessage>> getGroupChatHistory(@RequestParam String groupName) {
        return ResponseEntity.ok(chatMessageRepository.findMainGroupMessages(groupName));
    }

    @GetMapping("/api/chat/history/private")
    public ResponseEntity<List<ChatMessage>> getPrivateChatHistory(@RequestParam String user1, @RequestParam String user2) {
        return ResponseEntity.ok(chatMessageRepository.findMainPrivateMessages(user1, user2));
    }

    // --- SPRINT 3: PAGINATED CHAT HISTORY (Infinite Scrolling - 50 items per page) ---

    @GetMapping("/api/chat/history/paged")
    public ResponseEntity<Map<String, Object>> getPagedChatHistory(
            @RequestParam(defaultValue = "Global") String channel,
            @RequestParam(defaultValue = "false") boolean isGroup,
            @RequestParam(required = false) String otherUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<ChatMessage> messagePage;

        if ("Global".equalsIgnoreCase(channel)) {
            messagePage = chatMessageRepository.findMainGlobalMessagesPaged(pageable);
        } else if (isGroup) {
            messagePage = chatMessageRepository.findMainGroupMessagesPaged(channel, pageable);
        } else {
            String currentUser = authentication != null ? authentication.getName() : "";
            String partner = otherUser != null ? otherUser : channel;
            messagePage = chatMessageRepository.findMainPrivateMessagesPaged(currentUser, partner, pageable);
        }

        // Return messages reversed so they are rendered chronologically (oldest to newest)
        List<ChatMessage> content = new ArrayList<>(messagePage.getContent());
        Collections.reverse(content);

        Map<String, Object> result = new HashMap<>();
        result.put("messages", content);
        result.put("currentPage", messagePage.getNumber());
        result.put("totalPages", messagePage.getTotalPages());
        result.put("totalElements", messagePage.getTotalElements());
        result.put("hasMore", messagePage.hasNext());

        return ResponseEntity.ok(result);
    }

    // --- CONNECTION RESILIENCE: RECOVERY OF MISSED MESSAGES ---

    @GetMapping("/api/chat/sync/missed")
    public ResponseEntity<List<ChatMessage>> getMissedMessages(
            @RequestParam Long sinceId,
            @RequestParam String channelOrUser,
            Authentication authentication
    ) {
        String currentUser = authentication != null ? authentication.getName() : "";
        List<ChatMessage> missed = chatMessageRepository.findMissedMessages(sinceId, channelOrUser, currentUser);
        return ResponseEntity.ok(missed);
    }

    @PutMapping("/api/chat/read")
    public ResponseEntity<?> markMessagesAsReadRest(@RequestBody Map<String, String> payload) {
        String sender = payload.get("sender");
        String recipient = payload.get("recipient");
        chatMessageRepository.markMessagesAsRead(sender, recipient);
        return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
    }

    // --- CLEAR CHAT ENDPOINTS ---

    @DeleteMapping("/api/chat/clear/private")
    public ResponseEntity<?> clearPrivateChat(@RequestParam String user1, @RequestParam String user2) {
        chatMessageRepository.deletePrivateChat(user1, user2);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/api/chat/clear/group")
    public ResponseEntity<?> clearGroupChat(@RequestParam String groupName) {
        chatMessageRepository.deleteGroupChat(groupName);
        return ResponseEntity.ok().build();
    }
}