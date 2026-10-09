package com.vansh.connecthub.config;

import com.vansh.connecthub.model.ChatGroup;
import com.vansh.connecthub.repository.ChatGroupRepository;
import com.vansh.connecthub.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.Optional;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:5173",
                        "http://localhost",
                        "http://localhost:80",
                        "http://host.docker.internal:5173",
                        "http://host.docker.internal")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null) {
                    // 1. Authenticate on STOMP CONNECT
                    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                        String authHeader = accessor.getFirstNativeHeader("Authorization");
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            String token = authHeader.substring(7);
                            if (jwtUtils.validateToken(token)) {
                                String username = jwtUtils.getUsernameFromToken(token);
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                accessor.setUser(authentication);
                            }
                        }
                    }

                    // 2. Strict Topic Subscription Authorization on STOMP SUBSCRIBE
                    if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                        String destination = accessor.getDestination();
                        Principal principal = accessor.getUser();

                        // Disallow unauthenticated subscriptions completely
                        if (principal == null) {
                            throw new AccessDeniedException("Unauthorized: Authentication required to subscribe to STOMP destinations.");
                        }

                        if (destination != null) {
                            // 2a. User-specific private messaging topic: /topic/user.{username}
                            if (destination.startsWith("/topic/user.")) {
                                String targetUser = destination.substring("/topic/user.".length());
                                boolean isSelf = principal.getName().equalsIgnoreCase(targetUser);
                                boolean isAdmin = false;
                                if (principal instanceof UsernamePasswordAuthenticationToken auth) {
                                    isAdmin = auth.getAuthorities().stream()
                                            .anyMatch(a -> a.getAuthority().contains("ADMIN"));
                                }

                                if (!isSelf && !isAdmin) {
                                    throw new AccessDeniedException("Unauthorized: Cannot subscribe to another user's private channel: " + targetUser);
                                }
                            }

                            // 2b. Private Group / Channel Topic: /topic/group.{groupName}
                            else if (destination.startsWith("/topic/group.")) {
                                String groupName = destination.substring("/topic/group.".length());
                                Optional<ChatGroup> groupOpt = chatGroupRepository.findByName(groupName);

                                if (groupOpt.isEmpty()) {
                                    throw new IllegalArgumentException("Channel not found: " + groupName);
                                }

                                ChatGroup group = groupOpt.get();
                                boolean isAdmin = false;
                                if (principal instanceof UsernamePasswordAuthenticationToken auth) {
                                    isAdmin = auth.getAuthorities().stream()
                                            .anyMatch(a -> a.getAuthority().contains("ADMIN"));
                                }

                                boolean isCreator = group.getCreatedBy() != null &&
                                        group.getCreatedBy().getUsername().equalsIgnoreCase(principal.getName());

                                boolean isMember = group.getMembers() != null && group.getMembers().stream()
                                        .anyMatch(member -> member.getUsername().equalsIgnoreCase(principal.getName()));

                                if (!isMember && !isCreator && !isAdmin) {
                                    throw new AccessDeniedException("Unauthorized: You are not a member of channel " + groupName);
                                }
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}