import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { websocketService } from '../../services/websocketService';

function TopBar({ onToggleSidebar, isCollapsed, onOpenCommandPalette }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = localStorage.getItem('username') || 'User';
  const userRole = localStorage.getItem('role') || 'MEMBER';

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    websocketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Derive breadcrumb from current path
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.startsWith('/dashboard')) return { section: 'Overview', current: 'Workspace Dashboard' };
    if (p.startsWith('/my-work')) return { section: 'Personal', current: 'My Work' };
    if (p.startsWith('/tasks')) return { section: 'Operations', current: 'Task Board' };
    if (p.startsWith('/projects')) return { section: 'Strategy', current: 'Projects & Delivery' };
    if (p.startsWith('/teams')) return { section: 'Organization', current: 'Teams & Rosters' };
    if (p.startsWith('/users')) return { section: 'Administration', current: 'User Directory' };
    if (p.startsWith('/audit')) return { section: 'Compliance', current: 'Audit History' };
    if (p.startsWith('/chat')) return { section: 'Communications', current: 'Chat & Channels' };
    if (p.startsWith('/profile')) return { section: 'Account', current: 'Settings & Profile' };
    return { section: 'Nexus Workspace', current: 'Overview' };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header style={{
      height: '74px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      marginBottom: '8px',
      flexShrink: 0,
      background: 'rgba(8, 13, 24, 0.45)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderBottom: '1px solid var(--neu-glass-border)'
    }}>
      
      {/* Left: Breadcrumbs & Sidebar Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="neu-btn neu-btn-icon"
          onClick={onToggleSidebar}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{ width: '38px', height: '38px' }}
        >
          {isCollapsed ? '☰' : '⇤'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="neu-subtitle" style={{ fontSize: '12px' }}>{breadcrumb.section}</span>
          <span style={{ color: 'var(--neu-muted)', fontSize: '11px' }}>/</span>
          <span className="neu-title" style={{ fontSize: '15px', color: 'var(--neu-text)' }}>{breadcrumb.current}</span>
        </div>
      </div>

      {/* Center: Global Search Bar (Triggers Command Palette) */}
      <div
        onClick={onOpenCommandPalette}
        style={{
          flex: 1,
          maxWidth: '440px',
          position: 'relative',
          margin: '0 24px',
          cursor: 'pointer'
        }}
      >
        <input
          type="text"
          readOnly
          className="neu-input"
          placeholder="Search workspace, members, commands... (Ctrl+K / ⌘K)"
          style={{ paddingLeft: '40px', paddingRight: '48px', fontSize: '13px', cursor: 'pointer' }}
          onClick={onOpenCommandPalette}
        />
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '14px' }}>
          🔍
        </span>
        <kbd style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '11px',
          color: 'var(--neu-muted)',
          background: 'rgba(148, 163, 184, 0.15)',
          padding: '2px 6px',
          borderRadius: '5px'
        }}>
          ⌘K
        </kbd>
      </div>

      {/* Right: Actions, Notifications, & User Identity Capsule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="neu-btn neu-btn-icon"
            title="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            🔔
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--neu-accent)'
            }} />
          </button>

          {showNotifications && (
            <div className="neu-panel" style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '320px',
              padding: '16px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neu-glass-border)', paddingBottom: '8px' }}>
                <span className="neu-title" style={{ fontSize: '14px' }}>Notifications</span>
                <span className="neu-subtitle" style={{ fontSize: '10px' }}>WORKSPACE ALERTS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div className="neu-panel-inset" style={{ padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--neu-text)' }}>Welcome to Nexus Workspace</div>
                  <div style={{ color: 'var(--neu-muted)', fontSize: '11px', marginTop: '2px' }}>Real-time collaboration is active.</div>
                </div>
                <div className="neu-panel-inset" style={{ padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--neu-text)' }}>Task Board Connected</div>
                  <div style={{ color: 'var(--neu-muted)', fontSize: '11px', marginTop: '2px' }}>Sprint tasks are ready for review.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: '28px', width: '1px', backgroundColor: 'var(--neu-glass-border)' }} />

        {/* User Identity Capsule & Dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <div
            className="neu-panel"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 14px 6px 8px',
              borderRadius: '24px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div className="neu-avatar neu-avatar-sm" style={{ fontWeight: 'bold' }}>
              {currentUser.charAt(0).toUpperCase()}
            </div>

            <div style={{ textAlign: 'left' }}>
              <div className="neu-title" style={{ fontSize: '13px', lineHeight: '1.2' }}>{currentUser}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span className="neu-status-dot online" />
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--neu-accent)', letterSpacing: '0.5px' }}>
                  {userRole}
                </span>
              </div>
            </div>

            <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '4px' }}>▼</span>
          </div>

          {/* User Profile Dropdown Menu */}
          {showUserMenu && (
            <div className="neu-panel" style={{
              position: 'absolute',
              right: 0,
              top: '54px',
              width: '220px',
              padding: '12px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.3)', marginBottom: '4px' }}>
                <div style={{ fontSize: '11px', color: 'var(--neu-muted)' }}>Signed in as</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-text)' }}>@{currentUser}</div>
              </div>

              <div
                className="neu-nav-item"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/profile');
                }}
              >
                <span>👤</span>
                <span>My Profile</span>
              </div>

              <div
                className="neu-nav-item"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/users');
                }}
              >
                <span>👥</span>
                <span>User Directory</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', marginTop: '4px', paddingTop: '4px' }}>
                <div
                  className="neu-nav-item"
                  style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--neu-danger)' }}
                  onClick={handleLogout}
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}

export default TopBar;