import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function NavigationSidebar({ isCollapsed = false, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = (localStorage.getItem('role') || 'MEMBER').toUpperCase();
  const isAdminOrLead = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(userRole);
  const isAdmin = ['ADMIN', 'PROJECT_MANAGER'].includes(userRole);

  const [showHelpModal, setShowHelpModal] = useState(false);


  // Core Product Areas matching Specification Information Architecture
  const mainNavItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/my-work', icon: '⚡', label: 'My Work' },
    { path: '/tasks', icon: '📋', label: 'Task Board' },
    { path: '/projects', icon: '📦', label: 'Projects' },
    { path: '/teams', icon: '👥', label: 'Teams' },
    { path: '/users', icon: '👥', label: 'User Management' },
    { path: '/chat', icon: '💬', label: 'Chat & Comms' }
  ];

  const adminNavItems = [
    ...(isAdmin ? [{ path: '/audit', icon: '📜', label: 'Audit History' }] : [])
  ];

  const bottomNavItems = [
    { path: '/profile', icon: '⚙️', label: 'Settings & Profile' }
  ];

  return (
    <aside style={{
      width: isCollapsed ? '78px' : '260px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: isCollapsed ? '20px 10px' : '20px 16px',
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderRight: '1px solid var(--neu-glass-border)',
      transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s ease',
      zIndex: 50,
      flexShrink: 0,
      userSelect: 'none',
      position: 'relative'
    }}>
      
      {/* Nexus Brand Header (click to collapse / expand sidebar) */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div
          className="neu-panel"
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: isCollapsed ? '8px 6px' : '8px 12px',
            borderRadius: '14px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            cursor: 'pointer'
          }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              className="neu-avatar"
              style={{
                width: '34px',
                height: '34px',
                fontSize: '16px',
                fontWeight: '900',
                flexShrink: 0
              }}
            >
              N
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  Nexus
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
        
        {/* Core Product Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {!isCollapsed && (
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--neu-muted)', paddingLeft: '12px', letterSpacing: '0.8px' }}>
              COLLABORATION
            </div>
          )}

          {mainNavItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                className={`neu-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : ''}
                style={{
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '12px 0' : '10px 14px',
                  position: 'relative'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '4px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: 'var(--neu-accent)',
                    boxShadow: '0 0 10px var(--neu-accent)'
                  }} />
                )}

                <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span style={{ flex: 1, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Administration Section (Role-gated) */}
        {adminNavItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {!isCollapsed && (
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--neu-muted)', paddingLeft: '12px', letterSpacing: '0.8px' }}>
                ADMINISTRATION
              </div>
            )}

            {adminNavItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <div
                  key={item.path}
                  className={`neu-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={isCollapsed ? item.label : ''}
                  style={{
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '12px 0' : '10px 14px',
                    position: 'relative'
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: '4px',
                      borderRadius: '0 4px 4px 0',
                      backgroundColor: 'var(--neu-accent)',
                      boxShadow: '0 0 10px var(--neu-accent)'
                    }} />
                  )}

                  <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span style={{ flex: 1, fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Bottom Area: Settings, Help & Collapse */}
      <div style={{ borderTop: '1px solid var(--neu-glass-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Settings & Profile */}
        {bottomNavItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <div
              key={item.path}
              className={`neu-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : ''}
              style={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '8px 12px',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>

              {!isCollapsed && (
                <span style={{ flex: 1, fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}

        {/* Help & Support Button */}
        <div
          className="neu-nav-item"
          onClick={() => setShowHelpModal(true)}
          title={isCollapsed ? "Help & Support" : ""}
          style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '10px 0' : '8px 12px'
          }}
        >
          <span style={{ fontSize: '16px' }}>❓</span>
          {!isCollapsed && (
            <span style={{ flex: 1, fontSize: '13px' }}>Help & Support</span>
          )}
        </div>

      </div>

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div
          onClick={() => setShowHelpModal(false)}
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
            style={{ width: '480px', padding: '28px', borderRadius: '18px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <h2 className="neu-title" style={{ fontSize: '18px' }}>Nexus Workspace Guide</h2>
              </div>
              <button className="neu-btn neu-btn-icon" onClick={() => setShowHelpModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', lineHeight: '1.5', color: 'var(--neu-text)' }}>
              <div className="neu-panel-inset" style={{ padding: '12px', borderRadius: '10px' }}>
                <strong style={{ display: 'block', color: 'var(--neu-accent)', marginBottom: '4px' }}>⌨️ Keyboard Shortcuts</strong>
                <div>Press <kbd style={{ padding: '2px 6px', background: 'rgba(0, 242, 254, 0.12)', color: 'var(--neu-accent)', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>Ctrl + K</kbd> or <kbd style={{ padding: '2px 6px', background: 'rgba(0, 242, 254, 0.12)', color: 'var(--neu-accent)', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>⌘K</kbd> anywhere to trigger the Global Search & Command Palette.</div>
              </div>

              <div className="neu-panel-inset" style={{ padding: '12px', borderRadius: '10px' }}>
                <strong style={{ display: 'block', color: 'var(--neu-accent)', marginBottom: '4px' }}>📋 Jira-Style Task Board</strong>
                <div>Drag tasks smoothly between columns: Backlog, To Do, In Progress, In Review, Blocked, and Done. Click any task card to open the Slide-over Issue Inspector.</div>
              </div>

              <div className="neu-panel-inset" style={{ padding: '12px', borderRadius: '10px' }}>
                <strong style={{ display: 'block', color: 'var(--neu-accent)', marginBottom: '4px' }}>💬 Chat Integration</strong>
                <div>Real-time communication remains intact with STOMP WebSocket sync. Linked tasks jump straight into team discussions.</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="neu-btn neu-btn-pill neu-btn-primary" style={{ padding: '8px 20px' }} onClick={() => setShowHelpModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}

export default NavigationSidebar;