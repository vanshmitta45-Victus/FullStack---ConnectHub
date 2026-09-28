package com.vansh.connecthub.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_created_at", columnList = "created_at"),
    @Index(name = "idx_audit_entity_type", columnList = "entity_type"),
    @Index(name = "idx_audit_action_type", columnList = "action_type"),
    @Index(name = "idx_audit_actor", columnList = "actor")
})
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String actionLog;

    private String actor;

    private String actionType; // TASK_CREATED, TASK_UPDATED, TASK_STATUS_CHANGED, TASK_DELETED, USER_INVITED, ROLE_CHANGED, STATUS_CHANGED, USER_DELETED, TASK_FROM_CHAT

    private String entityType; // TASK, USER, PROJECT, SECURITY

    private String entityId; // e.g. TSK-10, user-6

    @Column(columnDefinition = "TEXT")
    private String previousValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    private String timestamp;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void setTime() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.timestamp = this.createdAt.format(DateTimeFormatter.ofPattern("hh:mm a, MMM dd"));
    }
}