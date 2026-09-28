package com.vansh.connecthub.repository;

import com.vansh.connecthub.model.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {
}