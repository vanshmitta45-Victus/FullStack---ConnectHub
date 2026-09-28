import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:8080/api/auth/register', { username, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Username may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
      <div className="neu-panel" style={{ width: '420px', padding: '48px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div className="neu-avatar" style={{ width: '76px', height: '76px', fontSize: '28px', marginBottom: '20px' }}>
          +
        </div>

        <h2 className="neu-title" style={{ fontSize: '22px', marginBottom: '6px' }}>Create Account</h2>
        <p className="neu-subtitle" style={{ marginBottom: '32px' }}>Join your team on Nexus Workspace</p>

        <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ color: 'var(--neu-danger)', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <div>
            <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>USERNAME</label>
            <input
              type="text"
              className="neu-input"
              placeholder="e.g. khushi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>PASSWORD</label>
            <input
              type="password"
              className="neu-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>CONFIRM PASSWORD</label>
            <input
              type="password"
              className="neu-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="neu-btn neu-btn-pill neu-btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '12px', fontSize: '14px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ marginTop: '28px', fontSize: '13px', color: 'var(--neu-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--neu-accent)', textDecoration: 'none', fontWeight: '700' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;