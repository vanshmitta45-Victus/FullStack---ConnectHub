package com.vansh.connecthub.security;

import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // FIX: getRole() returns a String now, no need for .name()
        String roleName = user.getRole();
        String exactAuthority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority(exactAuthority)))
                .build();
    }
}