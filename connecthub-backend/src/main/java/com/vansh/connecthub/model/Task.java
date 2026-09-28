package com.vansh.connecthub.model;

import com.vansh.connecthub.enums.TaskPriority;
import com.vansh.connecthub.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tasks", indexes = {
    @Index(name = "idx_tasks_status", columnList = "status"),
    @Index(name = "idx_tasks_assigned_user", columnList = "assigned_user_id"),
    @Index(name = "idx_tasks_priority", columnList = "priority"),
    @Index(name = "idx_tasks_project", columnList = "project")
})
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @ManyToOne
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    private String dueDate;

    private Integer storyPoints = 1;

    private String labels;

    @Column(columnDefinition = "TEXT")
    private String subtasks;

    @Column(columnDefinition = "TEXT")
    private String comments;

    private String project = "ConnectHub Core";

    private String linkedChannel;

    private Boolean isBlocked = false;

    public Boolean getIsBlocked() {
        return isBlocked != null && isBlocked;
    }

    public void setIsBlocked(Boolean isBlocked) {
        this.isBlocked = isBlocked != null ? isBlocked : false;
    }

    public boolean isBlocked() {
        return isBlocked != null && isBlocked;
    }

    public void setBlocked(boolean blocked) {
        this.isBlocked = blocked;
    }

    private String blockedReason;

    private LocalDateTime createdAt = LocalDateTime.now();
}