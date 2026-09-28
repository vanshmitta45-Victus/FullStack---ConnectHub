package com.vansh.connecthub.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "message_attachments")
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The secure cloud URL where the file is stored permanently
    @Column(nullable = false, length = 1000)
    private String fileUrl;

    // e.g., "image/png", "application/pdf", "video/mp4"
    private String fileType;

    // The original name of the file
    private String fileName;

    // Keep track of the file size
    private Long fileSize;

    // Who uploaded it
    @ManyToOne
    @JoinColumn(name = "uploaded_by_user_id")
    private User uploadedBy;

    // The message this file belongs to (to be linked later)
    private Long messageId;

    private LocalDateTime uploadTime = LocalDateTime.now();
}