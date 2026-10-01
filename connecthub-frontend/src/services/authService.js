import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE}/api/auth`;

export const authService = {
    async signup(user) {
        const response = await axios.post(`${API_URL}/signup`, user);
        return response.data;
    },
     async login(credentials) {
        const response = await axios.post(`${API_URL}/login`, credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', credentials.username);
            // ADD THIS LINE: Store the role (assuming backend returns role in login response)
            localStorage.setItem('role', response.data.role || 'ROLE_USER'); 
        }
        return response.data;
    },
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    }
};
