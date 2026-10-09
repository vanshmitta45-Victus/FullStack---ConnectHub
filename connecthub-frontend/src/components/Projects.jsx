import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Projects() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState('DIRECTORY'); // 'DIRECTORY' | 'ROADMAP' | 'MILESTONES'
  const [selectedProject, setSelectedProject] = useState(null);
  const [drawerTab, setDrawerTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'MILESTONES' | 'ASSETS' | 'TASKS'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = localStorage.getItem('token');

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'ConnectHub Web Platform',
      key: 'CHUB',
      description: 'Core B2B SaaS collaboration platform, WebSocket real-time messaging pipeline, and task tracking.',
      lead: 'Vansh',
      leadRole: 'Principal Architect & Admin',
      status: 'ON_TRACK',
      progress: 78,
      members: ['Vansh', 'Khushi', 'Alex', 'demo_user'],
      dueDate: '2026-10-30',
      milestones: [
        { id: 'm1', title: 'M1: STOMP WebSocket Messaging Architecture', date: '2026-09-20', status: 'COMPLETED' },
        { id: 'm2', title: 'M2: Jira-Style Interactive 6-Stage Kanban Board', date: '2026-09-27', status: 'COMPLETED' },
        { id: 'm3', title: 'M3: Role-Personalized Dashboards & Heatmap', date: '2026-10-10', status: 'IN_PROGRESS' },
        { id: 'm4', title: 'M4: Production General Availability (GA)', date: '2026-10-30', status: 'PLANNED' }
      ],
      assets: [
        { title: 'Backend REST API & Swagger Specs', type: 'API Spec', url: '/api/tasks/all', icon: '⚡' },
        { title: 'Figma B2B SaaS Design System Tokens', type: 'Design', url: '#figma', icon: '🎨' },
        { title: 'PostgreSQL Schema & Migration Scripts', type: 'Database', url: '#schema', icon: '🗄️' },
        { title: 'GitHub Core Repository', type: 'Source Code', url: 'https://github.com', icon: '🐙' }
      ]
    },
    {
      id: 2,
      name: 'Mobile Client v2',
      key: 'MOB',
      description: 'Native mobile client with push notifications, offline local store, and background sync.',
      lead: 'Khushi',
      leadRole: 'Project Manager',
      status: 'IN_REVIEW',
      progress: 45,
      members: ['Khushi', 'Alex'],
      dueDate: '2026-11-15',
      milestones: [
        { id: 'm1', title: 'M1: Flutter & React Native Architecture POC', date: '2026-09-15', status: 'COMPLETED' },
        { id: 'm2', title: 'M2: Push Notifications & WebSocket Bridge', date: '2026-10-15', status: 'IN_PROGRESS' },
        { id: 'm3', title: 'M3: Offline SQLite Cache & Sync Interceptor', date: '2026-11-01', status: 'PLANNED' }
      ],
      assets: [
        { title: 'Mobile Wireframes & Flow Mockups', type: 'Design', url: '#figma-mobile', icon: '📱' },
        { title: 'Firebase Cloud Messaging Config', type: 'Cloud', url: '#fcm', icon: '🔥' }
      ]
    },
    {
      id: 3,
      name: 'Enterprise Security & Audit',
      key: 'SEC',
      description: 'Immutable compliance logging, zero-trust RBAC permission matrix, and JWT token hardening.',
      lead: 'Alex',
      leadRole: 'Security Lead',
      status: 'ON_TRACK',
      progress: 92,
      members: ['Vansh', 'Alex'],
      dueDate: '2026-10-15',
      milestones: [
        { id: 'm1', title: 'M1: JWT Filter & Session Validation', date: '2026-09-10', status: 'COMPLETED' },
        { id: 'm2', title: 'M2: Automated Audit Event Interceptor', date: '2026-09-25', status: 'COMPLETED' },
        { id: 'm3', title: 'M3: SOC2 Compliance Export Pipeline', date: '2026-10-15', status: 'IN_PROGRESS' }
      ],
      assets: [
        { title: 'RBAC Security Governance Spec', type: 'Document', url: '#sec-spec', icon: '🛡️' },
        { title: 'Audit Trail Export Engine', type: 'API', url: '/api/audit/all', icon: '📜' }
      ]
    },
    {
      id: 4,
      name: 'Design System & Accessibility',
      key: 'DS',
      description: 'Neumorphic SaaS component library, dark/light theme tokens, and WCAG screen reader testing.',
      lead: 'Khushi',
      leadRole: 'UI/UX Specialist',
      status: 'ON_TRACK',
      progress: 85,
      members: ['Khushi'],
      dueDate: '2026-10-20',
      milestones: [
        { id: 'm1', title: 'M1: Neumorphic Theme Tokens & CSS Variables', date: '2026-09-18', status: 'COMPLETED' },
        { id: 'm2', title: 'M2: Reusable UI Component Library', date: '2026-09-27', status: 'COMPLETED' },
        { id: 'm3', title: 'M3: Keyboard Navigation & Screen Reader Audit', date: '2026-10-20', status: 'IN_PROGRESS' }
      ],
      assets: [
        { title: 'CSS Component Guidelines', type: 'Styles', url: '#css', icon: '🎨' },
        { title: 'WCAG 2.1 AA Compliance Checklist', type: 'Audit', url: '#a11y', icon: '♿' }
      ]
    }
  ]);

  const [newProject, setNewProject] = useState({
    name: '',
    key: '',
    description: '',
    lead: 'Vansh',
    dueDate: ''
  });

  useEffect(() => {
    if (token) {
      axios.get('/api/tasks/all', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setTasks(res.data))
      .catch(() => {});
    }
  }, [token]);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProject.name || !newProject.key) return;

    const created = {
      id: Date.now(),
      name: newProject.name,
      key: newProject.key.toUpperCase(),
      description: newProject.description || 'Strategic initiative deliverable',
      lead: newProject.lead || 'Vansh',
      leadRole: 'Project Lead',
      status: 'ON_TRACK',
      progress: 10,
      members: [newProject.lead || 'Vansh'],
      dueDate: newProject.dueDate || '2026-11-30',
      milestones: [
        { id: 'm1', title: 'Kickoff & Requirements Discovery', date: '2026-10-01', status: 'COMPLETED' },
        { id: 'm2', title: 'Phase 1 MVP Release', date: newProject.dueDate || '2026-11-30', status: 'IN_PROGRESS' }
      ],
      assets: [
        { title: 'Project Brief & Scoping Document', type: 'Document', url: '#brief', icon: '📄' }
      ]
    };

    setProjects(prev => [created, ...prev]);
    setIsModalOpen(false);
    setNewProject({ name: '', key: '', description: '', lead: 'Vansh', dueDate: '' });
  };

  const getProjectTasks = (projectName) => {
    return tasks.filter(t => t.project && t.project.toLowerCase() === projectName.toLowerCase());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '24px' }}>
      
      {/* Header & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="neu-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Projects & Delivery</h1>
          <p className="neu-subtitle">Strategic initiatives, interactive roadmaps, milestones, and linked assets.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Mode Segmented Switch: Directory / Roadmap / Milestones */}
          <div className="neu-panel-inset" style={{ display: 'flex', padding: '4px', borderRadius: '24px' }}>
            <button
              className={`neu-btn neu-btn-pill ${activeView === 'DIRECTORY' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '6px 16px', fontSize: '12px', border: 'none', boxShadow: activeView === 'DIRECTORY' ? undefined : 'none' }}
              onClick={() => setActiveView('DIRECTORY')}
            >
              🗂️ Project Directory
            </button>
            <button
              className={`neu-btn neu-btn-pill ${activeView === 'ROADMAP' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '6px 16px', fontSize: '12px', border: 'none', boxShadow: activeView === 'ROADMAP' ? undefined : 'none' }}
              onClick={() => setActiveView('ROADMAP')}
            >
              🗺️ Roadmap View
            </button>
            <button
              className={`neu-btn neu-btn-pill ${activeView === 'MILESTONES' ? 'neu-btn-primary' : ''}`}
              style={{ padding: '6px 16px', fontSize: '12px', border: 'none', boxShadow: activeView === 'MILESTONES' ? undefined : 'none' }}
              onClick={() => setActiveView('MILESTONES')}
            >
              🏁 Milestones
            </button>
          </div>

          <button
            className="neu-btn neu-btn-pill neu-btn-primary"
            style={{ padding: '10px 20px', fontSize: '13px' }}
            onClick={() => setIsModalOpen(true)}
          >
            + Create Project
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PROJECT DIRECTORY (CARDS VIEW)                                    */}
      {/* ========================================================================= */}
      {activeView === 'DIRECTORY' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px', overflowY: 'auto', paddingBottom: '20px' }}>
          {projects.map(proj => {
            const pTasks = getProjectTasks(proj.name);
            return (
              <div
                key={proj.id}
                className="saas-card"
                onClick={() => {
                  setSelectedProject(proj);
                  setDrawerTab('OVERVIEW');
                }}
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-accent)', letterSpacing: '0.8px' }}>
                      {proj.key}
                    </span>
                    <span className={`badge-status status-${proj.status === 'ON_TRACK' ? 'done' : 'in_progress'}`}>
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="neu-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
                    {proj.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--neu-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                    {proj.description}
                  </p>
                </div>

                <div>
                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                      <span className="neu-subtitle">DELIVERY PROGRESS</span>
                      <span style={{ color: 'var(--neu-accent)' }}>{proj.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${proj.progress}%`, height: '100%', background: 'var(--neu-accent)', borderRadius: '6px' }} />
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(15,23,42,0.12)', paddingTop: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--neu-muted)', textTransform: 'uppercase' }}>LEAD</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--neu-text)' }}>@{proj.lead}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: 'var(--neu-muted)', textTransform: 'uppercase' }}>DELIVERABLES</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--neu-accent)' }}>
                        {pTasks.length} {pTasks.length === 1 ? 'task' : 'tasks'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ROADMAP & TIMELINE VIEW                                           */}
      {/* ========================================================================= */}
      {activeView === 'ROADMAP' && (
        <div className="neu-panel" style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <h2 className="neu-title" style={{ fontSize: '20px' }}>Initiative Roadmaps & Execution Schedule</h2>
              <p className="neu-subtitle">Timeline view of concurrent engineering and design deliveries</p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--neu-muted)' }}>Q3 - Q4 2026</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projects.map(proj => (
              <div
                key={proj.id}
                onClick={() => {
                  setSelectedProject(proj);
                  setDrawerTab('MILESTONES');
                }}
                className="saas-card"
                style={{ padding: '20px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>{proj.key}</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--neu-text)' }}>{proj.name}</span>
                    <span className={`badge-status status-${proj.status === 'ON_TRACK' ? 'done' : 'in_progress'}`}>
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--neu-muted)' }}>
                    Target: {proj.dueDate}
                  </div>
                </div>

                {/* Visual Gantt Bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ width: '100%', height: '12px', background: 'rgba(148, 163, 184, 0.15)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${proj.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--neu-accent), #818cf8)', borderRadius: '8px' }} />
                  </div>
                </div>

                {/* Milestones chips */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {proj.milestones.map(m => (
                    <span
                      key={m.id}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        background: m.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.12)' : m.status === 'IN_PROGRESS' ? 'rgba(79, 70, 229, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                        color: m.status === 'COMPLETED' ? 'var(--neu-success)' : m.status === 'IN_PROGRESS' ? 'var(--neu-accent)' : 'var(--neu-muted)'
                      }}
                    >
                      {m.status === 'COMPLETED' ? '✓' : m.status === 'IN_PROGRESS' ? '⚡' : '○'} {m.title} ({m.date})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MILESTONES & DELIVERABLES MATRIX                                  */}
      {/* ========================================================================= */}
      {activeView === 'MILESTONES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', flex: 1, overflowY: 'auto' }}>
          
          {/* Completed Milestones */}
          <div className="neu-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(15,23,42,0.14)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--neu-success)' }}>✓</span>
                <span className="neu-title" style={{ fontSize: '15px' }}>Completed Milestones</span>
              </div>
              <span className="badge-tag">Delivered</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.flatMap(p => p.milestones.filter(m => m.status === 'COMPLETED').map(m => ({ ...m, projectKey: p.key, projectName: p.name }))).map((m, idx) => (
                <div key={idx} className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--neu-accent)', fontWeight: 'bold' }}>{m.projectKey} • {m.projectName}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)', marginTop: '4px' }}>{m.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--neu-success)', marginTop: '4px' }}>✓ Completed on {m.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Milestones */}
          <div className="neu-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(15,23,42,0.14)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--neu-accent)' }}>⚡</span>
                <span className="neu-title" style={{ fontSize: '15px' }}>Active Sprint Milestones</span>
              </div>
              <span className="badge-tag">In Progress</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.flatMap(p => p.milestones.filter(m => m.status === 'IN_PROGRESS').map(m => ({ ...m, projectKey: p.key, projectName: p.name }))).map((m, idx) => (
                <div key={idx} className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px', borderLeft: '4px solid var(--neu-accent)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--neu-accent)', fontWeight: 'bold' }}>{m.projectKey} • {m.projectName}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)', marginTop: '4px' }}>{m.title}</div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>⏰ Target Date: {m.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Planned Milestones */}
          <div className="neu-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(15,23,42,0.14)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--neu-muted)' }}>○</span>
                <span className="neu-title" style={{ fontSize: '15px' }}>Upcoming & Backlog</span>
              </div>
              <span className="badge-tag">Planned</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.flatMap(p => p.milestones.filter(m => m.status === 'PLANNED').map(m => ({ ...m, projectKey: p.key, projectName: p.name }))).map((m, idx) => (
                <div key={idx} className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--neu-muted)', fontWeight: 'bold' }}>{m.projectKey} • {m.projectName}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)', marginTop: '4px' }}>{m.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--neu-muted)', marginTop: '4px' }}>📅 Planned for {m.date}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER PROJECT DETAIL INSPECTOR DRAWER (Requirement 12 UI/UX Pattern) */}
      {/* ========================================================================= */}
      {selectedProject && (
        <div
          onClick={() => setSelectedProject(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            transition: 'opacity 0.25s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{
              width: '560px',
              maxWidth: '90vw',
              height: '100%',
              borderRadius: '24px 0 0 24px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.15)',
              overflowY: 'auto',
              gap: '20px'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>{selectedProject.key}</span>
                  <span className={`badge-status status-${selectedProject.status === 'ON_TRACK' ? 'done' : 'in_progress'}`}>
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="neu-title" style={{ fontSize: '22px' }}>{selectedProject.name}</h2>
              </div>
              <button
                className="neu-btn neu-btn-icon"
                onClick={() => setSelectedProject(null)}
                style={{ width: '36px', height: '36px' }}
              >
                ✕
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="neu-panel-inset" style={{ display: 'flex', padding: '4px', borderRadius: '16px' }}>
              {[
                { id: 'OVERVIEW', label: 'Overview' },
                { id: 'MILESTONES', label: `Milestones (${selectedProject.milestones.length})` },
                { id: 'ASSETS', label: `Assets (${selectedProject.assets.length})` },
                { id: 'TASKS', label: `Tasks (${getProjectTasks(selectedProject.name).length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`neu-btn neu-btn-pill ${drawerTab === tab.id ? 'neu-btn-primary' : ''}`}
                  style={{ flex: 1, padding: '6px 0', fontSize: '11px', border: 'none', boxShadow: drawerTab === tab.id ? undefined : 'none' }}
                  onClick={() => setDrawerTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {drawerTab === 'OVERVIEW' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="neu-panel-inset" style={{ padding: '16px', borderRadius: '14px' }}>
                  <div className="neu-subtitle" style={{ marginBottom: '6px' }}>DESCRIPTION</div>
                  <p style={{ fontSize: '13px', color: 'var(--neu-text)', lineHeight: '1.5' }}>
                    {selectedProject.description}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  <div className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px' }}>
                    <div className="neu-subtitle">PROJECT LEAD</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-text)', marginTop: '4px' }}>
                      @{selectedProject.lead}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>{selectedProject.leadRole}</div>
                  </div>

                  <div className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px' }}>
                    <div className="neu-subtitle">TARGET DUE DATE</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-accent)', marginTop: '4px' }}>
                      📅 {selectedProject.dueDate}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                    <span className="neu-subtitle">OVERALL SPRINT PROGRESS</span>
                    <span style={{ color: 'var(--neu-accent)' }}>{selectedProject.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(148, 163, 184, 0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedProject.progress}%`, height: '100%', background: 'var(--neu-accent)', borderRadius: '6px' }} />
                  </div>
                </div>

                <div>
                  <div className="neu-subtitle" style={{ marginBottom: '8px' }}>TEAM SQUAD</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedProject.members.map((m, idx) => (
                      <span key={idx} className="badge-tag" style={{ fontSize: '12px' }}>
                        👤 @{m}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <button
                    className="neu-btn neu-btn-pill neu-btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '13px' }}
                    onClick={() => {
                      setSelectedProject(null);
                      navigate('/tasks');
                    }}
                  >
                    View Project Sprint Board →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MILESTONES */}
            {drawerTab === 'MILESTONES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedProject.milestones.map(m => (
                  <div key={m.id} className="neu-panel-inset" style={{ padding: '14px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>{m.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--neu-muted)', marginTop: '2px' }}>Target: {m.date}</div>
                    </div>
                    <span className={`badge-status status-${m.status === 'COMPLETED' ? 'done' : m.status === 'IN_PROGRESS' ? 'in_progress' : 'backlog'}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: ASSETS & RESOURCES */}
            {drawerTab === 'ASSETS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedProject.assets.map((ast, idx) => (
                  <div
                    key={idx}
                    className="saas-card"
                    style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => alert(`Opening resource: ${ast.title} (${ast.url})`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{ast.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>{ast.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>{ast.type}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--neu-accent)', fontWeight: 'bold' }}>Open ↗</span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: TASKS */}
            {drawerTab === 'TASKS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getProjectTasks(selectedProject.name).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--neu-muted)' }}>
                    No tasks currently linked to this project.
                  </div>
                ) : (
                  getProjectTasks(selectedProject.name).map(t => (
                    <div
                      key={t.id}
                      className="saas-card"
                      style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedProject(null);
                        navigate('/tasks');
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>TSK-{t.id}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--neu-text)' }}>{t.title}</div>
                      </div>
                      <span className={`badge-status status-${t.status.toLowerCase()}`}>{t.status}</span>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 6, 12, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{ width: '460px', padding: '32px', borderRadius: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="neu-title" style={{ fontSize: '20px' }}>Create New Project</h2>
              <button className="neu-btn neu-btn-icon" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>PROJECT NAME</label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="e.g. Payments Gateway v2"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>PROJECT KEY (PREFIX)</label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="e.g. PAY"
                  value={newProject.key}
                  onChange={(e) => setNewProject({ ...newProject, key: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea
                  className="neu-input"
                  rows="3"
                  placeholder="Goals, deliverables, and scope..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>TARGET DUE DATE</label>
                <input
                  type="date"
                  className="neu-input"
                  value={newProject.dueDate}
                  onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="neu-btn neu-btn-pill" style={{ flex: 1, padding: '12px' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="neu-btn neu-btn-pill neu-btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Projects;
