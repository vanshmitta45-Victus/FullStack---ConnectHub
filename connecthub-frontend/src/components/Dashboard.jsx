import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username') || 'User';
  const currentRole = (localStorage.getItem('role') || 'MEMBER').toUpperCase();
  const isManagerOrAdmin = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(currentRole);

  // Role-tailored view mode: defaults to ADMIN for leadership, MEMBER for individual contributors
  const [dashboardMode, setDashboardMode] = useState(() => {
    return isManagerOrAdmin ? 'ADMIN' : 'MEMBER';
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [tasksRes, usersRes, auditRes] = await Promise.all([
          axios.get('http://localhost:8080/api/tasks/all', { headers }).catch(() => ({ data: [] })),
          axios.get('http://localhost:8080/api/users/directory', { headers }).catch(() => ({ data: [] })),
          axios.get('http://localhost:8080/api/audit/all', { headers }).catch(() => ({ data: [] }))
        ]);
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
        setAuditLogs(auditRes.data.reverse().slice(0, 10)); // Top 10 recent
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Derived Member Metrics
  const myTasks = tasks.filter(t => t.assignedUser && t.assignedUser.username.toLowerCase() === currentUser.toLowerCase());
  const myOpenTasks = myTasks.filter(t => t.status !== 'DONE');
  const myCompletedTasks = myTasks.filter(t => t.status === 'DONE');
  const myBlockedTasks = myTasks.filter(t => t.status === 'BLOCKED' || t.isBlocked);
  
  // Items Due Soon (< 5 days)
  const myDueSoonTasks = myOpenTasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  // Story Points calculation
  const myCompletedPoints = myCompletedTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
  const myTotalPoints = myTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);

  // Derived Admin Metrics
  const allOpenTasks = tasks.filter(t => t.status !== 'DONE');
  const allBlockedTasks = tasks.filter(t => t.status === 'BLOCKED' || t.isBlocked);
  const allCompletedTasks = tasks.filter(t => t.status === 'DONE');
  const sprintDeliveryRate = tasks.length > 0 ? Math.round((allCompletedTasks.length / tasks.length) * 100) : 0;

  const activeUsersCount = users.filter(u => u.status === 'ACTIVE').length;
  const invitedUsersCount = users.filter(u => u.status === 'INVITED').length;
  const suspendedUsersCount = users.filter(u => u.status === 'SUSPENDED').length;

  // Member Workload Distribution
  const memberWorkload = users.map(u => {
    const assigned = tasks.filter(t => t.assignedUser && t.assignedUser.username.toLowerCase() === u.username.toLowerCase() && t.status !== 'DONE');
    const points = assigned.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    return {
      username: u.username,
      role: u.role,
      department: u.department,
      count: assigned.length,
      points
    };
  }).sort((a, b) => b.points - a.points);

  const handleQuickUpdateStatus = async (taskId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:8080/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Bar with Role Greeting & Segmented View Switcher */}
      <div className="neu-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="neu-title" style={{ fontSize: '26px' }}>Welcome back, {currentUser}</h1>
            <span style={{
              background: 'var(--neu-accent)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {currentRole}
            </span>
          </div>
          <p className="neu-subtitle" style={{ marginTop: '6px', fontSize: '13px' }}>
            {dashboardMode === 'MEMBER'
              ? 'Personal deliverables queue, items due soon, blockers, and recent discussions.'
              : 'Workspace health metrics, active user trends, system alerts, and project velocity.'}
          </p>
        </div>

        {/* View Mode Switcher: Member View vs Admin View */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="neu-panel-inset" style={{ display: 'flex', padding: '4px', borderRadius: '24px' }}>
            <button
              className={`neu-btn neu-btn-pill ${dashboardMode === 'MEMBER' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '7px 18px', fontSize: '12px', border: 'none', boxShadow: dashboardMode === 'MEMBER' ? undefined : 'none' }}
              onClick={() => setDashboardMode('MEMBER')}
            >
              👤 Member View
            </button>
            <button
              className={`neu-btn neu-btn-pill ${dashboardMode === 'ADMIN' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '7px 18px', fontSize: '12px', border: 'none', boxShadow: dashboardMode === 'ADMIN' ? undefined : 'none' }}
              onClick={() => setDashboardMode('ADMIN')}
            >
              🛡️ Admin & Leadership View
            </button>
          </div>

          <button
            className="neu-btn neu-btn-pill neu-btn-primary"
            style={{ padding: '10px 18px', gap: '6px', fontSize: '12px' }}
            onClick={() => navigate('/tasks')}
          >
            <span>+</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: MEMBER VIEW (High productivity individual contributor focus)     */}
      {/* ========================================================================= */}
      {dashboardMode === 'MEMBER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Member KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">MY OPEN TASKS</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--neu-accent)', marginTop: '8px' }}>
                {myOpenTasks.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                {myCompletedTasks.length} closed this sprint
              </div>
            </div>

            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">DUE SOON (&lt; 7 DAYS)</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: myDueSoonTasks.length > 0 ? '#f59e0b' : 'var(--neu-success)', marginTop: '8px' }}>
                {myDueSoonTasks.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                Requires priority delivery
              </div>
            </div>

            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">MY OPEN BLOCKERS</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: myBlockedTasks.length > 0 ? 'var(--neu-danger)' : 'var(--neu-success)', marginTop: '8px' }}>
                {myBlockedTasks.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                {myBlockedTasks.length === 0 ? 'No blockers active' : 'Needs squad unblocking'}
              </div>
            </div>

            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">POINTS DELIVERED</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--neu-success)', marginTop: '8px' }}>
                {myCompletedPoints} <span style={{ fontSize: '16px', color: 'var(--neu-muted)', fontWeight: 'normal' }}>/ {myTotalPoints || 1} pts</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                {myTotalPoints > 0 ? Math.round((myCompletedPoints / myTotalPoints) * 100) : 100}% sprint velocity
              </div>
            </div>
          </div>

          {/* Member 2-Column Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
            
            {/* Left: My Assigned Tasks & Due Soon Queue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* My Assigned Work Queue */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>My Assigned Work</h2>
                    <p className="neu-subtitle">Active deliverables assigned to you</p>
                  </div>
                  <button
                    className="neu-btn neu-btn-pill"
                    style={{ fontSize: '11px', padding: '6px 14px' }}
                    onClick={() => navigate('/my-work')}
                  >
                    View My Work →
                  </button>
                </div>

                {myOpenTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--neu-muted)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>All caught up!</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>No active tasks assigned to your queue.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {myOpenTasks.map(task => (
                      <div
                        key={task.id}
                        className="saas-card"
                        style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>
                            TSK-{task.id}
                          </span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--neu-text)' }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--neu-muted)', marginTop: '4px', display: 'flex', gap: '10px' }}>
                              <span>📦 {task.project || 'General'}</span>
                              {task.dueDate && <span>📅 Due: {task.dueDate}</span>}
                              <span>⚡ {task.storyPoints || 1} pts</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <select
                            className="neu-input"
                            value={task.status}
                            onChange={(e) => handleQuickUpdateStatus(task.id, e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '11px', width: '120px', cursor: 'pointer' }}
                          >
                            <option value="BACKLOG">Backlog</option>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="DONE">Done</option>
                          </select>

                          <button
                            className="neu-btn neu-btn-pill"
                            style={{ padding: '6px 12px', fontSize: '11px' }}
                            onClick={() => navigate('/tasks')}
                          >
                            Board →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Due Soon */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>Upcoming Milestones & Deadlines</h2>
                    <p className="neu-subtitle">Deliverables scheduled for release this week</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {myDueSoonTasks.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--neu-muted)', padding: '16px', textAlign: 'center' }}>
                      No imminent deadlines within 7 days.
                    </div>
                  ) : (
                    myDueSoonTasks.map(t => (
                      <div key={t.id} className="neu-panel-inset" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>{t.title}</div>
                          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>⏰ Target Date: {t.dueDate}</div>
                        </div>
                        <span className={`badge-status status-${t.status.toLowerCase()}`}>{t.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right: Blockers & Team Discussions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* My Blockers Card */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>Active Blockers</h2>
                    <p className="neu-subtitle">Impediments requiring squad unblocking</p>
                  </div>
                  {myBlockedTasks.length > 0 && (
                    <span className="badge-status status-blocked" style={{ fontSize: '10px' }}>
                      {myBlockedTasks.length} BLOCKED
                    </span>
                  )}
                </div>

                {myBlockedTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--neu-muted)' }}>
                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🟢</span>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>No active blockers</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myBlockedTasks.map(b => (
                      <div key={b.id} className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px', borderLeft: '4px solid var(--neu-danger)' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-danger)' }}>{b.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neu-text)', marginTop: '4px' }}>
                          Reason: {b.blockedReason || 'Waiting on dependencies / specifications'}
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="neu-btn neu-btn-pill"
                            style={{ fontSize: '10px', padding: '4px 10px' }}
                            onClick={() => navigate('/chat')}
                          >
                            💬 Discuss in Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Team Channels */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>Team Communications</h2>
                    <p className="neu-subtitle">Quick jump to squad channels</p>
                  </div>
                  <button
                    className="neu-btn neu-btn-pill"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => navigate('/chat')}
                  >
                    Open Chat ↗
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: '#engineering', desc: 'Real-time WebSocket & microservice architecture' },
                    { name: '#product-design', desc: 'SaaS UX wireframing & component library' },
                    { name: '#security', desc: 'Zero-trust RBAC & audit trail compliance' }
                  ].map((ch, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate('/chat')}
                      className="saas-card"
                      style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>{ch.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>{ch.desc}</div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--neu-muted)' }}>↗</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ADMIN & LEADERSHIP VIEW (Operational health & system governance) */}
      {/* ========================================================================= */}
      {dashboardMode === 'ADMIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Executive Strategic KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
            
            {/* Workspace Health */}
            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">WORKSPACE HEALTH INDEX</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--neu-success)', marginTop: '8px' }}>
                99.98%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                API Latency: 18ms • DB Pool: Healthy
              </div>
            </div>

            {/* Active User Trends */}
            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">ACTIVE USER TRENDS</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--neu-text)', marginTop: '8px' }}>
                {activeUsersCount} <span style={{ fontSize: '16px', color: 'var(--neu-muted)', fontWeight: 'normal' }}>/ {users.length}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                {invitedUsersCount} invited • {suspendedUsersCount} suspended
              </div>
            </div>

            {/* Project Velocity */}
            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">SPRINT DELIVERY RATE</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--neu-accent)', marginTop: '8px' }}>
                {sprintDeliveryRate}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                {allCompletedTasks.length} of {tasks.length} deliverables closed
              </div>
            </div>

            {/* Critical Open Blockers */}
            <div className="saas-card" style={{ padding: '20px' }}>
              <div className="neu-subtitle">CRITICAL BLOCKERS</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: allBlockedTasks.length > 0 ? 'var(--neu-danger)' : 'var(--neu-success)', marginTop: '8px' }}>
                {allBlockedTasks.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                Requires management intervention
              </div>
            </div>

          </div>

          {/* Admin 2-Column Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
            
            {/* Left: System Alerts, Project Velocity & Initiatives */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Workspace Health & System Alerts */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>System Status & Governance Alerts</h2>
                    <p className="neu-subtitle">Real-time infrastructure health and compliance events</p>
                  </div>
                  <span className="badge-tag" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--neu-success)', fontWeight: 'bold' }}>
                    ● Systems Operational
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="neu-panel-inset" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>🗄️</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>PostgreSQL Database Engine</div>
                        <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>Active connection pool healthy • Zero lock contentions</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--neu-success)', fontWeight: 'bold' }}>OK (5432)</span>
                  </div>

                  <div className="neu-panel-inset" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>⚡</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>STOMP WebSocket Relay</div>
                        <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>Heartbeat interval: 10,000ms • Session tracking active</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--neu-success)', fontWeight: 'bold' }}>OK (8080)</span>
                  </div>

                  <div className="neu-panel-inset" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>🛡️</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>Zero-Trust RBAC & Permissions</div>
                        <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>Role-based API gatekeeper active on all mutation endpoints</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--neu-accent)', fontWeight: 'bold' }}>Enforced</span>
                  </div>
                </div>
              </div>

              {/* Active Projects Velocity */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>Project Velocity & Initiatives</h2>
                    <p className="neu-subtitle">Delivery progress across workspace roadmap</p>
                  </div>
                  <button
                    className="neu-btn neu-btn-pill"
                    style={{ fontSize: '11px', padding: '6px 14px' }}
                    onClick={() => navigate('/projects')}
                  >
                    All Projects →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { name: 'ConnectHub Web Platform', progress: 78, lead: 'Vansh', status: 'On Track', key: 'CHUB' },
                    { name: 'Mobile Client v2', progress: 45, lead: 'Khushi', status: 'In Review', key: 'MOB' },
                    { name: 'Enterprise Security & Audit', progress: 92, lead: 'Alex', status: 'On Track', key: 'SEC' },
                    { name: 'Design System & Accessibility', progress: 85, lead: 'Khushi', status: 'On Track', key: 'DS' }
                  ].map((proj, idx) => (
                    <div key={idx} className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>{proj.key}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--neu-text)' }}>{proj.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>{proj.progress}%</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '6px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${proj.progress}%`, height: '100%', background: 'var(--neu-accent)', borderRadius: '4px' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--neu-muted)', marginTop: '8px' }}>
                        <span>Lead: @{proj.lead}</span>
                        <span>Status: {proj.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Team Workload Balancer & Audit Trail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Team Workload Balancer */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>Team Workload Distribution</h2>
                    <p className="neu-subtitle">Open deliverables and point allocation</p>
                  </div>
                  <button
                    className="neu-btn neu-btn-pill"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => navigate('/teams')}
                  >
                    Balancer →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {memberWorkload.slice(0, 5).map(m => (
                    <div key={m.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="neu-avatar neu-avatar-sm" style={{ fontWeight: 'bold' }}>
                          {m.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--neu-text)' }}>@{m.username}</div>
                          <div style={{ fontSize: '10px', color: 'var(--neu-muted)' }}>{m.role} • {m.department || 'General'}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          background: m.points > 12 ? 'rgba(239, 68, 68, 0.15)' : 'var(--neu-bg)',
                          boxShadow: 'var(--neu-shadow-raised)',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: m.points > 12 ? 'var(--neu-danger)' : 'var(--neu-accent)'
                        }}>
                          {m.points} pts ({m.count} tasks)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Audit & Security Trail */}
              <div className="neu-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 className="neu-title" style={{ fontSize: '18px' }}>Compliance & Audit Trail</h2>
                    <p className="neu-subtitle">Immutable workspace event log</p>
                  </div>
                  <button
                    className="neu-btn neu-btn-pill"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => navigate('/audit')}
                  >
                    View All →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {auditLogs.slice(0, 6).map(log => (
                    <div key={log.id} style={{ fontSize: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                      <span style={{ fontSize: '14px' }}>⚡</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--neu-text)', lineHeight: '1.3' }}>{log.actionLog}</div>
                        <div style={{ fontSize: '10px', color: 'var(--neu-muted)', marginTop: '2px' }}>{log.timestamp}</div>
                      </div>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--neu-muted)', textAlign: 'center', padding: '16px' }}>
                      No recent audit events recorded.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Dashboard;
