package com.vansh.connecthub.repository;

import com.vansh.connecthub.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 1. Fetch only root messages (exclude thread replies) for Global channel
    @Query("SELECT m FROM ChatMessage m WHERE m.recipient = 'Global' AND m.parentMessageId IS NULL ORDER BY m.id ASC")
    List<ChatMessage> findMainGlobalMessages();

    // 1b. Paginated Global messages (newest first for page/scroll windowing)
    @Query("SELECT m FROM ChatMessage m WHERE m.recipient = 'Global' AND m.parentMessageId IS NULL ORDER BY m.id DESC")
    Page<ChatMessage> findMainGlobalMessagesPaged(Pageable pageable);

    // 2. Fetch only root messages (exclude thread replies) for a Group channel
    @Query("SELECT m FROM ChatMessage m WHERE m.recipient = :groupName AND m.parentMessageId IS NULL ORDER BY m.id ASC")
    List<ChatMessage> findMainGroupMessages(@Param("groupName") String groupName);

    // 2b. Paginated Group messages (newest first)
    @Query("SELECT m FROM ChatMessage m WHERE m.recipient = :groupName AND m.parentMessageId IS NULL ORDER BY m.id DESC")
    Page<ChatMessage> findMainGroupMessagesPaged(@Param("groupName") String groupName, Pageable pageable);

    // 3. Fetch only root messages (exclude thread replies) for Direct messages
    @Query("SELECT m FROM ChatMessage m WHERE ((m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1)) AND m.parentMessageId IS NULL ORDER BY m.id ASC")
    List<ChatMessage> findMainPrivateMessages(@Param("user1") String user1, @Param("user2") String user2);

    // 3b. Paginated Direct messages (newest first)
    @Query("SELECT m FROM ChatMessage m WHERE ((m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1)) AND m.parentMessageId IS NULL ORDER BY m.id DESC")
    Page<ChatMessage> findMainPrivateMessagesPaged(@Param("user1") String user1, @Param("user2") String user2, Pageable pageable);

    // 3c. Conversation feed: every non-thread message involving a user (DMs sent or received),
    // excluding Global and group channels, newest first. Used to build the DM conversation list.
    @Query("SELECT m FROM ChatMessage m WHERE (m.sender = :user OR m.recipient = :user) " +
           "AND m.recipient <> 'Global' AND m.parentMessageId IS NULL " +
           "AND NOT EXISTS (SELECT g FROM ChatGroup g WHERE g.name = m.recipient) " +
           "ORDER BY m.id DESC")
    List<ChatMessage> findConversationMessages(@Param("user") String user);

    // 4. Fetch all thread replies belonging to a specific parent message
    List<ChatMessage> findByParentMessageIdOrderByIdAsc(Long parentMessageId);

    // 5. Get reply counts for messages in a batch
    @Query("SELECT m.parentMessageId AS parentId, COUNT(m) AS replyCount FROM ChatMessage m WHERE m.parentMessageId IN :parentIds GROUP BY m.parentMessageId")
    List<Map<String, Object>> countRepliesByParentIds(@Param("parentIds") List<Long> parentIds);

    // 6. Full-Text Search within a specific channel / direct conversation
    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.recipient = :channel OR (m.sender = :channel AND m.recipient = :currentUser)) AND " +
            "(LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "(m.fileName IS NOT NULL AND LOWER(m.fileName) LIKE LOWER(CONCAT('%', :query, '%')))) " +
            "ORDER BY m.id DESC")
    List<ChatMessage> searchMessagesInChannel(
            @Param("query") String query,
            @Param("channel") String channel,
            @Param("currentUser") String currentUser
    );

    // 7. Reconnection missed messages recovery query
    @Query("SELECT m FROM ChatMessage m WHERE m.id > :sinceId AND " +
            "(m.recipient = 'Global' OR m.recipient = :channelOrUser OR " +
            "(m.sender = :channelOrUser AND m.recipient = :currentUser) OR " +
            "(m.sender = :currentUser AND m.recipient = :channelOrUser)) AND " +
            "m.parentMessageId IS NULL ORDER BY m.id ASC")
    List<ChatMessage> findMissedMessages(
            @Param("sinceId") Long sinceId,
            @Param("channelOrUser") String channelOrUser,
            @Param("currentUser") String currentUser
    );

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.sender = :sender AND m.recipient = :recipient")
    void markMessagesAsRead(@Param("sender") String sender, @Param("recipient") String recipient);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE (m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1)")
    void deletePrivateChat(@Param("user1") String user1, @Param("user2") String user2);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE m.recipient = :groupName")
    void deleteGroupChat(@Param("groupName") String groupName);
}