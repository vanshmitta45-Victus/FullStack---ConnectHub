import React from 'react';

function Profile() {
    const username = localStorage.getItem('username') || 'Unknown User';
    const role = (localStorage.getItem('role') || 'ROLE_USER').replace('ROLE_', '').replace('_', ' ');
    const email = `${username.toLowerCase()}@nexus.com`; // Fallback placeholder if not in localStorage

    return (
        <div className="jira-page-container">
            <div className="jira-page-header">
                <div>
                    <h1 className="jira-page-title">My Profile</h1>
                    <p className="jira-page-subtitle">View and manage your account information</p>
                </div>
            </div>

            <div className="jira-profile-card">
                <div className="jira-profile-hero">
                    <div className="jira-profile-avatar-large">{username.charAt(0).toUpperCase()}</div>
                    <div className="jira-profile-titles">
                        <h2>{username}</h2>
                        <span className="jira-lozenge green">Active</span>
                    </div>
                </div>

                <div className="jira-profile-grid">
                    <div className="jira-profile-section">
                        <h3>👤 Personal Information</h3>
                        <p className="section-desc">Your basic account details</p>
                        
                        <div className="jira-details-list">
                            <div className="jira-detail-item">
                                <label>Username</label>
                                <span>{username}</span>
                            </div>
                            <div className="jira-detail-item">
                                <label>Email</label>
                                <span>{email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="jira-profile-section">
                        <h3>🏢 System Access</h3>
                        <p className="section-desc">Your permissions and roles</p>
                        
                        <div className="jira-details-list">
                            <div className="jira-detail-item">
                                <label>Primary Role</label>
                                <span><span className="jira-lozenge blue">{role}</span></span>
                            </div>
                            <div className="jira-detail-item">
                                <label>Account Status</label>
                                <span>Verified Account. You have full access to features assigned to your role.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;