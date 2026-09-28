import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexus_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const inputRef = useRef(null);
  const token = localStorage.getItem('token');
  const userRole = (localStorage.getItem('role') || 'MEMBER').toUpperCase();
  const isAdminOrLead = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(userRole);
  const isAdmin = ['ADMIN', 'PROJECT_MANAGER'].includes(userRole);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fetch live tasks, users, and audit logs for universal indexing
  useEffect(() => {
    if (isOpen && token) {
      const headers = { Authorization: `Bearer ${token}` };
      axios.get('http://localhost:8080/api/tasks/all', { headers })
        .then(res => setTasks(res.data))
        .catch(() => {});
      axios.get('http://localhost:8080/api/users/directory', { headers })
        .then(res => setUsers(res.data))
        .catch(() => {});
      axios.get('http://localhost:8080/api/audit/all', { headers })
        .then(res => setAuditLogs(res.data))
        .catch(() => {});
    }
  }, [isOpen, token]);

  // Static navigation items
  const navItems = [
    { id: 'nav-dashboard', category: 'Navigation', icon: '📊', title: 'Dashboard', subtitle: 'Workspace KPIs, Member Focus, and Executive views', action: () => navigate('/dashboard') },
    { id: 'nav-mywork', category: 'Navigation', icon: '⚡', title: 'My Work', subtitle: 'Your personal sprint task queue', action: () => navigate('/my-work') },
    { id: 'nav-tasks', category: 'Navigation', icon: '📋', title: 'Task Board', subtitle: 'Interactive 6-column Jira-style Kanban board', action: () => navigate('/tasks') },
    { id: 'nav-projects', category: 'Navigation', icon: '📦', title: 'Projects & Roadmaps', subtitle: 'Strategic initiatives, timelines, and milestones', action: () => navigate('/projects') },
    { id: 'nav-teams', category: 'Navigation', icon: '👥', title: 'Teams & Workload Balancer', subtitle: 'Cross-functional rosters and capacity heatmaps', action: () => navigate('/teams') },
    { id: 'nav-users', category: 'Navigation', icon: '👤', title: 'User Management', subtitle: 'Member directory, roles, and permissions matrix', action: () => navigate('/users') },
    { id: 'nav-chat', category: 'Navigation', icon: '💬', title: 'Chat & Comms', subtitle: 'Real-time WebSocket channels & direct messaging', action: () => navigate('/chat') },
    { id: 'nav-profile', category: 'Navigation', icon: '⚙️', title: 'Settings & Profile', subtitle: 'Account preferences and security credentials', action: () => navigate('/profile') },
    ...(isAdmin ? [
      { id: 'nav-audit', category: 'Navigation', icon: '📜', title: 'Audit History', subtitle: 'Compliance logs and workspace activity', action: () => navigate('/audit') }
    ] : [])
  ];

  // Channels Index
  const channels = [
    { name: 'general', desc: 'Organization-wide public announcements & discussion' },
    { name: 'engineering', desc: 'Backend microservices, WebSocket sync & databases' },
    { name: 'product-design', desc: 'SaaS UX wireframing, component tokens & design' },
    { name: 'security', desc: 'Zero-trust RBAC access controls, JWT & compliance' },
    { name: 'qa-releases', desc: 'Test automation, regression passes & sprint sign-off' }
  ];

  // Instant quick-action triggers
  const actionItems = [
    { id: 'act-task', category: 'Actions', icon: '➕', title: 'Create New Task', subtitle: 'Add deliverable to sprint backlog', action: () => navigate('/tasks') },
    ...(isAdminOrLead ? [
      { id: 'act-invite', category: 'Actions', icon: '✉️', title: 'Invite New User', subtitle: 'Send onboarding email and role assignment', action: () => navigate('/users') }
    ] : []),
    { id: 'act-project', category: 'Actions', icon: '🚀', title: 'Create New Project', subtitle: 'Start a new strategic initiative', action: () => navigate('/projects') },
    { id: 'act-matrix', category: 'Actions', icon: '🛡️', title: 'View Permissions Matrix', subtitle: 'Inspect RBAC access controls across roles', action: () => navigate('/users') },
    { id: 'act-balancer', category: 'Actions', icon: '⚖️', title: 'Open Workload Balancer', subtitle: 'Rebalance squad story point distribution', action: () => navigate('/teams') },
    ...(isAdmin ? [
      { id: 'act-export', category: 'Actions', icon: '📥', title: 'Export Audit Ledger (CSV)', subtitle: 'Download compliance log records', action: () => navigate('/audit') }
    ] : []),
    { id: 'act-chat', category: 'Actions', icon: '💬', title: 'Start Conversation', subtitle: 'Direct message or team room', action: () => navigate('/chat') }
  ];

  // Universal dynamic search matching
  const searchResults = (() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...actionItems, ...navItems];
    }

    const matches = [];

    // 1. Match static nav & actions
    [...actionItems, ...navItems].forEach(item => {
      if (item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)) {
        matches.push(item);
      }
    });

    // 2. Match Chat Channels
    channels.forEach(ch => {
      if (ch.name.toLowerCase().includes(q) || ch.desc.toLowerCase().includes(q)) {
        matches.push({
          id: `channel-${ch.name}`,
          category: 'Chat Channels',
          icon: '💬',
          title: `#${ch.name}`,
          subtitle: ch.desc,
          action: () => navigate('/chat')
        });
      }
    });

    // 3. Match live Tasks
    tasks.forEach(t => {
      const titleMatch = t.title && t.title.toLowerCase().includes(q);
      const descMatch = t.description && t.description.toLowerCase().includes(q);
      const idMatch = `tsk-${t.id}`.toLowerCase().includes(q);
      const projMatch = t.project && t.project.toLowerCase().includes(q);
      if (titleMatch || descMatch || idMatch || projMatch) {
        matches.push({
          id: `task-${t.id}`,
          category: 'Tasks',
          icon: '📋',
          title: `TSK-${t.id}: ${t.title}`,
          subtitle: `Status: ${t.status} • Assignee: @${t.assignedUser?.username || 'Unassigned'} • ${t.project || 'General'}`,
          action: () => navigate('/tasks')
        });
      }
    });

    // 4. Match live Users
    users.forEach(u => {
      const userMatch = u.username && u.username.toLowerCase().includes(q);
      const emailMatch = u.email && u.email.toLowerCase().includes(q);
      const deptMatch = u.department && u.department.toLowerCase().includes(q);
      if (userMatch || emailMatch || deptMatch) {
        matches.push({
          id: `user-${u.id}`,
          category: 'Team Members',
          icon: '👤',
          title: `@${u.username}`,
          subtitle: `${u.role} • ${u.department || 'Workspace Member'} (${u.email || 'No email'})`,
          action: () => navigate('/users')
        });
      }
    });

    // 5. Match Audit Records (Requirement: Universal Search across audit records)
    auditLogs.forEach(log => {
      const logMatch = log.actionLog && log.actionLog.toLowerCase().includes(q);
      const actorMatch = log.actor && log.actor.toLowerCase().includes(q);
      const entityMatch = log.entityId && log.entityId.toLowerCase().includes(q);
      const actionTypeMatch = log.actionType && log.actionType.toLowerCase().includes(q);
      if (logMatch || actorMatch || entityMatch || actionTypeMatch) {
        matches.push({
          id: `audit-${log.id}`,
          category: 'Audit Records',
          icon: '📜',
          title: `Audit #${log.id}: ${log.actionLog}`,
          subtitle: `Recorded by @${log.actor || 'System'} • ${log.timestamp || 'Recent'}`,
          action: () => navigate('/audit')
        });
      }
    });

    return matches;
  })();

  const saveRecentSearch = (text) => {
    if (!text.trim()) return;
    const updated = [text.trim(), ...recentSearches.filter(s => s !== text.trim())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('nexus_recent_searches', JSON.stringify(updated));
  };

  const executeItem = (item) => {
    if (query.trim()) {
      saveRecentSearch(query);
    }
    onClose();
    item.action();
  };

  // Keyboard navigation handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, searchResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          executeItem(searchResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, searchResults]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(5px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '11vh'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="neu-panel"
        style={{
          width: '640px',
          maxWidth: '92vw',
          maxHeight: '70vh',
          borderRadius: '18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Search Input Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--neu-glass-border)'
        }}>
          <span style={{ fontSize: '18px', opacity: 0.8, color: 'var(--neu-accent)' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="neu-input"
            placeholder="Search tasks (TSK-*), channels (#...), members (@...), audit, or commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              fontSize: '15px',
              padding: '4px 0',
              outline: 'none',
              color: 'var(--neu-text)'
            }}
          />
          <kbd style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--neu-accent)',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            boxShadow: '0 0 8px rgba(0, 242, 254, 0.15)',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            ESC
          </kbd>
        </div>

        {/* Recent Searches Pills (when query is empty) */}
        {!query && recentSearches.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--neu-glass-border)',
            fontSize: '12px'
          }}>
            <span style={{ color: 'var(--neu-muted)', fontSize: '11px' }}>Recent:</span>
            {recentSearches.map((s, idx) => (
              <span
                key={idx}
                className="badge-tag"
                style={{ cursor: 'pointer', fontSize: '11px' }}
                onClick={() => setQuery(s)}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Results Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--neu-muted)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔎</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>No results found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try searching for a task "TSK-", channel "#engineering", "@user", or action</div>
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id || idx}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`saas-card ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(0, 242, 254, 0.12)' : undefined,
                    border: isSelected ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid transparent',
                    boxShadow: isSelected ? '0 0 16px rgba(0, 242, 254, 0.2)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--neu-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--neu-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      color: 'var(--neu-muted)',
                      letterSpacing: '0.5px',
                      fontWeight: 'bold'
                    }}>
                      {item.category}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '12px', color: 'var(--neu-accent)', fontWeight: 'bold' }}>
                        ↵
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--neu-glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--neu-muted)'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>ESC</kbd> to dismiss</span>
          </div>
          <span>Universal Jump-to Search</span>
        </div>

      </div>
    </div>
  );
}

export default CommandPalette;
