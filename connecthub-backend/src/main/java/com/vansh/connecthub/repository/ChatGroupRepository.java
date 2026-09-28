package com.vansh.connecthub.repository;

import com.vansh.connecthub.model.ChatGroup;
import com.vansh.connecthub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {

    // Find a group by its exact name
    Optional<ChatGroup> findByName(String name);

    // Find ONLY the groups where this specific user is in the 'members' list
    List<ChatGroup> findByMembersContaining(User member);
}