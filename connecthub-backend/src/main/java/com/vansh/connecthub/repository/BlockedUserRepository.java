package com.vansh.connecthub.repository;

import com.vansh.connecthub.model.BlockedUser;
import com.vansh.connecthub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    Optional<BlockedUser> findByBlockerAndBlocked(User blocker, User blocked);
    void deleteByBlockerAndBlocked(User blocker, User blocked);
}