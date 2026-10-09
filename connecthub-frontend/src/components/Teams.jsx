import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Teams() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('SQUADS'); // 'SQUADS' | 'BALANCER'
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Rebalancer modal state
  const [rebalanceTask, setRebalanceTask] = useState(null);
  const [targetAssignee, setTargetAssignee] = useState('');
  const [feedback, setFeedback] = useState('');

  // Initial teams definition with team-specific projects, chat channels, and permissions
  const [teams, setTeams] = useState([
    {
      id: 1,
      name: 'Platform Engineering',
      department: 'Engineering',
      leadUsername: 'Vansh',
      description: 'Core backend microservices, real-time WebSockets, database optimization, and cloud architecture.',
      chatChannel: 'engineering',
      projects: ['ConnectHub Web Platform', 'Enterprise Security & Audit'],
      permissions: ['Admin', 'Repo Write', 'Deploy Staging', 'Audit View']
    },
    {
      id: 2,
      name: 'Product & Design',
      department: 'Product',
      leadUsername: 'Khushi',
      description: 'UX wireframing, Neumorphic SaaS design system, user research, and sprint prioritization.',
      chatChannel: 'product-design',
      projects: ['Mobile Client v2', 'Design System & Accessibility'],
      permissions: ['Task Create', 'Backlog Prioritize', 'Chat Admin']
    },
    {
      id: 3,
      name: 'Security & Infrastructure',
      department: 'DevOps',
      leadUsername: 'Alex',
      description: 'Zero-trust RBAC access controls, JWT session hardening, CI/CD pipeline integrity, and compliance.',
      chatChannel: 'security',
      projects: ['Enterprise Security & Audit'],
      permissions: ['Security Enforce', 'Audit Admin', 'Infra Read']
    },
    {
      id: 4,
      name: 'Quality Assurance & Release',
      department: 'QA',
      leadUsername: 'alex_dev',
      description: 'Automated end-to-end testing, load simulation, cross-browser compatibility, and release sign-offs.',
      chatChannel: 'qa-releases',
      projects: ['ConnectHub Web Platform'],
      permissions: ['Issue Close', 'Regression Run', 'Release Gate']
    }
  ]);

  const [newTeam, setNewTeam] = useState({
    name: '',
    department: 'Engineering',
    leadUsername: '',
    description: '',
    chatChannel: ''
  });

  const token = localStorage.getItem('token');
  const currentRole = (localStorage.getItem('role') || 'MEMBER').toUpperCase();
  const isAdminOrLead = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(currentRole);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, tasksRes] = await Promise.all([
        axios.get('/api/users/directory', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/tasks/all', { headers }).catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Failed to load team data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Compute live team workload and member counts
  const getTeamStats = (team) => {
    const members = users.filter(u => 
      (u.department && u.department.toLowerCase() === team.department.toLowerCase()) ||
      u.username.toLowerCase() === team.leadUsername.toLowerCase()
    );

    const memberNames = members.map(m => m.username.toLowerCase());
    const teamTasks = tasks.filter(t => 
      (t.assignedUser && memberNames.includes(t.assignedUser.username.toLowerCase())) ||
      (team.projects && team.projects.includes(t.project))
    );

    const activeTasks = teamTasks.filter(t => t.status !== 'DONE').length;
    const completedTasks = teamTasks.filter(t => t.status === 'DONE').length;
    const blockedTasks = teamTasks.filter(t => t.status === 'BLOCKED' || t.isBlocked).length;

    return {
      members,
      memberCount: members.length || 1,
      teamTasks,
      activeTasks,
      completedTasks,
      blockedTasks
    };
  };

  // Compute Member Capacity and Heatmap Data
  const MAX_CAPACITY_POINTS = 15;

  const workloadMembers = users.map(user => {
    const assignedTasks = tasks.filter(t => t.assignedUser && t.assignedUser.username.toLowerCase() === user.username.toLowerCase() && t.status !== 'DONE');
    const allocatedPoints = assignedTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    const capacityPercent = Math.min(100, Math.round((allocatedPoints / MAX_CAPACITY_POINTS) * 100));

    let heatmapStatus = 'BALANCED';
    if (allocatedPoints > 12) {
      heatmapStatus = 'OVERBURDENED';
    } else if (allocatedPoints < 5) {
      heatmapStatus = 'UNDERALLOCATED';
    }

    return {
      user,
      assignedTasks,
      allocatedPoints,
      capacityPercent,
      heatmapStatus
    };
  }).sort((a, b) => b.allocatedPoints - a.allocatedPoints);

  const handleExecuteRebalance = async (e) => {
    e.preventDefault();
    if (!rebalanceTask || !targetAssignee) return;

    try {
      await axios.put(
        `/api/tasks/${rebalanceTask.id}`,
        { assignedUsername: targetAssignee },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTasks(prev => prev.map(t => t.id === rebalanceTask.id ? {
        ...t,
        assignedUser: { ...t.assignedUser, username: targetAssignee }
      } : t));

      setFeedback(`Task TSK-${rebalanceTask.id} rebalanced to @${targetAssignee}`);
      setTimeout(() => setFeedback(''), 4000);
      setRebalanceTask(null);
      setTargetAssignee('');
    } catch {
      alert('Failed to rebalance task allocation');
    }
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!newTeam.name) return;
    const created = {
      id: Date.now(),
      name: newTeam.name,
      department: newTeam.department || 'General',
      leadUsername: newTeam.leadUsername || (users[0]?.username || 'Vansh'),
      description: newTeam.description || 'Collaborative team unit',
      chatChannel: newTeam.chatChannel ? newTeam.chatChannel.toLowerCase().replace(/\s+/g, '-') : 'general',
      projects: ['General Workspace'],
      permissions: ['Task Manage', 'Chat Write']
    };
    setTeams(prev => [...prev, created]);
    setIsCreateModalOpen(false);
    setNewTeam({ name: '', department: 'Engineering', leadUsername: '', description: '', chatChannel: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '24px' }}>
      
      {/* Toast Feedback */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '32px',
          zIndex: 100,
          padding: '12px 24px',
          borderRadius: '16px',
          background: 'var(--neu-bg)',
          boxShadow: 'var(--neu-shadow-raised)',
          borderLeft: '4px solid var(--neu-success)',
          color: 'var(--neu-success)',
          fontWeight: '600',
          fontSize: '13px'
        }}>
          {feedback}
        </div>
      )}

      {/* Top Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="neu-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Teams & Workload Balancer</h1>
          <p className="neu-subtitle">Functional squads, live capacity heatmaps, workload balancing, and linked chat channels.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Segmented View: Squads vs Workload Balancer */}
          <div className="neu-panel-inset" style={{ display: 'flex', padding: '4px', borderRadius: '24px' }}>
            <button
              className={`neu-btn neu-btn-pill ${activeTab === 'SQUADS' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '6px 16px', fontSize: '12px', border: 'none', boxShadow: activeTab === 'SQUADS' ? undefined : 'none' }}
              onClick={() => setActiveTab('SQUADS')}
            >
              👥 Squads & Leads
            </button>
            <button
              className={`neu-btn neu-btn-pill ${activeTab === 'BALANCER' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '6px 16px', fontSize: '12px', border: 'none', boxShadow: activeTab === 'BALANCER' ? undefined : 'none' }}
              onClick={() => setActiveTab('BALANCER')}
            >
              ⚖️ Workload Balancer & Heatmap
            </button>
          </div>

          {isAdminOrLead && (
            <button
              className="neu-btn neu-btn-pill neu-btn-primary"
              style={{ padding: '10px 20px', fontSize: '13px' }}
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create Team
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: SQUADS & LEADS VIEW                                               */}
      {/* ========================================================================= */}
      {activeTab === 'SQUADS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '22px' }}>
          {teams.map(team => {
            const stats = getTeamStats(team);
            return (
              <div
                key={team.id}
                className="saas-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        color: 'var(--neu-accent)',
                        letterSpacing: '0.8px',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        {team.department}
                      </span>
                      <h2 className="neu-title" style={{ fontSize: '19px' }}>{team.name}</h2>
                    </div>

                    <span className="badge-status status-in_progress" style={{ fontSize: '11px' }}>
                      {stats.memberCount} {stats.memberCount === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--neu-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                    {team.description}
                  </p>

                  {/* Team Lead Capsule */}
                  <div className="neu-panel-inset" style={{ padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="neu-avatar neu-avatar-sm" style={{ fontWeight: 'bold' }}>
                        {team.leadUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--neu-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Lead</div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>@{team.leadUsername}</div>
                      </div>
                    </div>

                    <button
                      className="neu-btn neu-btn-pill"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => navigate('/chat')}
                      title="Direct Message in Chat"
                    >
                      💬 Message
                    </button>
                  </div>

                  {/* Team Workload Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div className="neu-panel-inset" style={{ padding: '10px', textAlign: 'center', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--neu-muted)' }}>ACTIVE</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--neu-accent)', marginTop: '2px' }}>
                        {stats.activeTasks}
                      </div>
                    </div>

                    <div className="neu-panel-inset" style={{ padding: '10px', textAlign: 'center', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--neu-muted)' }}>CLOSED</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--neu-success)', marginTop: '2px' }}>
                        {stats.completedTasks}
                      </div>
                    </div>

                    <div className="neu-panel-inset" style={{ padding: '10px', textAlign: 'center', borderRadius: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--neu-muted)' }}>BLOCKERS</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: stats.blockedTasks > 0 ? 'var(--neu-danger)' : 'var(--neu-muted)', marginTop: '2px' }}>
                        {stats.blockedTasks}
                      </div>
                    </div>
                  </div>

                  {/* Linked Chat Channel */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--neu-accent)', fontWeight: 'bold' }}>#</span>
                      <span style={{ fontWeight: '600', color: 'var(--neu-text)' }}>{team.chatChannel}</span>
                    </div>
                    <button
                      className="neu-btn neu-btn-pill"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => navigate('/chat')}
                    >
                      Open Channel ↗
                    </button>
                  </div>

                  {/* Team-Specific Projects */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--neu-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      Linked Initiatives
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {team.projects.map((proj, pIdx) => (
                        <span key={pIdx} className="badge-tag" style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                          📦 {proj}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Permissions Badges */}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--neu-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      Team Permissions
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {team.permissions.map((perm, permIdx) => (
                        <span
                          key={permIdx}
                          style={{
                            fontSize: '10px',
                            background: 'rgba(148, 163, 184, 0.15)',
                            color: 'var(--neu-muted)',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontWeight: '600'
                          }}
                        >
                          🔒 {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Footer Actions */}
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(15,23,42,0.12)', paddingTop: '16px' }}>
                  <button
                    className="neu-btn neu-btn-pill"
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    onClick={() => setSelectedTeam(team)}
                  >
                    View Roster ({stats.memberCount})
                  </button>
                  <button
                    className="neu-btn neu-btn-pill neu-btn-primary"
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    onClick={() => navigate('/tasks')}
                  >
                    Team Board →
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: TEAM WORKLOAD BALANCER & CAPACITY HEATMAP (Phase 3 Core Feature)  */}
      {/* ========================================================================= */}
      {activeTab === 'BALANCER' && (
        <div className="neu-panel" style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Workload Balancer Intro Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="neu-title" style={{ fontSize: '20px' }}>Team Capacity & Workload Heatmap</h2>
              <p className="neu-subtitle">Sprint story point distribution across squad contributors. Rebalance tasks to prevent bottleneck burnout.</p>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '14px', fontSize: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--neu-success)' }} />
                <span>Balanced (&lt;12 pts)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span>Available (&lt;5 pts)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--neu-danger)' }} />
                <span>Overburdened (&gt;12 pts)</span>
              </div>
            </div>
          </div>

          {/* Members Capacity Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {workloadMembers.map(item => {
              const { user, assignedTasks, allocatedPoints, capacityPercent, heatmapStatus } = item;
              
              const statusColor = heatmapStatus === 'OVERBURDENED' ? 'var(--neu-danger)' : heatmapStatus === 'UNDERALLOCATED' ? '#f59e0b' : 'var(--neu-success)';
              const statusText = heatmapStatus === 'OVERBURDENED' ? 'Overburdened' : heatmapStatus === 'UNDERALLOCATED' ? 'Available Bandwidth' : 'Optimal Load';

              return (
                <div
                  key={user.id}
                  className="saas-card"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderTop: `4px solid ${statusColor}`
                  }}
                >
                  <div>
                    {/* User Capsule */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="neu-avatar neu-avatar-sm" style={{ fontWeight: 'bold' }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-text)' }}>@{user.username}</div>
                          <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>{user.role} • {user.department || 'Engineering'}</div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '3px 9px',
                        borderRadius: '10px',
                        background: heatmapStatus === 'OVERBURDENED' ? 'rgba(239, 68, 68, 0.15)' : heatmapStatus === 'UNDERALLOCATED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: statusColor
                      }}>
                        {statusText}
                      </span>
                    </div>

                    {/* Capacity Indicator Meter */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                        <span className="neu-subtitle">CAPACITY LOAD</span>
                        <span style={{ color: statusColor }}>{allocatedPoints} / {MAX_CAPACITY_POINTS} pts ({capacityPercent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(148, 163, 184, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${capacityPercent}%`, height: '100%', background: statusColor, borderRadius: '6px' }} />
                      </div>
                    </div>

                    {/* Assigned Tasks Summary */}
                    <div>
                      <div className="neu-subtitle" style={{ fontSize: '10px', marginBottom: '8px' }}>
                        ASSIGNED DELIVERABLES ({assignedTasks.length})
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {assignedTasks.slice(0, 3).map(task => (
                          <div
                            key={task.id}
                            className="neu-panel-inset"
                            style={{ padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}
                          >
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--neu-accent)', marginRight: '6px' }}>TSK-{task.id}</span>
                              <span style={{ color: 'var(--neu-text)' }}>{task.title}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>{task.storyPoints || 1} pts</span>
                              {isAdminOrLead && (
                                <button
                                  className="neu-btn neu-btn-pill"
                                  style={{ padding: '2px 8px', fontSize: '10px' }}
                                  onClick={() => setRebalanceTask(task)}
                                  title="Reassign to another squad member"
                                >
                                  Reassign ⇄
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {assignedTasks.length > 3 && (
                          <div style={{ fontSize: '11px', color: 'var(--neu-muted)', textAlign: 'center', marginTop: '2px' }}>
                            + {assignedTasks.length - 3} more deliverables
                          </div>
                        )}

                        {assignedTasks.length === 0 && (
                          <div style={{ fontSize: '12px', color: 'var(--neu-muted)', padding: '12px', textAlign: 'center' }}>
                            No open deliverables in progress.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Quick Action */}
                  <div style={{ borderTop: '1px solid rgba(15,23,42,0.12)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="neu-btn neu-btn-pill"
                      style={{ fontSize: '11px', padding: '6px 14px' }}
                      onClick={() => navigate('/tasks')}
                    >
                      View on Board →
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Rebalance Modal */}
      {rebalanceTask && (
        <div
          onClick={() => setRebalanceTask(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{ width: '480px', padding: '32px', borderRadius: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="neu-title" style={{ fontSize: '20px' }}>Rebalance Task Allocation</h2>
                <p className="neu-subtitle">Shift deliverable to balance squad workload</p>
              </div>
              <button className="neu-btn neu-btn-icon" onClick={() => setRebalanceTask(null)}>✕</button>
            </div>

            <form onSubmit={handleExecuteRebalance} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--neu-accent)', fontWeight: 'bold' }}>TSK-{rebalanceTask.id} • {rebalanceTask.storyPoints || 1} pts</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-text)', marginTop: '4px' }}>{rebalanceTask.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                  Currently Assigned: @{rebalanceTask.assignedUser?.username || 'Unassigned'}
                </div>
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                  SELECT TARGET SQUAD CONTRIBUTOR
                </label>
                <select
                  className="neu-input"
                  value={targetAssignee}
                  onChange={(e) => setTargetAssignee(e.target.value)}
                  required
                >
                  <option value="">-- Choose member to reassign to --</option>
                  {workloadMembers.map(({ user, allocatedPoints, heatmapStatus }) => (
                    <option key={user.id} value={user.username}>
                      @{user.username} ({allocatedPoints} pts allocated) — {heatmapStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="neu-btn neu-btn-pill" style={{ flex: 1, padding: '12px' }} onClick={() => setRebalanceTask(null)}>
                  Cancel
                </button>
                <button type="submit" className="neu-btn neu-btn-pill neu-btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Rebalance Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Roster Inspector Modal */}
      {selectedTeam && (
        <div
          onClick={() => setSelectedTeam(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{ width: '520px', maxHeight: '80vh', overflowY: 'auto', padding: '32px', borderRadius: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="neu-title" style={{ fontSize: '20px' }}>{selectedTeam.name} Roster</h2>
                <p className="neu-subtitle">Members assigned to {selectedTeam.department}</p>
              </div>
              <button className="neu-btn neu-btn-icon" onClick={() => setSelectedTeam(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getTeamStats(selectedTeam).members.map(member => (
                <div
                  key={member.id}
                  className="saas-card"
                  style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="neu-avatar neu-avatar-sm" style={{ fontWeight: 'bold' }}>
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-text)' }}>
                        @{member.username} {member.username.toLowerCase() === selectedTeam.leadUsername.toLowerCase() && '👑'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--neu-muted)', marginTop: '2px' }}>
                        {member.email || 'No email registered'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-role">
                      {member.role}
                    </span>
                    <button
                      className="neu-btn neu-btn-pill"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => {
                        setSelectedTeam(null);
                        navigate('/chat');
                      }}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="neu-btn neu-btn-pill" onClick={() => setSelectedTeam(null)} style={{ padding: '8px 20px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div
          onClick={() => setIsCreateModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{ width: '480px', padding: '32px', borderRadius: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="neu-title" style={{ fontSize: '20px' }}>Create New Team</h2>
              <button className="neu-btn neu-btn-icon" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>TEAM NAME</label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="e.g. Data & Analytics"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DEPARTMENT</label>
                <select
                  className="neu-input"
                  value={newTeam.department}
                  onChange={(e) => setNewTeam({ ...newTeam, department: e.target.value })}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Design">Design</option>
                  <option value="QA">QA</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>TEAM LEAD (USERNAME)</label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="e.g. alex_dev"
                  value={newTeam.leadUsername}
                  onChange={(e) => setNewTeam({ ...newTeam, leadUsername: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>TEAM CHAT CHANNEL</label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="e.g. data-insights"
                  value={newTeam.chatChannel}
                  onChange={(e) => setNewTeam({ ...newTeam, chatChannel: e.target.value })}
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea
                  className="neu-input"
                  rows="3"
                  placeholder="Core focus, responsibilities, and deliverables..."
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="neu-btn neu-btn-pill" style={{ flex: 1, padding: '12px' }} onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="neu-btn neu-btn-pill neu-btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Teams;
