import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { websocketService } from '../services/websocketService';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = localStorage.getItem('username');

  const handleLogout = () => {
    websocketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const navItems = [
    { path: '/tasks', icon: '📋', label: 'Tasks' },
    { path: '/chat', icon: '💬', label: 'Chat' },
    { path: '/profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <aside style={{ width: '80px', height: '100%', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', zIndex: 50 }}>
      {/* Logo */}
      <div className="neu-panel" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>
        N
      </div>

      {/* Main Global Links */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`neu-btn neu-btn-icon ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile / Logout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div className="neu-btn neu-btn-icon" style={{ cursor: 'default', color: 'var(--neu-success)' }} title={currentUser}>
          {currentUser ? currentUser.charAt(0).toUpperCase() : 'U'}
        </div>
        <button className="neu-btn neu-btn-icon neu-btn-danger" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;