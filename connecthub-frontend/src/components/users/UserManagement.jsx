import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../ConfirmDialog';
import axios from 'axios';

const ROLES = [
  { value: 'ADMIN', label: 'Administrator', desc: 'Full workspace and system administration' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager', desc: 'Manage projects, teams, tasks, and members' },
  { value: 'TEAM_LEAD', label: 'Team Lead', desc: 'Manage sprint tasks and assign deliverables' },
  { value: 'MEMBER', label: 'Member', desc: 'Collaborate in chat, work on assigned tasks' },
  { value: 'VIEWER', label: 'Viewer', desc: 'Read-only access across the workspace' }
];

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'DevOps & Cloud', 'Marketing', 'Operations', 'Leadership'];

// Comprehensive Permissions Matrix definition (Requirement 11)
const PERMISSION_COLUMNS = [
  { key: 'workspaceAccess', label: 'Workspace Access' },
  { key: 'projectAccess', label: 'Project Access' },
  { key: 'taskCreation', label: 'Task Creation' },
  { key: 'taskEditing', label: 'Task Editing' },
  { key: 'taskDeletion', label: 'Task Deletion' },
  { key: 'userManagement', label: 'User Management' },
  { key: 'auditHistory', label: 'Audit History' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'settings', label: 'Settings' },
  { key: 'chatAdministration', label: 'Chat Administration' }
];

const ROLE_PERMISSIONS = {
  ADMIN: {
    title: 'Workspace Administrator',
    badge: 'FULL GOVERNANCE',
    description: 'Complete operational and governance authority across the workspace, database, and compliance trail.',
    permissions: {
      workspaceAccess: 'Full Access',
      projectAccess: 'All Projects',
      taskCreation: 'Allowed',
      taskEditing: 'All Tasks',
      taskDeletion: 'Allowed',
      userManagement: 'Full (Invite, Roles, Suspend, Delete)',
      auditHistory: 'Full Access & Export',
      reports: 'All Workspace Analytics',
      settings: 'Full System & Security Config',
      chatAdministration: 'All Channels & Moderation'
    }
  },
  PROJECT_MANAGER: {
    title: 'Project Manager',
    badge: 'DELIVERY LEAD',
    description: 'Manages roadmaps, project deliverables, sprint backlogs, and invites squad contributors.',
    permissions: {
      workspaceAccess: 'Full Access',
      projectAccess: 'All Projects',
      taskCreation: 'Allowed',
      taskEditing: 'All Tasks',
      taskDeletion: 'Allowed',
      userManagement: 'Invite & Team Assign',
      auditHistory: 'Read-Only View',
      reports: 'Project Velocity & Burndown',
      settings: 'Project Settings Only',
      chatAdministration: 'Create Channels & Rooms'
    }
  },
  TEAM_LEAD: {
    title: 'Team Lead',
    badge: 'SQUAD LEAD',
    description: 'Leads functional squads, balances workloads, manages sprint tasks, and guides execution.',
    permissions: {
      workspaceAccess: 'Standard',
      projectAccess: 'Assigned Projects',
      taskCreation: 'Allowed',
      taskEditing: 'Squad Tasks',
      taskDeletion: 'Restricted',
      userManagement: 'View Roster & Assign Work',
      auditHistory: 'No Access',
      reports: 'Squad Workload Heatmap',
      settings: 'No Access',
      chatAdministration: 'Squad Channels Only'
    }
  },
  MEMBER: {
    title: 'Team Member',
    badge: 'CONTRIBUTOR',
    description: 'Executes assigned deliverables, creates tasks, comments, and communicates in team channels.',
    permissions: {
      workspaceAccess: 'Standard',
      projectAccess: 'Assigned Projects',
      taskCreation: 'Allowed',
      taskEditing: 'Assigned Tasks Only',
      taskDeletion: 'Restricted',
      userManagement: 'Directory Read-Only',
      auditHistory: 'No Access',
      reports: 'Personal Workload View',
      settings: 'Personal Profile Only',
      chatAdministration: 'Post & Reply Only'
    }
  },
  VIEWER: {
    title: 'Stakeholder / Viewer',
    badge: 'READ ONLY',
    description: 'Read-only workspace visibility for progress tracking and observing sprint status.',
    permissions: {
      workspaceAccess: 'Read Only',
      projectAccess: 'Read Only',
      taskCreation: 'Restricted',
      taskEditing: 'Restricted',
      taskDeletion: 'Restricted',
      userManagement: 'Directory Read-Only',
      auditHistory: 'No Access',
      reports: 'Read-only Dashboards',
      settings: 'Personal Profile Only',
      chatAdministration: 'Read & Reply Only'
    }
  }
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('DIRECTORY'); // 'DIRECTORY' | 'PERMISSIONS'
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, INVITED, SUSPENDED
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [confirmState, setConfirmState] = useState(null); // { type: 'status'|'delete', user }
  const [editUser, setEditUser] = useState(null); // editable copy { id, username, email, department, role }
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Slide-over drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  // Invite Form
  const [inviteForm, setInviteForm] = useState({
    username: '',
    email: '',
    role: 'MEMBER',
    department: 'Engineering',
    autoPassword: true,
    customPassword: ''
  });

  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username');
  const userRole = (localStorage.getItem('role') || 'MEMBER').toUpperCase();
  // Live role from the directory (localStorage role goes stale after admin promotion;
  // the directory always carries the current role, so derive permissions from it)
  const myProfile = users.find(u => u.username === currentUser);
  const effectiveRole = ((myProfile && myProfile.role) || userRole).toUpperCase();
  const isAdmin = effectiveRole === 'ADMIN';
  const isManagerOrAdmin = ['ADMIN', 'PROJECT_MANAGER'].includes(effectiveRole);
  const isLeadOrAbove = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(effectiveRole);

  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/users/directory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch directory', err);
      showFeedback('danger', 'Failed to load user directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  // Inline Role Escalation / Demotion
  const handleRoleChange = async (userId, targetUsername, newRole) => {
    if (!isManagerOrAdmin) {
      showFeedback('danger', 'Access Denied: Only Admins and Project Managers can modify roles.');
      return;
    }

    try {
      await axios.put(
        `/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showFeedback('success', `Role for @${targetUsername} updated to ${newRole}`);
    } catch (err) {
      showFeedback('danger', err.response?.data?.error || 'Failed to update role');
    }
  };

  // One-Click Status Enforcement (ACTIVE <-> SUSPENDED)
  const handleToggleStatus = async () => {
    const user = confirmState?.user;
    setConfirmState(null);
    if (!user) return;
    if (!isManagerOrAdmin) {
      showFeedback('danger', 'Access Denied: Only Admins and Project Managers can update account status.');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      await axios.put(
        `/api/users/${user.id}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      showFeedback('success', `@${user.username} is now marked as ${nextStatus}`);
    } catch (err) {
      showFeedback('danger', err.response?.data?.error || 'Failed to update account status');
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    const user = confirmState?.user;
    setConfirmState(null);
    if (!user) return;
    if (!isAdmin) {
      showFeedback('danger', 'Access Denied: Only Workspace Admins can delete user accounts.');
      return;
    }

    try {
      await axios.delete(`/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showFeedback('success', `User @${user.username} has been removed`);
    } catch (err) {
      showFeedback('danger', err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Submit Invite Form
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        username: inviteForm.username.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        department: inviteForm.department,
        password: inviteForm.autoPassword ? '' : inviteForm.customPassword
      };

      const res = await axios.post('/api/users/invite', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInviteResult({
        username: res.data.user.username,
        email: res.data.user.email,
        role: res.data.user.role,
        temporaryPassword: res.data.temporaryPassword
      });

      // Update directory list
      setUsers(prev => [res.data.user, ...prev]);

      // Reset form
      setInviteForm({
        username: '',
        email: '',
        role: 'MEMBER',
        department: 'Engineering',
        autoPassword: true,
        customPassword: ''
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Invitation failed. Username or email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter calculations
  const counts = {
    ALL: users.length,
    ACTIVE: users.filter(u => u.status === 'ACTIVE').length,
    INVITED: users.filter(u => u.status === 'INVITED').length,
    SUSPENDED: users.filter(u => u.status === 'SUSPENDED').length
  };

  const filteredUsers = users.filter(u => {
    const matchesTab = activeTab === 'ALL' || u.status === activeTab;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query ||
      (u.username && u.username.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.role && u.role.toLowerCase().includes(query)) ||
      (u.department && u.department.toLowerCase().includes(query));
    return matchesTab && matchesQuery;
  });

  // Pagination (10 users per page, resets when filters change)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageFrom = filteredUsers.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(safePage * PAGE_SIZE, filteredUsers.length);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      const res = await axios.put(
        `/api/users/${editUser.id}`,
        { email: editUser.email, department: editUser.department, role: editUser.role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const saved = res.data.user || editUser;
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, email: saved.email, department: saved.department, role: saved.role } : u));
      setEditUser(null);
      showFeedback('success', `User @${editUser.username} updated`);
    } catch (err) {
      showFeedback('danger', err.response?.data?.error || 'Failed to update user');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Toast Feedback Notification */}
      {feedback.message && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '32px',
          zIndex: 100,
          padding: '12px 24px',
          borderRadius: '16px',
          background: 'var(--neu-bg)',
          boxShadow: 'var(--neu-shadow-raised)',
          borderLeft: feedback.type === 'danger' ? '4px solid var(--neu-danger)' : '4px solid var(--neu-success)',
          color: feedback.type === 'danger' ? 'var(--neu-danger)' : 'var(--neu-success)',
          fontWeight: '600',
          fontSize: '13px'
        }}>
          {feedback.message}
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Mode Segmented Switch: Directory vs Permissions Matrix */}
          <div className="neu-panel-inset" style={{ display: 'flex', padding: '4px', borderRadius: '24px' }}>
            <button
              className={`neu-btn neu-btn-pill ${viewMode === 'DIRECTORY' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '6px 16px', fontSize: '12px', border: 'none', boxShadow: viewMode === 'DIRECTORY' ? undefined : 'none' }}
              onClick={() => setViewMode('DIRECTORY')}
            >
              👥 Member Directory
            </button>
            <button
              className={`neu-btn neu-btn-pill ${viewMode === 'PERMISSIONS' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '6px 16px', fontSize: '12px', border: 'none', boxShadow: viewMode === 'PERMISSIONS' ? undefined : 'none' }}
              onClick={() => setViewMode('PERMISSIONS')}
            >
              🛡️ Permissions Matrix
            </button>
          </div>

          {/* Invite User Action (Available to Admins & Project Managers) */}
          {isManagerOrAdmin && (
            <button
              className="neu-btn neu-btn-pill neu-btn-primary"
              style={{ padding: '10px 20px', gap: '8px', fontSize: '13px' }}
              onClick={() => {
                setInviteResult(null);
                setIsDrawerOpen(true);
              }}
            >
              <span>+</span>
              <span>Invite New User</span>
            </button>
          )}
        </div>
      </div>


      {/* VIEW MODE 1: DIRECTORY & ACCOUNTS */}
      {viewMode === 'DIRECTORY' && (
        <>
          {/* Status Filter Tabs & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { id: 'ALL', label: 'All Users', icon: '👥' },
                { id: 'ACTIVE', label: 'Active', icon: '🟢' },
                { id: 'INVITED', label: 'Invited', icon: '✉️' },
                { id: 'SUSPENDED', label: 'Suspended', icon: '🔴' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`neu-btn neu-btn-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px'
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span style={{
                      background: isActive ? 'var(--neu-accent)' : 'rgba(148, 163, 184, 0.2)',
                      color: isActive ? '#ffffff' : 'var(--neu-text)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {counts[tab.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Search */}
            <input
              type="text"
              className="neu-input"
              placeholder="Search by name, email, department, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>

          {/* Directory Table Panel */}
          <div className="neu-panel" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--neu-muted)' }}>
                Loading workspace directory...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--neu-muted)' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                <h3 className="neu-title" style={{ fontSize: '16px', marginBottom: '6px' }}>No users found</h3>
                <p className="neu-subtitle">Try adjusting your filters or search keywords.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--neu-glass-border)' }}>
                    <th className="neu-subtitle" style={{ padding: '16px 12px' }}>USER IDENTITY</th>
                    <th className="neu-subtitle" style={{ padding: '16px 12px' }}>DEPARTMENT / TEAM</th>
                    <th className="neu-subtitle" style={{ padding: '16px 12px' }}>ROLE ASSIGNMENT</th>
                    <th className="neu-subtitle" style={{ padding: '16px 12px' }}>STATUS</th>
                    <th className="neu-subtitle" style={{ padding: '16px 12px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map(user => {
                    const isSelf = user.username === currentUser;
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--neu-glass-border)', transition: 'background 0.2s' }}>
                        
                        {/* User Identity */}
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div className="neu-avatar neu-avatar-sm" style={{ fontWeight: 'bold' }}>
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="neu-title" style={{ fontSize: '14px' }}>{user.username}</span>
                                {isSelf && (
                                  <span style={{ fontSize: '10px', background: 'var(--neu-accent)', color: '#fff', padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="neu-subtitle" style={{ fontSize: '12px', marginTop: '2px' }}>
                                {user.email || `${user.username.toLowerCase()}@nexus.workspace`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department / Project */}
                        <td style={{ padding: '16px 12px' }}>
                          <span className="neu-panel-inset" style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', color: 'var(--neu-text)' }}>
                            {user.department || 'General Workspace'}
                          </span>
                        </td>

                        {/* Inline Role Escalation / Demotion */}
                        <td style={{ padding: '16px 12px' }}>
                          {isManagerOrAdmin ? (
                            <select
                              className="neu-input"
                              style={{
                                width: '170px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                opacity: isSelf ? 0.7 : 1
                              }}
                              value={user.role}
                              disabled={isSelf}
                              title={isSelf ? "You cannot modify your own role" : "Escalate or demote user permissions"}
                              onChange={(e) => handleRoleChange(user.id, user.username, e.target.value)}
                            >
                              {ROLES.map(r => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="badge-role">{user.role}</span>
                          )}
                        </td>

                        {/* Status Pill */}
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span className={`neu-status-dot ${user.status === 'ACTIVE' ? 'online' : ''}`} style={{
                              backgroundColor:
                                user.status === 'ACTIVE' ? 'var(--neu-success)' :
                                user.status === 'INVITED' ? '#f59e0b' : 'var(--neu-danger)',
                              boxShadow: user.status === 'ACTIVE' ? '0 0 6px var(--neu-success)' : 'none'
                            }} />
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              letterSpacing: '0.5px',
                              color:
                                user.status === 'ACTIVE' ? 'var(--neu-success)' :
                                user.status === 'INVITED' ? '#f59e0b' : 'var(--neu-danger)'
                            }}>
                              {user.status}
                            </span>
                          </div>
                        </td>

                        {/* Action Column: Update / Suspend / Delete */}
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>

                            {/* Update User */}
                            <button
                              className="neu-btn neu-btn-icon"
                              style={{ width: '32px', height: '32px', fontSize: '13px', opacity: (!isManagerOrAdmin || isSelf) ? 0.45 : 1 }}
                              disabled={!isManagerOrAdmin || isSelf}
                              onClick={() => setEditUser({ id: user.id, username: user.username, email: user.email || '', department: user.department || 'Engineering', role: user.role })}
                              title={isSelf ? 'You cannot edit your own account here' : (!isManagerOrAdmin ? 'Requires ADMIN or PROJECT_MANAGER' : 'Update user')}
                            >
                              ✏️
                            </button>

                            {/* Suspend / Activate Toggle */}
                            <button
                              className="neu-btn neu-btn-icon"
                              style={{ width: '32px', height: '32px', fontSize: '13px', opacity: (!isManagerOrAdmin || isSelf) ? 0.45 : 1 }}
                              disabled={!isManagerOrAdmin || isSelf}
                              onClick={() => setConfirmState({ type: 'status', user })}
                              title={isSelf ? 'You cannot suspend your own account' : (!isManagerOrAdmin ? 'Requires ADMIN or PROJECT_MANAGER' : (user.status === 'ACTIVE' ? 'Suspend user' : 'Activate user'))}
                            >
                              {user.status === 'ACTIVE' ? '⏸️' : '▶️'}
                            </button>

                            {/* Delete / Revoke Action (Only ADMIN) */}
                            <button
                              className="neu-btn neu-btn-icon neu-btn-danger"
                              style={{ width: '32px', height: '32px', fontSize: '12px', opacity: (!isAdmin || isSelf) ? 0.45 : 1 }}
                              disabled={!isAdmin || isSelf}
                              onClick={() => setConfirmState({ type: 'delete', user })}
                              title={isSelf ? 'You cannot delete your own account' : (!isAdmin ? 'Requires ADMIN role' : 'Delete user')}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>


                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}


      {/* Pagination Footer: 10 users per page */}
      {filteredUsers.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--neu-muted)' }}>
            Showing {pageFrom}–{pageTo} of {filteredUsers.length} users
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              className="neu-btn neu-btn-pill"
              style={{ padding: '6px 14px', fontSize: '12px', opacity: safePage === 1 ? 0.45 : 1 }}
              disabled={safePage === 1}
              onClick={() => setCurrentPage(safePage - 1)}
            >
              ‹ Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => (i > 0 && p - arr[i - 1] > 1 ? [...acc, '…', p] : [...acc, p]), [])
              .map((p, i) => p === '…' ? (
                <span key={`gap-${i}`} style={{ fontSize: '12px', color: 'var(--neu-muted)', padding: '0 4px' }}>…</span>
              ) : (
                <button
                  key={p}
                  className={`neu-btn neu-btn-pill ${p === safePage ? 'neu-btn-primary' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12px', minWidth: '34px' }}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              className="neu-btn neu-btn-pill"
              style={{ padding: '6px 14px', fontSize: '12px', opacity: safePage === totalPages ? 0.45 : 1 }}
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* UPDATE USER MODAL */}
      {editUser && (
        <div
          onClick={() => setEditUser(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{ width: '460px', maxWidth: '92vw', padding: '32px', borderRadius: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="neu-title" style={{ fontSize: '20px' }}>Update user</h2>
                <p className="neu-subtitle">@{editUser.username}</p>
              </div>
              <button className="neu-btn neu-btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => setEditUser(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>EMAIL</label>
                <input
                  type="email"
                  className="neu-input"
                  placeholder="user@workspace.com"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DEPARTMENT</label>
                <select
                  className="neu-input"
                  value={editUser.department}
                  onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>ROLE</label>
                <select
                  className="neu-input"
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="neu-btn neu-btn-pill" style={{ flex: 1, padding: '12px' }} onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="neu-btn neu-btn-pill neu-btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: PERMISSIONS MATRIX (Requirement 11) */}
      {viewMode === 'PERMISSIONS' && (
        <div className="neu-panel" style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <h2 className="neu-title" style={{ fontSize: '20px' }}>Workspace Access & RBAC Permissions Matrix</h2>
                <p className="neu-subtitle">Defines functional and administrative boundaries enforced across frontend routes, REST APIs, and database transactions.</p>
              </div>
              <span className="badge-tag" style={{ background: 'rgba(79, 70, 229, 0.15)', color: 'var(--neu-accent)', fontWeight: 'bold' }}>
                🔒 Zero-Trust API Enforced
              </span>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--neu-glass-border)' }}>
                  <th className="neu-subtitle" style={{ padding: '14px', width: '220px' }}>FUNCTIONAL DOMAIN</th>
                  {ROLES.map(r => (
                    <th key={r.value} className="neu-subtitle" style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--neu-text)', fontSize: '13px' }}>{r.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--neu-accent)', marginTop: '2px' }}>
                        {ROLE_PERMISSIONS[r.value]?.badge}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_COLUMNS.map(col => (
                  <tr key={col.key} style={{ borderBottom: '1px solid var(--neu-glass-border)' }}>
                    <td style={{ padding: '14px', fontWeight: '600', fontSize: '13px', color: 'var(--neu-text)' }}>
                      {col.label}
                    </td>
                    {ROLES.map(r => {
                      const val = ROLE_PERMISSIONS[r.value]?.permissions[col.key];
                      const isAllowed = val === true || val === 'Allowed' || val === 'Full Access' || val === 'All Projects' || val === 'All Tasks' || val?.includes('Full');
                      const isRestricted = val === false || val === 'Restricted' || val === 'No Access' || val === 'NONE';
                      
                      return (
                        <td key={r.value} style={{ padding: '14px', textAlign: 'center', fontSize: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '11px',
                            background: isAllowed ? 'rgba(34, 197, 94, 0.12)' : isRestricted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isAllowed ? 'var(--neu-success)' : isRestricted ? 'var(--neu-danger)' : '#d97706'
                          }}>
                            {typeof val === 'boolean' ? (val ? '✓ Allowed' : '✕ Restricted') : val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Role Profiles Breakdown Cards */}
          <div style={{ marginTop: '16px' }}>
            <h3 className="neu-title" style={{ fontSize: '16px', marginBottom: '14px' }}>Role Specifications & Responsibilities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {ROLES.map(r => {
                const spec = ROLE_PERMISSIONS[r.value];
                return (
                  <div key={r.value} className="neu-panel-inset" style={{ padding: '16px', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-text)' }}>{r.label}</span>
                      <span className="badge-role" style={{ fontSize: '10px' }}>{spec?.badge}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--neu-muted)', lineHeight: '1.4' }}>
                      {spec?.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Slide-Over Drawer Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            transition: 'opacity 0.3s ease'
          }}
        >
          {/* Slide-Over Drawer Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{
              width: '460px',
              height: '100%',
              borderRadius: '24px 0 0 24px',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.15)',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div>
                <h2 className="neu-title" style={{ fontSize: '22px', marginBottom: '4px' }}>Invite New Member</h2>
                <p className="neu-subtitle">Provision access, assign roles, and dispatch credentials.</p>
              </div>
              <button
                className="neu-btn neu-btn-icon"
                style={{ width: '36px', height: '36px' }}
                onClick={() => setIsDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* If Invitation Succeeded: Display Credentials Card */}
            {inviteResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="neu-panel-inset" style={{ padding: '24px', borderRadius: '16px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                    <h3 className="neu-title" style={{ fontSize: '18px', color: 'var(--neu-success)' }}>
                      Invitation Dispatched!
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                      Account for <strong>@{inviteResult.username}</strong> has been provisioned as <strong>{inviteResult.role}</strong>.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="neu-subtitle">USERNAME:</span>
                      <strong style={{ color: 'var(--neu-text)' }}>{inviteResult.username}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="neu-subtitle">EMAIL:</span>
                      <strong style={{ color: 'var(--neu-text)' }}>{inviteResult.email || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="neu-subtitle">TEMP PASSWORD:</span>
                      <code style={{
                        background: 'var(--neu-bg)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        boxShadow: 'var(--neu-shadow-raised)',
                        color: 'var(--neu-accent)',
                        fontWeight: 'bold'
                      }}>
                        {inviteResult.temporaryPassword}
                      </code>
                    </div>
                  </div>
                </div>

                <button
                  className="neu-btn neu-btn-pill neu-btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                  onClick={() => setInviteResult(null)}
                >
                  + Invite Another User
                </button>
              </div>
            ) : (
              /* Invitation Form */
              <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                
                {/* Username */}
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                    USERNAME <span style={{ color: 'var(--neu-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="neu-input"
                    placeholder="e.g. jdoe"
                    value={inviteForm.username}
                    onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                    WORK EMAIL <span style={{ color: 'var(--neu-danger)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="neu-input"
                    placeholder="jdoe@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                    INITIAL ROLE
                  </label>
                  <select
                    className="neu-input"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    style={{ cursor: 'pointer' }}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>
                        {r.label} — {r.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department / Team */}
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                    DEPARTMENT / PROJECT
                  </label>
                  <select
                    className="neu-input"
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    style={{ cursor: 'pointer' }}
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Credentials Generation Option */}
                <div className="neu-panel-inset" style={{ padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--neu-text)' }}>
                      Auto-generate Secure Temporary Password
                    </span>
                    <input
                      type="checkbox"
                      checked={inviteForm.autoPassword}
                      onChange={(e) => setInviteForm({ ...inviteForm, autoPassword: e.target.checked })}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </div>

                  {!inviteForm.autoPassword && (
                    <input
                      type="password"
                      className="neu-input"
                      placeholder="Specify custom temporary password"
                      value={inviteForm.customPassword}
                      onChange={(e) => setInviteForm({ ...inviteForm, customPassword: e.target.value })}
                      required={!inviteForm.autoPassword}
                      style={{ marginTop: '8px' }}
                    />
                  )}
                </div>

                {/* Submit Action */}
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                  <button
                    type="submit"
                    className="neu-btn neu-btn-pill neu-btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '14px' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Dispatching Invitation...' : 'Send Workspace Invitation'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* SUSPEND / DELETE CONFIRMATION */}
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.type === 'status'
          ? (confirmState?.user?.status === 'ACTIVE' ? 'Suspend account' : 'Reactivate account')
          : 'Remove user'}
        message={confirmState?.type === 'status'
          ? (confirmState?.user?.status === 'ACTIVE'
            ? `Suspend @${confirmState?.user?.username}? They will lose workspace access immediately.`
            : `Reactivate account for @${confirmState?.user?.username}?`)
          : `Permanently remove user @${confirmState?.user?.username}? This cannot be undone.`}
        confirmLabel={confirmState?.type === 'status'
          ? (confirmState?.user?.status === 'ACTIVE' ? 'Suspend' : 'Reactivate')
          : 'Remove'}
        onConfirm={() => { confirmState?.type === 'status' ? handleToggleStatus() : handleDeleteUser(); }}
        onCancel={() => setConfirmState(null)}
      />

    </div>
  );
}

export default UserManagement;