import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'EMPLOYEE' });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users/all', { headers });
            setUsers(res.data);
        } catch (err) { console.error('Failed to fetch users'); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/users/create', formData, { headers });
            setShowModal(false);
            setFormData({ username: '', email: '', password: '', role: 'EMPLOYEE' });
            fetchUsers();
        } catch (err) { alert('Creation failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/api/users/${id}`, { headers });
            fetchUsers();
        } catch (err) { alert('Deletion failed'); }
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="jira-page-container">
            <div className="jira-page-header">
                <div>
                    <h1 className="jira-page-title">User Management</h1>
                    <p className="jira-page-subtitle">A list of all users in the system with their roles and information.</p>
                </div>
                <button className="jira-btn-primary" onClick={() => setShowModal(true)}>+ Create User</button>
            </div>

            <div className="jira-search-filter" style={{ width: '300px', marginBottom: '20px' }}>
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search by user ID, username, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* EXACT REFERENCE TABLE LAYOUT */}
            <div className="jira-table-container">
                <table className="survey-table">
                    <thead>
                        <tr>
                            <th style={{width: '70px'}}>User ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Gender</th>
                            <th>Mobile</th>
                            <th>Roles</th>
                            <th style={{textAlign: 'right'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td className="survey-td-id">{user.id}</td>
                                <td className="survey-td-bold">{user.username}</td>
                                <td>{user.email}</td>
                                <td>Male</td> {/* Placeholder to match image */}
                                <td>0000000000</td> {/* Placeholder to match image */}
                                <td>
                                    <span className="survey-role-pill">
                                        {user.role.replace('ROLE_', '').replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{textAlign: 'right', whiteSpace: 'nowrap'}}>
                                    <button className="survey-action-btn">Edit User</button>
                                    <button className="survey-action-btn">Edit Roles</button>
                                    <button className="survey-action-btn delete" onClick={() => handleDelete(user.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="jira-modal">
                        <div className="jira-modal-header">
                            <h2>Create New User</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateUser} className="jira-modal-body">
                            <div className="jira-form-group">
                                <label>Username <span className="req">*</span></label>
                                <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>
                            <div className="jira-form-group">
                                <label>Email <span className="req">*</span></label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="jira-form-group-row">
                                <div className="jira-form-group">
                                    <label>Password <span className="req">*</span></label>
                                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                </div>
                                <div className="jira-form-group">
                                    <label>Role</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                        <option value="EMPLOYEE">Data Collector</option>
                                        <option value="TEAM_LEADER">Survey Creator</option>
                                        <option value="MANAGER">Data Viewer</option>
                                        <option value="ADMIN">Survey Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="jira-modal-footer">
                                <button type="button" className="jira-btn-text" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="jira-btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;