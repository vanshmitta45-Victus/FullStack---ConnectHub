package com.vansh.connecthub.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "message_reactions",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"message_id", "username", "emoji"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", nullable = false)
    private Long messageId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, length = 16)
    private String emoji;
}