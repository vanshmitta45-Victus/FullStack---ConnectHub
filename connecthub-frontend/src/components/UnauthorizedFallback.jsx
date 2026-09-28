import React from 'react';
import { useNavigate } from 'react-router-dom';

function UnauthorizedFallback({ requiredRole = "Administrator" }) {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem('role') || 'MEMBER';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
      <div className="neu-panel" style={{ textAlign: 'center', padding: '48px', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div className="neu-avatar" style={{ width: '64px', height: '64px', fontSize: '28px', color: 'var(--neu-danger)' }}>
          🔒
        </div>
        <h2 className="neu-title" style={{ fontSize: '24px', color: 'var(--neu-danger)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--neu-muted)', fontSize: '14px', lineHeight: '1.6' }}>
          This workspace module is restricted to <strong>{requiredRole}</strong> accounts. Your current role is <span style={{ color: 'var(--neu-accent)', fontWeight: 'bold' }}>{currentRole}</span>.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--neu-muted)' }}>
          Contact your workspace administrator if you require escalated privileges for this section.
        </p>
        <button 
          className="neu-btn neu-btn-pill neu-btn-primary" 
          style={{ marginTop: '12px', padding: '10px 24px' }}
          onClick={() => navigate('/chat')}
        >
          Return to Workspace Chat
        </button>
      </div>
    </div>
  );
}

export default UnauthorizedFallback;