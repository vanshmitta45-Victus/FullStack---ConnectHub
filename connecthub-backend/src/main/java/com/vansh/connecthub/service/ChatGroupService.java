package com.vansh.connecthub.service;

import com.vansh.connecthub.model.ChatGroup;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.ChatGroupRepository;
import com.vansh.connecthub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatGroupService {

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. Create a new secure group
    public ChatGroup createGroup(String name, String description, User creator) {
        if (chatGroupRepository.findByName(name).isPresent()) {
            throw new RuntimeException("A group with this name already exists.");
        }

        ChatGroup group = new ChatGroup();
        group.setName(name);
        group.setDescription(description);
        group.setCreatedBy(creator);

        // The creator is automatically the first and only member of the new group
        group.getMembers().add(creator);

        return chatGroupRepository.save(group);
    }

    // 2. Add a new member to an existing group (Only Admin/Creator can do this)
    public ChatGroup addMemberToGroup(String groupName, String usernameToAdd, User requester) {
        ChatGroup group = chatGroupRepository.findByName(groupName)
                .orElseThrow(() -> new RuntimeException("Group not found."));

        // Security check: Only the creator can add new members
        if (!group.getCreatedBy().getId().equals(requester.getId())) {
            throw new RuntimeException("Unauthorized: Only the group creator can add members.");
        }

        User newMember = userRepository.findByUsername(usernameToAdd)
                .orElseThrow(() -> new RuntimeException("User to add not found."));

        group.getMembers().add(newMember);
        return chatGroupRepository.save(group);
    }

    // 3. Fetch ONLY the groups that the requesting user belongs to
    public List<ChatGroup> getUserGroups(User user) {
        return chatGroupRepository.findByMembersContaining(user);
    }
}