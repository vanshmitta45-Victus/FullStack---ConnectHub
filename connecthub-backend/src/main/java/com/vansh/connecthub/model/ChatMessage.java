package com.vansh.connecthub.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_recipient", columnList = "recipient"),
    @Index(name = "idx_chat_recipient_timestamp", columnList = "recipient, timestamp"),
    @Index(name = "idx_chat_sender_recipient", columnList = "sender, recipient"),
    @Index(name = "idx_chat_parent_id", columnList = "parent_message_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sender;

    @Column(nullable = false)
    private String recipient;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String type; // CHAT, FILE, TYPING, READ

    private String timestamp;

    @Builder.Default
    private Boolean isRead = false;

    public Boolean getIsRead() {
        return isRead != null && isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead != null ? isRead : false;
    }

    // File attachment metadata
    private String fileUrl;
    private String fileType;
    private String fileName;
    private String attachmentId;

    // --- SPRINT 2: THREADED REPLIES ---
    // If null, it is a root message in the main feed.
    // If not null, it is a reply belonging to the message with this ID.
    @Column(name = "parent_message_id")
    private Long parentMessageId;
}