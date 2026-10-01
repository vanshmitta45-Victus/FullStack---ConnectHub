import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { websocketService } from '../services/websocketService';

const AVAILABLE_EMOJIS = ['👍', '❤️', '🚀', '😂', '👀'];

function Chat() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('Global');
  const [isGroup, setIsGroup] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('About');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [groups, setGroups] = useState([
    { id: 0, name: 'Global', admins: ['System'], members: ['Global Broadcast'], disabled: false, description: 'Public organization-wide channel' }
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeoutRef = useRef(null);

  const [reactionsMap, setReactionsMap] = useState({});
  const [activeEmojiPickerMsgId, setActiveEmojiPickerMsgId] = useState(null);

  const [activeThreadMessage, setActiveThreadMessage] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [threadInput, setThreadInput] = useState('');
  const [threadCounts, setThreadCounts] = useState({});

  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionCursorPos, setMentionCursorPos] = useState(0);

  const [chatSearchText, setChatSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [chatPage, setChatPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const messageContainerRef = useRef(null);
  const isPrependingOlderRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  // Chat-to-Task Bridge State (Phase 4)
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [messageToConvert, setMessageToConvert] = useState(null);
  const [convertForm, setConvertForm] = useState({
    title: '',
    description: '',
    project: 'ConnectHub Web Platform',
    priority: 'MEDIUM',
    storyPoints: 3,
    assignedUserId: ''
  });
  const [convertFeedback, setConvertFeedback] = useState('');

  const handleOpenConvertModal = (msg) => {
    setMessageToConvert(msg);
    const cleanText = (msg.content || '').replace(/\s+/g, ' ').trim();
    const shortTitle = cleanText.length > 60 ? cleanText.slice(0, 57) + '...' : cleanText;
    setConvertForm({
      title: shortTitle || 'Task from Chat Message',
      description: `Created from chat message by @${msg.sender} in #${selectedRecipient}:\n\n"${msg.content}"`,
      project: 'ConnectHub Web Platform',
      priority: 'MEDIUM',
      storyPoints: 3,
      assignedUserId: ''
    });
    setShowConvertModal(true);
  };

  const handleCreateTaskFromChat = async (e) => {
    e.preventDefault();
    if (!convertForm.title) return;

    try {
      const payload = {
        title: convertForm.title,
        description: convertForm.description,
        status: 'TODO',
        priority: convertForm.priority,
        storyPoints: Number(convertForm.storyPoints) || 3,
        project: convertForm.project,
        linkedChannel: selectedRecipient,
        assignedUserId: convertForm.assignedUserId ? Number(convertForm.assignedUserId) : undefined
      };

      const res = await axios.post('/api/tasks/create', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowConvertModal(false);
      setConvertFeedback(`Task TSK-${res.data.id} created from message!`);
      setTimeout(() => setConvertFeedback(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task from chat message.');
    }
  };

  const currentUser = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  const messageEndRef = useRef(null);
  const threadEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const messageRowRefs = useRef({});
  const selectedRecipientRef = useRef(selectedRecipient);

  useEffect(() => {
    selectedRecipientRef.current = selectedRecipient;
  }, [selectedRecipient]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerDesktopNotification = (sender, text, channelName) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const title = isGroup ? `${sender} in #${channelName}` : `${sender}`;
    const notification = new Notification(title, { body: text, icon: '/favicon.ico' });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const fetchMyGroups = async () => {
    try {
      const res = await axios.get('/api/chat/groups/my-groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const backendGroups = res.data.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        admins: g.createdBy ? [g.createdBy.username] : [],
        members: g.members ? g.members.map((m) => m.username) : [],
        disabled: g.disabled || false
      }));
      const globalChannel = {
        id: 0,
        name: 'Global',
        admins: ['System'],
        members: ['Global Broadcast'],
        disabled: false,
        description: 'Public organization-wide channel'
      };
      setGroups([globalChannel, ...backendGroups]);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const fetchDirectory = async () => {
    try {
      const res = await axios.get('/api/users/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.filter((u) => u.username !== currentUser));
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    }
  };

  const fetchReactionsForMessages = async (messageList) => {
    const ids = messageList.map((m) => m.id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      const res = await axios.post('/api/chat/reactions/batch', ids, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newMap = {};
      res.data.forEach((r) => {
        if (!newMap[r.messageId]) newMap[r.messageId] = [];
        newMap[r.messageId].push(r);
      });
      setReactionsMap(newMap);
    } catch (err) {
      console.error('Failed to fetch reactions:', err);
    }
  };

  const fetchThreadCounts = async (messageList) => {
    const ids = messageList.map((m) => m.id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      const res = await axios.post('/api/chat/messages/thread-counts', ids, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThreadCounts(res.data);
    } catch (err) {
      console.error('Failed to fetch thread counts:', err);
    }
  };

  useEffect(() => {
    if (!chatSearchText.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get('/api/chat/search', {
          params: { query: chatSearchText.trim(), channel: selectedRecipient },
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [chatSearchText, selectedRecipient, token]);

  const jumpToMessage = (messageId) => {
    setShowSearchDropdown(false);
    setChatSearchText('');
    const targetNode = messageRowRefs.current[messageId];
    if (targetNode) {
      targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2500);
    }
  };

  const openThread = async (message) => {
    setActiveThreadMessage(message);
    setShowRightPanel(false);
    try {
      const res = await axios.get(`/api/chat/messages/${message.id}/thread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThreadReplies(res.data);
      fetchReactionsForMessages([message, ...res.data]);
    } catch (err) {
      console.error('Failed to fetch thread replies:', err);
    }
  };

  const closeThread = () => {
    setActiveThreadMessage(null);
    setThreadReplies([]);
    setThreadInput('');
  };

  const markDirectMessagesAsRead = async () => {
    if (!isGroup && selectedRecipient !== 'Global') {
      try {
        await axios.put(
          '/api/chat/read',
          { sender: selectedRecipient, recipient: currentUser },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        websocketService.sendPrivateMessage({
          sender: currentUser,
          recipient: selectedRecipient,
          type: 'READ',
          content: 'read'
        });
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  useEffect(() => {
    fetchDirectory();
    fetchMyGroups();

    websocketService.connect(currentUser, (incomingMsg) => {
      if (incomingMsg.type === 'REACTION_UPDATE') {
        setReactionsMap((prev) => ({
          ...prev,
          [incomingMsg.messageId]: incomingMsg.reactions
        }));
        return;
      }

      if (incomingMsg.type === 'READ') {
        if (incomingMsg.sender === selectedRecipientRef.current) {
          setMessages((prev) => prev.map((m) => (m.sender === currentUser ? { ...m, isRead: true } : m)));
        }
        return;
      }

      if (incomingMsg.type === 'TYPING') {
        const isGroupTyping = isGroup && incomingMsg.recipient === selectedRecipientRef.current;
        const isDirectTyping = !isGroup && incomingMsg.sender === selectedRecipientRef.current;
        if ((isGroupTyping || isDirectTyping) && incomingMsg.sender !== currentUser) {
          setTypingUser(incomingMsg.content === 'typing...' ? incomingMsg.sender : '');
        }
        return;
      }

      const isMentioned = incomingMsg.content && currentUser && incomingMsg.content.toLowerCase().includes(`@${currentUser.toLowerCase()}`);
      if (incomingMsg.sender !== currentUser && (isMentioned || document.hidden)) {
        triggerDesktopNotification(incomingMsg.sender, incomingMsg.content, incomingMsg.recipient);
      }

      const isTargetGroup = groups.some((g) => g.name === selectedRecipientRef.current);
      const isGroupMatch = isTargetGroup && incomingMsg.recipient === selectedRecipientRef.current;
      const isDirectMatch =
        !isTargetGroup &&
        ((incomingMsg.sender === selectedRecipientRef.current && incomingMsg.recipient === currentUser) ||
          (incomingMsg.sender === currentUser && incomingMsg.recipient === selectedRecipientRef.current));

      if (isGroupMatch || isDirectMatch) {
        if (incomingMsg.parentMessageId) {
          setThreadCounts((prev) => ({
            ...prev,
            [incomingMsg.parentMessageId]: (prev[incomingMsg.parentMessageId] || 0) + 1
          }));

          setActiveThreadMessage((currParent) => {
            if (currParent && currParent.id === incomingMsg.parentMessageId) {
              setThreadReplies((prevReplies) =>
                prevReplies.some((r) => r.id === incomingMsg.id) ? prevReplies : [...prevReplies, incomingMsg]
              );
            }
            return currParent;
          });
        } else {
          setMessages((prev) => (prev.some((m) => m.id === incomingMsg.id) ? prev : [...prev, incomingMsg]));
        }

        if (isDirectMatch && incomingMsg.sender === selectedRecipientRef.current) {
          markDirectMessagesAsRead();
        }
      }
    });

    return () => websocketService.disconnect();
  }, [currentUser]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        setChatPage(0);
        setHasMoreMessages(true);
        setIsLoadingOlder(false);

        const response = await axios.get('/api/chat/history/paged', {
          headers,
          params: {
            channel: selectedRecipient,
            isGroup,
            otherUser: selectedRecipient,
            page: 0,
            size: 50
          }
        });

        const initialMsgs = response.data.messages || [];
        setMessages(initialMsgs);
        setHasMoreMessages(response.data.hasMore);
        fetchReactionsForMessages(initialMsgs);
        fetchThreadCounts(initialMsgs);
        markDirectMessagesAsRead();
      } catch (err) {
        console.error('History retrieval failed:', err);
      }
    };

    fetchChatHistory();
    setShowRightPanel(false);
    closeThread();
    setTypingUser('');
    setActiveEmojiPickerMsgId(null);
    setChatSearchText('');
    setShowSearchDropdown(false);
  }, [selectedRecipient, isGroup, token, currentUser]);

  // Infinite Scroll: Load older 50 messages when scrolled to the top
  const handleScroll = async (e) => {
    const container = e.target;
    if (container.scrollTop < 40 && hasMoreMessages && !isLoadingOlder) {
      setIsLoadingOlder(true);
      const nextPage = chatPage + 1;
      prevScrollHeightRef.current = container.scrollHeight;
      isPrependingOlderRef.current = true;

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get('/api/chat/history/paged', {
          headers,
          params: {
            channel: selectedRecipient,
            isGroup,
            otherUser: selectedRecipient,
            page: nextPage,
            size: 50
          }
        });

        const olderMsgs = response.data.messages || [];
        if (olderMsgs.length > 0) {
          setMessages((prev) => [...olderMsgs, ...prev]);
          setChatPage(nextPage);
          setHasMoreMessages(response.data.hasMore);
          fetchReactionsForMessages(olderMsgs);
          fetchThreadCounts(olderMsgs);
        } else {
          setHasMoreMessages(false);
        }
      } catch (err) {
        console.error('Failed to load older messages:', err);
      } finally {
        setIsLoadingOlder(false);
      }
    }
  };

  // Reconnection Resilience: Automatically reconcile missed messages on connection recovery
  useEffect(() => {
    const handleReconnectSync = async () => {
      if (!token || !selectedRecipientRef.current) return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const lastId = messages.reduce((max, m) => (m.id && m.id > max ? m.id : max), 0);
        if (lastId > 0) {
          const res = await axios.get('/api/chat/sync/missed', {
            headers,
            params: { sinceId: lastId, channelOrUser: selectedRecipientRef.current }
          });
          const missed = res.data || [];
          if (missed.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const fresh = missed.filter((m) => !existingIds.has(m.id));
              return [...prev, ...fresh];
            });
            fetchReactionsForMessages(missed);
            fetchThreadCounts(missed);
          }
        }
      } catch (err) {
        console.error('Failed to sync missed messages on reconnect:', err);
      }
    };

    websocketService.onReconnect(handleReconnectSync);
    return () => websocketService.removeReconnectHandler(handleReconnectSync);
  }, [messages, token]);

  useEffect(() => {
    if (isPrependingOlderRef.current && messageContainerRef.current) {
      const container = messageContainerRef.current;
      const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = heightDiff;
      isPrependingOlderRef.current = false;
    } else if (!highlightedMessageId) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadReplies]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setInputMessage(value);
    setMentionCursorPos(cursor);

    const lastAtMatch = value.slice(0, cursor).match(/@(\w*)$/);
    setMentionQuery(lastAtMatch ? lastAtMatch[1].toLowerCase() : null);

    const typingPayload = {
      sender: currentUser,
      recipient: selectedRecipient,
      type: 'TYPING',
      content: 'typing...'
    };

    if (selectedRecipient === 'Global') websocketService.sendMessage(typingPayload);
    else if (isGroup) websocketService.sendGroupMessage(typingPayload);
    else websocketService.sendPrivateMessage(typingPayload);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      const stopPayload = {
        sender: currentUser,
        recipient: selectedRecipient,
        type: 'TYPING',
        content: 'stopped'
      };
      if (selectedRecipient === 'Global') websocketService.sendMessage(stopPayload);
      else if (isGroup) websocketService.sendGroupMessage(stopPayload);
      else websocketService.sendPrivateMessage(stopPayload);
    }, 1500);
  };

  const handleSelectMention = (username) => {
    setInputMessage(
      inputMessage.slice(0, mentionCursorPos).replace(/@\w*$/, `@${username} `) + inputMessage.slice(mentionCursorPos)
    );
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    return content.split(/(@\w+)/g).map((part, i) => {
      if (part.startsWith('@')) {
        const isMe = part.slice(1).toLowerCase() === (currentUser || '').toLowerCase();
        return (
          <span
            key={i}
            style={{
              color: isMe ? 'var(--neu-accent)' : 'var(--neu-text)',
              fontWeight: '700',
              padding: '0 4px',
              textShadow: isMe ? '0 0 1px var(--neu-accent)' : 'none'
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleSendText = (e) => {
    e.preventDefault();
    const activeGroupObj = groups.find((g) => g.name === selectedRecipient);
    if (activeGroupObj?.disabled) return alert('This channel is disabled.');
    if (!inputMessage.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const payload = {
      sender: currentUser,
      recipient: selectedRecipient,
      content: inputMessage.trim(),
      type: 'CHAT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      parentMessageId: null
    };

    if (selectedRecipient === 'Global') websocketService.sendMessage(payload);
    else if (isGroup) websocketService.sendGroupMessage(payload);
    else websocketService.sendPrivateMessage(payload);

    setInputMessage('');
    setMentionQuery(null);
  };

  const handleSendThreadReply = (e) => {
    e.preventDefault();
    if (!threadInput.trim() || !activeThreadMessage) return;

    const payload = {
      sender: currentUser,
      recipient: selectedRecipient,
      content: threadInput.trim(),
      type: 'CHAT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      parentMessageId: activeThreadMessage.id
    };

    if (selectedRecipient === 'Global') websocketService.sendMessage(payload);
    else if (isGroup) websocketService.sendGroupMessage(payload);
    else websocketService.sendPrivateMessage(payload);

    setThreadInput('');
  };

  const handleToggleReaction = (messageId, emoji) => {
    if (!messageId) return alert('Missing database ID. Refreshing conversation...');
    websocketService.sendReaction({
      messageId: Number(messageId),
      emoji: emoji,
      username: currentUser,
      recipient: selectedRecipient
    });
    setActiveEmojiPickerMsgId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const activeGroupObj = groups.find((g) => g.name === selectedRecipient);
    if (activeGroupObj?.disabled) return alert('This channel is disabled.');

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await axios.post('/api/chat/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      const payload = {
        sender: currentUser,
        recipient: selectedRecipient,
        content: `Uploaded attachment: ${file.name}`,
        type: 'FILE',
        fileUrl: res.data.url,
        fileType: res.data.type,
        fileName: file.name,
        attachmentId: res.data.attachmentId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        parentMessageId: null
      };

      if (selectedRecipient === 'Global') websocketService.sendMessage(payload);
      else if (isGroup) websocketService.sendGroupMessage(payload);
      else websocketService.sendPrivateMessage(payload);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createNewGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;

    try {
      await axios.post(
        '/api/chat/groups/create',
        { name: newGroupName, description: newGroupDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMyGroups();
      selectChat(newGroupName, true);
      setShowGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create channel.');
    }
  };

  const handleAddSingleMember = async (username) => {
    try {
      await axios.post(
        `/api/chat/groups/${selectedRecipient}/add-member`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMyGroups();
      alert(`${username} joined #${selectedRecipient}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member.');
    }
  };

  const handleToggleDisableGroup = async () => {
    try {
      const res = await axios.put(
        `/api/chat/groups/${selectedRecipient}/toggle-disable`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(groups.map((g) => (g.name === selectedRecipient ? { ...g, disabled: res.data.disabled } : g)));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle channel status.');
    }
  };

  const handleRemoveMember = async (username) => {
    if (window.confirm(`Remove ${username} from #${selectedRecipient}?`)) {
      try {
        await axios.post(
          `/api/chat/groups/${selectedRecipient}/remove-member`,
          { username },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchMyGroups();
        if (username === currentUser) selectChat('Global', true);
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to remove member.');
      }
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Permanently clear this conversation?')) {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        if (isGroup) await axios.delete(`/api/chat/clear/group?groupName=${selectedRecipient}`, { headers });
        else await axios.delete(`/api/chat/clear/private?user1=${currentUser}&user2=${selectedRecipient}`, { headers });
        setMessages([]);
        setReactionsMap({});
        closeThread();
      } catch (err) {
        alert('Clear chat operation failed.');
      }
    }
  };

  const selectChat = (name, groupFlag) => {
    setSelectedRecipient(name);
    setIsGroup(groupFlag);
  };

  const activeGroup = groups.find((g) => g.name === selectedRecipient);
  const iAmAdmin = activeGroup?.admins.includes(currentUser);

  const getGroupedReactions = (messageId) => {
    const reactions = reactionsMap[messageId] || [];
    const groupsObj = {};
    reactions.forEach((r) => {
      if (!groupsObj[r.emoji]) groupsObj[r.emoji] = [];
      groupsObj[r.emoji].push(r.username);
    });
    return groupsObj;
  };

  const filteredMentionUsers =
    mentionQuery !== null ? users.filter((u) => u.username.toLowerCase().startsWith(mentionQuery)) : [];

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      
      {/* SECONDARY SIDEBAR (Channels / DMs) */}
      <aside style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '20px 10px 20px 20px' }}>
        <div className="neu-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ padding: '0 24px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="neu-subtitle">CHANNELS</span>
                <button className="neu-btn neu-btn-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }} onClick={() => setShowGroupModal(true)}>
                  +
                </button>
              </div>
              <div>
                {groups.map((g) => (
                  <div key={g.name} className={`neu-nav-item ${selectedRecipient === g.name ? 'active' : ''}`} onClick={() => selectChat(g.name, true)}>
                    <span style={{ color: 'var(--neu-muted)' }}>#</span> {g.name} {g.disabled && ' 🔒'}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ padding: '0 24px', marginBottom: '10px' }}>
                <span className="neu-subtitle">DIRECT MESSAGES</span>
              </div>
              <div>
                {users.map((u) => (
                  <div key={u.id} className={`neu-nav-item ${selectedRecipient === u.username ? 'active' : ''}`} onClick={() => selectChat(u.username, false)}>
                    <div className="neu-status-dot"></div> {u.username}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT STAGE */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 20px 10px' }}>
        
        {/* Header Bar */}
        <header className="neu-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => { setShowRightPanel(!showRightPanel); closeThread(); }}>
            <h2 className="neu-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isGroup ? `# ${selectedRecipient}` : selectedRecipient}
              {isGroup && <span className="neu-subtitle">👤 {activeGroup?.members.length || 0}</span>}
              {isGroup && activeGroup?.disabled && <span className="neu-subtitle" style={{ color: 'var(--neu-danger)' }}>Read-only</span>}
            </h2>
          </div>

          {/* Search Field */}
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              className="neu-input"
              placeholder={`Search ${isGroup ? '#' : ''}${selectedRecipient}...`}
              value={chatSearchText}
              onChange={(e) => setChatSearchText(e.target.value)}
            />
            {showSearchDropdown && (
              <div className="neu-panel" style={{ position: 'absolute', top: '115%', left: 0, right: 0, maxHeight: '300px', overflowY: 'auto', zIndex: 40, padding: '12px' }}>
                <div style={{ padding: '4px 8px 8px 8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--neu-muted)', borderBottom: '1px solid var(--neu-glass-border)' }}>
                  {isSearching ? 'Searching...' : `Found ${searchResults.length} matches`}
                </div>
                {searchResults.length === 0 && !isSearching ? (
                  <div style={{ padding: '12px', fontSize: '12px', textAlign: 'center', color: 'var(--neu-muted)' }}>
                    No results found
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => jumpToMessage(result.id)}
                      className="neu-btn"
                      style={{ width: '100%', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '8px 0' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '11px', color: 'var(--neu-muted)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--neu-text)' }}>{result.sender}</span>
                        <span>{result.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px', textAlign: 'left', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {result.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="neu-btn neu-btn-icon neu-btn-danger" onClick={handleClearChat} title="Clear Chat">
              🗑️
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div
          ref={messageContainerRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}
        >
          {isLoadingOlder && (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', color: 'var(--neu-accent)' }}>
              ⚡ Loading older messages...
            </div>
          )}
          {!hasMoreMessages && messages.length >= 50 && (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '11px', color: 'var(--neu-muted)', opacity: 0.7 }}>
              — Beginning of conversation history —
            </div>
          )}
          {messages.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-muted)' }}>
              <h2 className="neu-title">Welcome to {isGroup ? `#${selectedRecipient}` : selectedRecipient}</h2>
              <p className="neu-subtitle">Beginning of your conversation history.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const groupedReactions = msg.id ? getGroupedReactions(msg.id) : {};
              const replyCount = msg.id ? threadCounts[msg.id] || 0 : 0;
              const isMentioningMe = msg.content && currentUser && msg.content.toLowerCase().includes(`@${currentUser.toLowerCase()}`);
              const isJumpHighlighted = highlightedMessageId === msg.id;

              return (
                <div
                  key={msg.id || idx}
                  ref={(el) => {
                    if (msg.id) messageRowRefs.current[msg.id] = el;
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleOpenConvertModal(msg);
                  }}
                  className={`neu-message-bubble ${isJumpHighlighted ? 'highlighted-jump' : ''} ${isMentioningMe ? 'highlighted-mention' : ''}`}
                  style={{ display: 'flex', gap: '16px' }}
                >
                  <div className="neu-avatar">{msg.sender.charAt(0).toUpperCase()}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{msg.sender === currentUser ? 'You' : msg.sender}</span>
                      <span className="neu-subtitle">{msg.timestamp}</span>
                      {msg.sender === currentUser && !isGroup && (
                        <span style={{ fontSize: '11px', color: msg.isRead ? 'var(--neu-success)' : 'var(--neu-muted)' }}>
                          {msg.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', marginTop: '6px', lineHeight: '1.5' }}>
                      {renderMessageContent(msg.content)}

                      {msg.fileUrl && (
                        <div style={{ marginTop: '12px' }}>
                          {msg.fileType === 'image' || msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                            <img src={msg.fileUrl} alt={msg.fileName || 'Attachment'} style={{ maxWidth: '320px', borderRadius: '12px', boxShadow: 'var(--neu-shadow-raised)' }} />
                          ) : (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="neu-btn neu-btn-pill" style={{ textDecoration: 'none' }}>
                              📎 {msg.fileName || 'Download attachment'}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reactions & Thread Replies */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {Object.entries(groupedReactions).map(([emoji, usernames]) => {
                        const hasReacted = usernames.includes(currentUser);
                        return (
                          <button
                            key={emoji}
                            className={`neu-btn neu-btn-pill ${hasReacted ? 'active' : ''}`}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            title={`Reacted by: ${usernames.join(', ')}`}
                          >
                            {emoji} <span style={{ marginLeft: '6px' }}>{usernames.length}</span>
                          </button>
                        );
                      })}
                      {replyCount > 0 && (
                        <button className="neu-btn neu-btn-pill" onClick={() => openThread(msg)}>
                          💬 {replyCount} replies
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Context Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                    <button className="neu-btn neu-btn-icon" onClick={() => setActiveEmojiPickerMsgId(activeEmojiPickerMsgId === msg.id ? null : msg.id)} title="Add reaction">
                      😀
                    </button>
                    <button className="neu-btn neu-btn-icon" onClick={() => openThread(msg)} title="Reply in thread">
                      💬
                    </button>
                    <button
                      className="neu-btn neu-btn-icon"
                      onClick={() => handleOpenConvertModal(msg)}
                      title="Convert to Kanban Task"
                    >
                      📋
                    </button>
                  </div>

                  {/* Inline Floating Reaction Quick Selector */}
                  {activeEmojiPickerMsgId === msg.id && (
                    <div className="neu-panel" style={{ position: 'absolute', right: '16px', top: '-46px', display: 'flex', gap: '8px', padding: '8px 12px', zIndex: 20 }}>
                      {AVAILABLE_EMOJIS.map((emoji) => (
                        <button key={emoji} className="neu-btn neu-btn-icon" onClick={() => handleToggleReaction(msg.id, emoji)}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>

        {typingUser && (
          <div className="neu-subtitle" style={{ padding: '8px 16px', fontStyle: 'italic' }}>
            {typingUser} is typing...
          </div>
        )}

        {/* Input Bar */}
        <div style={{ position: 'relative', marginTop: '12px' }}>
          {mentionQuery !== null && filteredMentionUsers.length > 0 && (
            <div className="neu-panel" style={{ position: 'absolute', bottom: '100%', left: '16px', width: '220px', maxHeight: '180px', overflowY: 'auto', zIndex: 30, marginBottom: '10px', padding: '10px' }}>
              <div className="neu-subtitle" style={{ marginBottom: '8px' }}>
                MATCHING MEMBERS
              </div>
              {filteredMentionUsers.map((u) => (
                <div
                  key={u.id}
                  className="neu-btn"
                  style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', justifyContent: 'flex-start', margin: '4px 0', gap: '8px' }}
                  onClick={() => handleSelectMention(u.username)}
                >
                  <div className="neu-avatar neu-avatar-sm">{u.username.charAt(0).toUpperCase()}</div>
                  <span style={{ fontSize: '13px' }}>{u.username}</span>
                </div>
              ))}
            </div>
          )}

          <form className="neu-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }} onSubmit={handleSendText}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <button
              type="button"
              className="neu-btn neu-btn-icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || activeGroup?.disabled}
            >
              {isUploading ? '⏳' : '📎'}
            </button>
            <input
              ref={inputRef}
              type="text"
              className="neu-input"
              placeholder={activeGroup?.disabled ? `You do not have permission to send messages to #${selectedRecipient}` : `Message ${isGroup ? '#' : ''}${selectedRecipient}...`}
              value={inputMessage}
              onChange={handleInputChange}
              disabled={activeGroup?.disabled}
            />
            <button
              type="submit"
              className="neu-btn neu-btn-icon neu-btn-primary"
              disabled={activeGroup?.disabled || !inputMessage.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      </main>

      {/* THREAD DRAWER */}
      {activeThreadMessage && (
        <aside style={{ width: '420px', display: 'flex', flexDirection: 'column', padding: '20px 20px 20px 10px' }}>
          <div className="neu-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="neu-title">Thread</h3>
              <button className="neu-btn neu-btn-icon" onClick={closeThread}>
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
              <div className="neu-message-bubble" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div className="neu-avatar neu-avatar-sm">{activeThreadMessage.sender.charAt(0).toUpperCase()}</div>
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>
                    {activeThreadMessage.sender === currentUser ? 'You' : activeThreadMessage.sender}
                  </span>
                  <span className="neu-subtitle">{activeThreadMessage.timestamp}</span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{renderMessageContent(activeThreadMessage.content)}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {threadReplies.length === 0 ? (
                  <p className="neu-subtitle" style={{ textAlign: 'center', fontStyle: 'italic', margin: '20px 0' }}>
                    No replies yet.
                  </p>
                ) : (
                  threadReplies.map((reply) => (
                    <div key={reply.id} style={{ display: 'flex', gap: '12px' }}>
                      <div className="neu-avatar neu-avatar-sm">{reply.sender.charAt(0).toUpperCase()}</div>
                      <div className="neu-panel-inset" style={{ flex: 1, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', fontSize: '12px' }}>{reply.sender === currentUser ? 'You' : reply.sender}</span>
                          <span className="neu-subtitle" style={{ fontSize: '10px' }}>{reply.timestamp}</span>
                        </div>
                        <div style={{ fontSize: '13px' }}>{renderMessageContent(reply.content)}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>
            </div>

            <form onSubmit={handleSendThreadReply} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <input
                type="text"
                className="neu-input"
                placeholder="Reply in thread..."
                value={threadInput}
                onChange={(e) => setThreadInput(e.target.value)}
              />
              <button type="submit" className="neu-btn neu-btn-icon neu-btn-primary" disabled={!threadInput.trim()}>
                ➤
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* DETAILS / MEMBERS DRAWER */}
      {showRightPanel && isGroup && !activeThreadMessage && (
        <aside style={{ width: '360px', display: 'flex', flexDirection: 'column', padding: '20px 20px 20px 10px' }}>
          <div className="neu-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="neu-title">Channel Details</h3>
              <button className="neu-btn neu-btn-icon" onClick={() => setShowRightPanel(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button className={`neu-btn neu-btn-pill ${rightPanelTab === 'About' ? 'active' : ''}`} onClick={() => setRightPanelTab('About')} style={{ flex: 1 }}>
                About
              </button>
              <button className={`neu-btn neu-btn-pill ${rightPanelTab === 'Members' ? 'active' : ''}`} onClick={() => setRightPanelTab('Members')} style={{ flex: 1 }}>
                Members
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {rightPanelTab === 'About' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="neu-panel-inset" style={{ padding: '16px' }}>
                    <div className="neu-subtitle" style={{ marginBottom: '6px' }}>CHANNEL NAME</div>
                    <p style={{ fontWeight: '700' }}>#{selectedRecipient}</p>
                  </div>
                  <div className="neu-panel-inset" style={{ padding: '16px' }}>
                    <div className="neu-subtitle" style={{ marginBottom: '6px' }}>DESCRIPTION</div>
                    <p style={{ fontSize: '13px' }}>{activeGroup?.description || 'No description set.'}</p>
                  </div>
                  {iAmAdmin && selectedRecipient !== 'Global' && (
                    <button
                      className="neu-btn neu-btn-pill"
                      onClick={handleToggleDisableGroup}
                      style={{ width: '100%', padding: '12px', color: activeGroup?.disabled ? 'var(--neu-success)' : 'var(--neu-danger)' }}
                    >
                      {activeGroup?.disabled ? '🔓 Unlock Channel' : '🔒 Archive Channel'}
                    </button>
                  )}
                </div>
              )}

              {rightPanelTab === 'Members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input
                    type="text"
                    className="neu-input"
                    placeholder="Find members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {iAmAdmin && selectedRecipient !== 'Global' && (
                    <div className="neu-panel-inset" style={{ padding: '12px' }}>
                      <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                        ADD PEOPLE
                      </label>
                      {users
                        .filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()) && !activeGroup?.members.includes(u.username))
                        .map((u) => (
                          <div
                            key={u.id}
                            className="neu-btn"
                            style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', justifyContent: 'flex-start', margin: '4px 0', gap: '8px' }}
                            onClick={() => handleAddSingleMember(u.username)}
                          >
                            <div className="neu-avatar neu-avatar-sm">{u.username.charAt(0).toUpperCase()}</div>
                            <span style={{ flex: 1, textAlign: 'left', fontSize: '13px' }}>{u.username}</span>
                            <span className="neu-subtitle" style={{ color: 'var(--neu-accent)', fontWeight: 'bold' }}>
                              Add
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  <div>
                    {activeGroup?.members.map((member) => (
                      <div key={member} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                        <div className="neu-avatar neu-avatar-sm">{member.charAt(0).toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>{member === currentUser ? 'You' : member}</span>
                          {activeGroup.admins.includes(member) && (
                            <span className="neu-subtitle" style={{ marginLeft: '6px', color: 'var(--neu-accent)' }}>
                              Admin
                            </span>
                          )}
                        </div>
                        {(iAmAdmin || member === currentUser) && selectedRecipient !== 'Global' && (
                          <button
                            className="neu-btn neu-btn-pill neu-btn-danger"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => handleRemoveMember(member)}
                          >
                            {member === currentUser ? 'Leave' : 'Remove'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* CREATE CHANNEL MODAL */}
      {showGroupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="neu-panel" style={{ width: '460px', padding: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="neu-title">Create a channel</h2>
              <button className="neu-btn neu-btn-icon" onClick={() => setShowGroupModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={createNewGroup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p className="neu-subtitle">
                Channels organize team discussions around projects, squads, or topics.
              </p>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>NAME</label>
                <input
                  type="text"
                  required
                  className="neu-input"
                  placeholder="e.g. backend-dev"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
              </div>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>DESCRIPTION (OPTIONAL)</label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="What is this channel about?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="neu-btn neu-btn-pill neu-btn-primary"
                style={{ width: '100%', padding: '14px', marginTop: '10px', fontSize: '14px' }}
              >
                Create Channel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT CHAT MESSAGE TO KANBAN TASK MODAL (Chat-to-Task Bridge) */}
      {showConvertModal && messageToConvert && (
        <div
          onClick={() => setShowConvertModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            className="neu-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '520px', maxWidth: '92vw', padding: '32px', borderRadius: '22px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="neu-title" style={{ fontSize: '20px' }}>Convert Message to Kanban Task</h2>
                <p className="neu-subtitle">Turn message from @{messageToConvert.sender} into an actionable deliverable.</p>
              </div>
              <button className="neu-btn neu-btn-icon" onClick={() => setShowConvertModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTaskFromChat} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>TASK TITLE</label>
                <input
                  type="text"
                  required
                  className="neu-input"
                  value={convertForm.title}
                  onChange={(e) => setConvertForm({ ...convertForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea
                  className="neu-input"
                  rows="3"
                  value={convertForm.description}
                  onChange={(e) => setConvertForm({ ...convertForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>PROJECT INITIATIVE</label>
                  <select
                    className="neu-input"
                    value={convertForm.project}
                    onChange={(e) => setConvertForm({ ...convertForm, project: e.target.value })}
                  >
                    <option value="ConnectHub Web Platform">ConnectHub Web Platform</option>
                    <option value="Mobile Client v2">Mobile Client v2</option>
                    <option value="Enterprise Security & Audit">Enterprise Security & Audit</option>
                    <option value="Design System & Accessibility">Design System & Accessibility</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>PRIORITY</label>
                  <select
                    className="neu-input"
                    value={convertForm.priority}
                    onChange={(e) => setConvertForm({ ...convertForm, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>STORY POINTS</label>
                  <input
                    type="number"
                    min="1"
                    max="21"
                    className="neu-input"
                    value={convertForm.storyPoints}
                    onChange={(e) => setConvertForm({ ...convertForm, storyPoints: e.target.value })}
                  />
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>ASSIGN TO</label>
                  <select
                    className="neu-input"
                    value={convertForm.assignedUserId}
                    onChange={(e) => setConvertForm({ ...convertForm, assignedUserId: e.target.value })}
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>@{u.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="neu-btn neu-btn-pill"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => setShowConvertModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn neu-btn-pill neu-btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Create Task 📋
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Feedback Toast */}
      {convertFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '32px',
          zIndex: 1200,
          padding: '12px 24px',
          borderRadius: '16px',
          background: 'var(--neu-bg)',
          boxShadow: 'var(--neu-shadow-raised)',
          borderLeft: '4px solid var(--neu-success)',
          color: 'var(--neu-success)',
          fontWeight: '600',
          fontSize: '13px'
        }}>
          {convertFeedback}
        </div>
      )}
    </div>
  );
}

export default Chat;