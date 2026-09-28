import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MyWork() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('IN_PROGRESS'); // IN_PROGRESS, TODO, IN_REVIEW, DONE
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username');

  useEffect(() => {
    const fetchMyTasks = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`http://localhost:8080/api/tasks/all?assignee=${currentUser}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTasks();
  }, [currentUser, token]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:8080/api/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredTasks = tasks.filter(t => t.status === activeTab);

  const counts = {
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
    DONE: tasks.filter(t => t.status === 'DONE').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="neu-title" style={{ fontSize: '26px' }}>My Work</h1>
          <p className="neu-subtitle">Your personal sprint queue and assigned deliverables.</p>
        </div>

        <button
          className="neu-btn neu-btn-pill neu-btn-primary"
          style={{ padding: '10px 18px', fontSize: '13px' }}
          onClick={() => navigate('/tasks')}
        >
          View Full Sprint Board →
        </button>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { id: 'IN_PROGRESS', label: 'In Progress', icon: '⚡' },
          { id: 'TODO', label: 'To Do', icon: '📋' },
          { id: 'IN_REVIEW', label: 'In Review', icon: '🔍' },
          { id: 'DONE', label: 'Done', icon: '✅' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`neu-btn neu-btn-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'var(--neu-accent)' : 'rgba(148, 163, 184, 0.2)',
                color: isActive ? '#fff' : 'var(--neu-text)',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {counts[tab.id] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tasks List */}
      <div className="neu-panel" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--neu-muted)' }}>Loading your work...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--neu-muted)' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎉</div>
            <h3 className="neu-title" style={{ fontSize: '16px', marginBottom: '4px' }}>No items in {activeTab.replace('_', ' ')}</h3>
            <p className="neu-subtitle">Select another category or view the main board.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className="saas-card"
                style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>
                    TSK-{task.id}
                  </span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--neu-text)' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--neu-muted)', marginTop: '4px' }}>
                      Project: {task.project || 'General'} {task.dueDate && `• 📅 Due: ${task.dueDate}`} • ⚡ {task.storyPoints || 1} pts
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Status quick mover */}
                  <select
                    className="neu-input"
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '12px', width: '130px', cursor: 'pointer' }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>

                  <button
                    className="neu-btn neu-btn-pill"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                    onClick={() => navigate('/tasks')}
                  >
                    Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default MyWork;
