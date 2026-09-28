import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Signup';
import Chat from './components/Chat';
import UserManagement from './components/users/UserManagement';
import TaskBoard from './components/TaskBoard';
import Dashboard from './components/Dashboard';
import MyWork from './components/MyWork';
import Projects from './components/Projects';
import Teams from './components/Teams';
import Profile from './components/Profile';
import AuditLog from './components/AuditLog';
import UnauthorizedFallback from './components/UnauthorizedFallback';
import AppLayout from './components/layout/AppLayout';

// Global Error Boundary to prevent blank pages
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Workspace Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '24px',
          background: 'var(--neu-bg)'
        }}>
          <div className="neu-panel" style={{ padding: '36px', maxWidth: '520px', textAlign: 'center', borderRadius: '24px' }}>
            <div style={{ fontSize: '42px', marginBottom: '14px' }}>⚠️</div>
            <h2 className="neu-title" style={{ fontSize: '22px', marginBottom: '8px' }}>Something went wrong</h2>
            <p className="neu-subtitle" style={{ marginBottom: '24px', fontSize: '13px', lineHeight: '1.5' }}>
              {this.state.error?.message || "An unexpected error occurred while rendering the workspace."}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="neu-btn neu-btn-pill neu-btn-primary"
                style={{ padding: '10px 22px' }}
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                Reload Workspace
              </button>
              <button
                className="neu-btn neu-btn-pill"
                style={{ padding: '10px 22px' }}
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/dashboard';
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global Authentication Guard
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  
  // Wrap all protected views inside the Global Executive Shell
  return <AppLayout>{children}</AppLayout>;
};

// Role-Based Route Gating Guard
const RoleRoute = ({ children, allowedRoles = [], moduleName = "Administrator" }) => {
  const userRole = (localStorage.getItem('role') || 'MEMBER').toUpperCase();
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <UnauthorizedFallback requiredRole={moduleName} />;
  }
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> 
          <Route path="/signup" element={<Register />} />

          {/* Workspace Secured Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/my-work" element={
            <ProtectedRoute>
              <MyWork />
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
            <ProtectedRoute>
              <TaskBoard />
            </ProtectedRoute>
          } />

          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />

          <Route path="/teams" element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          {/* User Management Directory & Permissions Matrix */}
          <Route path="/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />

          {/* Audit History (Gated for Admin, Project Manager) */}
          <Route path="/audit" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']} moduleName="Workspace Administrator">
                <AuditLog />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* User Profile & Settings */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Fallback routing to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;