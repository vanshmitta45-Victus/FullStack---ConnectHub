import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App.jsx';

// Global Axios 401/403 Security Interceptor
// Automatically purges expired/invalid tokens and redirects safely to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
