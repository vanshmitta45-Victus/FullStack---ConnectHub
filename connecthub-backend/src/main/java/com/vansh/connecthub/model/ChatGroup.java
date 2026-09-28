package com.vansh.connecthub.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@Table(name = "chat_groups")
public class ChatGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String description;

    // The user who created the group (The Admin)
    @ManyToOne
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    // This creates the bridge table 'group_members' linking users to this group
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "group_members",
            joinColumns = @JoinColumn(name = "group_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> members = new HashSet<>();

    private boolean isPrivate = true;
    private boolean isDisabled = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}