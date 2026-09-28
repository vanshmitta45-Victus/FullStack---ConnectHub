import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

let stompClient = null;
const groupSubscriptions = new Map();
const groupHandlers = new Map();
let reconnectCallbacks = [];
let hasConnectedOnce = false;
let currentUsername = null;
let currentOnMessageReceived = null;

export const websocketService = {
    connect(username, onMessageReceived) {
        currentUsername = username;
        currentOnMessageReceived = onMessageReceived;
        const token = localStorage.getItem('token');

        stompClient = new Client({
            // Dynamic factory so each reconnection attempt creates a fresh SockJS transport
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            // Auto-reconnect silently every 4 seconds if network drops momentarily
            reconnectDelay: 4000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,

            onConnect: (frame) => {
                // Public / Global Channel
                stompClient.subscribe('/topic/public', (msg) => {
                    if (onMessageReceived) onMessageReceived(JSON.parse(msg.body));
                });

                // User-Specific Direct Notifications & Messages
                stompClient.subscribe(`/topic/user.${username}`, (msg) => {
                    if (onMessageReceived) onMessageReceived(JSON.parse(msg.body));
                });

                // Re-establish any active group subscriptions upon reconnect
                groupHandlers.forEach((handler, groupName) => {
                    const sub = stompClient.subscribe(`/topic/group.${groupName}`, (msg) => {
                        handler(JSON.parse(msg.body));
                    });
                    groupSubscriptions.set(groupName, sub);
                });

                // Trigger missed message reconciliation if this is a reconnection after network drop
                if (hasConnectedOnce) {
                    console.info('WebSocket reconnected! Triggering missed message reconciliation.');
                    reconnectCallbacks.forEach((cb) => {
                        try {
                            cb();
                        } catch (err) {
                            console.error('Error during reconnect callback:', err);
                        }
                    });
                }

                hasConnectedOnce = true;
            },

            onWebSocketClose: () => {
                console.warn('WebSocket connection lost. Auto-reconnection scheduled in 4000ms...');
            },

            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        stompClient.activate();
    },

    onReconnect(callback) {
        if (typeof callback === 'function') {
            reconnectCallbacks.push(callback);
        }
    },

    removeReconnectHandler(callback) {
        reconnectCallbacks = reconnectCallbacks.filter((cb) => cb !== callback);
    },

    subscribeToGroup(groupName, onMessageReceived) {
        groupHandlers.set(groupName, onMessageReceived);
        if (!stompClient || !stompClient.connected) return;

        // Prevent duplicate subscriptions to the same channel
        if (!groupSubscriptions.has(groupName)) {
            const sub = stompClient.subscribe(`/topic/group.${groupName}`, (msg) => {
                onMessageReceived(JSON.parse(msg.body));
            });
            groupSubscriptions.set(groupName, sub);
        }
    },

    unsubscribeFromGroup(groupName) {
        groupHandlers.delete(groupName);
        if (groupSubscriptions.has(groupName)) {
            groupSubscriptions.get(groupName).unsubscribe();
            groupSubscriptions.delete(groupName);
        }
    },

    sendMessage(chatMessage) {
        if (stompClient && stompClient.connected) {
            stompClient.publish({ 
                destination: '/app/chat.sendMessage', 
                body: JSON.stringify(chatMessage) 
            });
        }
    },

    sendPrivateMessage(chatMessage) {
        if (stompClient && stompClient.connected) {
            stompClient.publish({ 
                destination: '/app/chat.sendPrivateMessage', 
                body: JSON.stringify(chatMessage) 
            });
        }
    },

    sendGroupMessage(chatMessage) {
        if (stompClient && stompClient.connected) {
            stompClient.publish({ 
                destination: '/app/chat.sendGroupMessage', 
                body: JSON.stringify(chatMessage) 
            });
        }
    },

    sendTypingEvent(payload) {
        if (stompClient && stompClient.connected) {
            stompClient.publish({ 
                destination: '/app/chat.typing', 
                body: JSON.stringify(payload) 
            });
        }
    },

    sendReadReceipt(payload) {
        if (stompClient && stompClient.connected) {
            stompClient.publish({ 
                destination: '/app/chat.read', 
                body: JSON.stringify(payload) 
            });
        }
    },

    sendReaction(payload) {
        if (stompClient && stompClient.connected) {
            stompClient.publish({ 
                destination: '/app/chat.react', 
                body: JSON.stringify(payload) 
            });
        }
    },

    disconnect() {
        hasConnectedOnce = false;
        groupSubscriptions.clear();
        groupHandlers.clear();
        reconnectCallbacks = [];
        if (stompClient) {
            stompClient.deactivate();
        }
    }
};