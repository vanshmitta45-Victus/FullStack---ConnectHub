import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

function Login() {
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const executeLogin = async (user, pass) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', {
        username: user,
        password: pass
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username || user);
      if (res.data.role) {
        localStorage.setItem('role', res.data.role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    executeLogin(username, password);
  };

  const quickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    executeLogin(user, pass);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
      <div className="neu-panel" style={{ width: '440px', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div className="neu-avatar" style={{ width: '72px', height: '72px', fontSize: '28px', marginBottom: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', border: '1px solid var(--neu-accent)' }}>
          <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>N</span>
        </div>

        <h2 className="neu-title" style={{ fontSize: '22px', marginBottom: '4px' }}>Nexus Workspace</h2>
        <p className="neu-subtitle" style={{ marginBottom: '24px', fontSize: '13px' }}>Sign in to continue to collaboration</p>

        {isExpired && (
          <div style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ color: 'var(--neu-danger)', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <div>
            <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>USERNAME</label>
            <input
              type="text"
              className="neu-input"
              placeholder="e.g. vansh or demo_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>PASSWORD</label>
            <input
              type="password"
              className="neu-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="neu-btn neu-btn-pill neu-btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '14px', justifyContent: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div style={{
          width: '100%',
          marginTop: '20px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--neu-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--neu-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              ⚡ 1-Click Fast Login
            </span>
            <span className="neu-badge neu-badge-purple" style={{ fontSize: '10px' }}>Active Session</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="neu-btn"
              style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'center' }}
              onClick={() => quickLogin('vansh', 'Password123!')}
              disabled={isLoading}
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              className="neu-btn"
              style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'center' }}
              onClick={() => quickLogin('demo_user', 'Password123!')}
              disabled={isLoading}
            >
              👤 Member
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--neu-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--neu-accent)', textDecoration: 'none', fontWeight: '700' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;