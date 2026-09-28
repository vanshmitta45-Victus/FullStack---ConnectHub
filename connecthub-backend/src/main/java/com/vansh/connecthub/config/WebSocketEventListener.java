package com.vansh.connecthub.config;

import com.vansh.connecthub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private UserRepository userRepository;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        // Presence detection is now managed via WebSocket subscriptions directly,
        // so we no longer write "online" status to the database on every connection tick.
        if (event.getUser() != null) {
            String username = event.getUser().getName();
            System.out.println("User Connected: " + username);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        if (event.getUser() != null) {
            String username = event.getUser().getName();
            System.out.println("User Disconnected: " + username);
        }
    }
}