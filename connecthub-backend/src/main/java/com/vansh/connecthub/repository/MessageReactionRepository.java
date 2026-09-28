package com.vansh.connecthub.repository;

import com.vansh.connecthub.model.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    List<MessageReaction> findByMessageId(Long messageId);

    List<MessageReaction> findByMessageIdIn(List<Long> messageIds);

    Optional<MessageReaction> findByMessageIdAndUsernameAndEmoji(Long messageId, String username, String emoji);

    void deleteByMessageIdAndUsernameAndEmoji(Long messageId, String username, String emoji);
}