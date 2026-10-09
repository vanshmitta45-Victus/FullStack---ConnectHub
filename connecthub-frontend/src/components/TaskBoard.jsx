import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', icon: '📥', color: '#64748b' },
  { id: 'TODO', label: 'To Do', icon: '📋', color: '#6366f1' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: '⚡', color: '#0284c7' },
  { id: 'IN_REVIEW', label: 'In Review', icon: '🔍', color: '#a855f7' },
  { id: 'BLOCKED', label: 'Blocked', icon: '🚫', color: '#e11d48' },
  { id: 'DONE', label: 'Done', icon: '✅', color: '#10b981' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', badgeClass: 'badge-priority-low' },
  { value: 'MEDIUM', label: 'Medium', badgeClass: 'badge-priority-medium' },
  { value: 'HIGH', label: 'High', badgeClass: 'badge-priority-high' },
  { value: 'URGENT', label: 'Urgent', badgeClass: 'badge-priority-urgent' }
];

function TaskBoard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'

  // Filter matrix state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [filterOnlyMyIssues, setFilterOnlyMyIssues] = useState(false);
  const [filterBlockedOnly, setFilterBlockedOnly] = useState(false);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Detail Inspector Drawer state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Create Task Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    storyPoints: 2,
    dueDate: '',
    labels: '',
    project: 'ConnectHub Core',
    assignedUsername: '',
    linkedChannel: 'Global'
  });

  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username');

  // Fetch all tasks and workspace users
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [tasksRes, usersRes] = await Promise.all([
        axios.get('/api/tasks/all', { headers }),
        axios.get('/api/users/directory', { headers }).catch(() => ({ data: [] }))
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Parse Subtasks safely from string/JSON
  const parseSubtasks = (subtasksRaw) => {
    if (!subtasksRaw) return [];
    if (Array.isArray(subtasksRaw)) return subtasksRaw;
    try {
      return JSON.parse(subtasksRaw);
    } catch {
      return [];
    }
  };

  // Parse Comments safely from string/JSON
  const parseComments = (commentsRaw) => {
    if (!commentsRaw) return [];
    if (Array.isArray(commentsRaw)) return commentsRaw;
    try {
      return JSON.parse(commentsRaw);
    } catch {
      return [];
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', String(taskId));
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTaskId) return;

    const taskToMove = tasks.find(t => t.id === draggedTaskId);
    if (!taskToMove || taskToMove.status === targetStatus) return;

    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));

    if (selectedTask && selectedTask.id === draggedTaskId) {
      setSelectedTask(prev => ({ ...prev, status: targetStatus }));
    }

    try {
      await axios.put(
        `/api/tasks/${draggedTaskId}/status`,
        { status: targetStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to update task status', err);
      fetchData(); // Rollback on failure
    } finally {
      setDraggedTaskId(null);
    }
  };

  // Create Task Handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        status: createForm.status,
        priority: createForm.priority,
        storyPoints: Number(createForm.storyPoints) || 1,
        dueDate: createForm.dueDate,
        labels: createForm.labels,
        project: createForm.project,
        assignedUsername: createForm.assignedUsername,
        linkedChannel: createForm.linkedChannel,
        subtasks: JSON.stringify([]),
        comments: JSON.stringify([])
      };

      const res = await axios.post('/api/tasks/create', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTasks(prev => [...prev, res.data]);
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        storyPoints: 2,
        dueDate: '',
        labels: '',
        project: 'ConnectHub Core',
        assignedUsername: '',
        linkedChannel: 'Global'
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  // Save changes from Inspector Drawer
  const handleSaveInspector = async (updatedFields) => {
    if (!selectedTask) return;
    const mergedTask = { ...selectedTask, ...updatedFields };
    setSelectedTask(mergedTask);

    // Optimistic board update
    setTasks(prev => prev.map(t => t.id === mergedTask.id ? mergedTask : t));

    try {
      const payload = {
        title: mergedTask.title,
        description: mergedTask.description,
        status: mergedTask.status,
        priority: mergedTask.priority,
        storyPoints: mergedTask.storyPoints,
        dueDate: mergedTask.dueDate,
        labels: mergedTask.labels,
        project: mergedTask.project,
        linkedChannel: mergedTask.linkedChannel,
        isBlocked: mergedTask.isBlocked,
        blockedReason: mergedTask.blockedReason,
        subtasks: typeof mergedTask.subtasks === 'string' ? mergedTask.subtasks : JSON.stringify(mergedTask.subtasks || []),
        comments: typeof mergedTask.comments === 'string' ? mergedTask.comments : JSON.stringify(mergedTask.comments || []),
        assignedUsername: mergedTask.assignedUser ? mergedTask.assignedUser.username : null
      };

      await axios.put(`/api/tasks/${selectedTask.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to update task details', err);
    }
  };

  // Toggle Subtask Completion in Inspector
  const handleToggleSubtask = (subtaskId) => {
    if (!selectedTask) return;
    const currentSubtasks = parseSubtasks(selectedTask.subtasks);
    const updated = currentSubtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    handleSaveInspector({ subtasks: JSON.stringify(updated) });
  };

  // Add New Subtask in Inspector
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    const currentSubtasks = parseSubtasks(selectedTask.subtasks);
    const newSubtask = {
      id: Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    const updated = [...currentSubtasks, newSubtask];
    handleSaveInspector({ subtasks: JSON.stringify(updated) });
    setNewSubtaskTitle('');
  };

  // Delete Subtask in Inspector
  const handleDeleteSubtask = (subtaskId) => {
    if (!selectedTask) return;
    const currentSubtasks = parseSubtasks(selectedTask.subtasks);
    const updated = currentSubtasks.filter(st => st.id !== subtaskId);
    handleSaveInspector({ subtasks: JSON.stringify(updated) });
  };

  // Add Comment in Inspector
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;
    const currentComments = parseComments(selectedTask.comments);
    const newComment = {
      id: Date.now(),
      author: currentUser || 'Me',
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
    };
    const updated = [...currentComments, newComment];
    handleSaveInspector({ comments: JSON.stringify(updated) });
    setNewCommentText('');
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm(`Delete issue TSK-${taskId}? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setIsInspectorOpen(false);
      setSelectedTask(null);
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  // Filter Tasks by Matrix
  const filteredTasks = tasks.filter(task => {
    if (filterOnlyMyIssues && (!task.assignedUser || task.assignedUser.username !== currentUser)) {
      return false;
    }
    if (filterBlockedOnly && task.status !== 'BLOCKED' && !task.isBlocked) {
      return false;
    }
    if (selectedAssignee !== 'ALL') {
      if (!task.assignedUser || task.assignedUser.username !== selectedAssignee) return false;
    }
    if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
      return false;
    }
    if (selectedProject !== 'ALL' && task.project !== selectedProject) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = task.title && task.title.toLowerCase().includes(q);
      const matchDesc = task.description && task.description.toLowerCase().includes(q);
      const matchKey = `tsk-${task.id}`.includes(q);
      const matchLabel = task.labels && task.labels.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchKey && !matchLabel) return false;
    }
    return true;
  });

  // Extract distinct projects
  const uniqueProjects = Array.from(new Set(tasks.map(t => t.project).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Top Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="neu-title" style={{ fontSize: '26px' }}>Project Kanban</h1>
            <span className="tag-pill" style={{ background: 'var(--neu-accent)', color: '#fff', fontWeight: 'bold' }}>
              Sprint 4 Active
            </span>
          </div>
          <p className="neu-subtitle" style={{ marginTop: '4px' }}>
            Interactive Jira-style delivery board with drag-and-drop workflow and issue inspection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div className="neu-panel-inset" style={{ padding: '3px', borderRadius: '20px', display: 'flex' }}>
            <button
              className={`neu-btn neu-btn-pill ${viewMode === 'board' ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={() => setViewMode('board')}
            >
              📊 Board
            </button>
            <button
              className={`neu-btn neu-btn-pill ${viewMode === 'list' ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
          </div>

          <button
            className="neu-btn neu-btn-pill neu-btn-primary"
            style={{ padding: '10px 20px', gap: '8px', fontSize: '13px' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span>+</span>
            <span>Create Issue</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix Bar */}
      <div className="neu-panel" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search Filter */}
        <div style={{ position: 'relative', width: '240px' }}>
          <input
            type="text"
            className="neu-input"
            placeholder="Search issues, keys (TSK-1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '12px', padding: '8px 12px 8px 34px' }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>
            🔍
          </span>
        </div>

        {/* Quick Filters */}
        <button
          className={`neu-btn neu-btn-pill ${filterOnlyMyIssues ? 'active' : ''}`}
          onClick={() => setFilterOnlyMyIssues(!filterOnlyMyIssues)}
          style={{ fontSize: '12px', padding: '7px 14px' }}
        >
          👤 Only My Issues
        </button>

        <button
          className={`neu-btn neu-btn-pill ${filterBlockedOnly ? 'active' : ''}`}
          onClick={() => setFilterBlockedOnly(!filterBlockedOnly)}
          style={{ fontSize: '12px', padding: '7px 14px', color: filterBlockedOnly ? 'var(--neu-danger)' : 'var(--neu-text)' }}
        >
          🚫 Blocked Issues
        </button>

        {/* Assignee Filter Dropdown */}
        <select
          className="neu-input"
          style={{ width: '150px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer' }}
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
        >
          <option value="ALL">All Assignees</option>
          {users.map(u => (
            <option key={u.id} value={u.username}>@{u.username}</option>
          ))}
        </select>

        {/* Priority Filter Dropdown */}
        <select
          className="neu-input"
          style={{ width: '140px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer' }}
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
        >
          <option value="ALL">All Priorities</option>
          {PRIORITIES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Project Filter Dropdown */}
        {uniqueProjects.length > 0 && (
          <select
            className="neu-input"
            style={{ width: '160px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer' }}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map(proj => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>
        )}

        {/* Reset Filters */}
        {(searchQuery || selectedAssignee !== 'ALL' || selectedPriority !== 'ALL' || selectedProject !== 'ALL' || filterOnlyMyIssues || filterBlockedOnly) && (
          <button
            className="neu-btn neu-btn-pill"
            style={{ padding: '7px 14px', fontSize: '12px', color: 'var(--neu-muted)' }}
            onClick={() => {
              setSearchQuery('');
              setSelectedAssignee('ALL');
              setSelectedPriority('ALL');
              setSelectedProject('ALL');
              setFilterOnlyMyIssues(false);
              setFilterBlockedOnly(false);
            }}
          >
            ✕ Reset Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--neu-muted)' }}>
          Showing <strong>{filteredTasks.length}</strong> of {tasks.length} issues
        </div>
      </div>

      {/* Main Board View */}
      {viewMode === 'board' ? (
        <div style={{
          display: 'flex',
          gap: '18px',
          flex: 1,
          overflowX: 'auto',
          paddingBottom: '16px'
        }}>
          {COLUMNS.map(col => {
            const columnTasks = filteredTasks.filter(t => t.status === col.id);
            const isTarget = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className={`kanban-column ${isTarget ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{col.icon}</span>
                    <h3 className="neu-title" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {col.label}
                    </h3>
                  </div>

                  <span style={{
                    background: 'var(--neu-bg)',
                    boxShadow: 'var(--neu-shadow-raised)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: col.color
                  }}>
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                  {columnTasks.map(task => {
                    const subtasks = parseSubtasks(task.subtasks);
                    const completedSubtasks = subtasks.filter(st => st.completed).length;
                    const priorityObj = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
                    const isDragging = draggedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsInspectorOpen(true);
                        }}
                      >
                        {/* Header: Key & Priority */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--neu-accent)', letterSpacing: '0.4px' }}>
                            TSK-{task.id}
                          </span>
                          <span className={`badge-priority ${priorityObj.badgeClass}`}>
                            {priorityObj.label}
                          </span>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--neu-text)', lineHeight: '1.4', marginBottom: '10px' }}>
                          {task.title}
                        </div>

                        {/* Blocked Warning */}
                        {task.status === 'BLOCKED' && (
                          <div style={{
                            background: 'rgba(225, 29, 72, 0.1)',
                            borderLeft: '3px solid #e11d48',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#e11d48',
                            fontWeight: '600',
                            marginBottom: '8px'
                          }}>
                            🚫 {task.blockedReason || 'Blocked by external dependency'}
                          </div>
                        )}

                        {/* Labels */}
                        {task.labels && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {task.labels.split(',').map((lbl, idx) => (
                              <span key={idx} className="tag-pill">
                                {lbl.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer: Subtask progress, Story Points, Due Date, Assignee */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(15,23,42,0.12)', paddingTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--neu-muted)' }}>
                            {/* Story Points */}
                            <span title="Story Points" style={{ fontWeight: '600', color: 'var(--neu-text)' }}>
                              ⚡ {task.storyPoints || 1}
                            </span>

                            {/* Subtask count */}
                            {subtasks.length > 0 && (
                              <span title={`Subtasks: ${completedSubtasks}/${subtasks.length}`}>
                                ☑️ {completedSubtasks}/{subtasks.length}
                              </span>
                            )}

                            {/* Due Date */}
                            {task.dueDate && (
                              <span title="Due Date">
                                📅 {task.dueDate}
                              </span>
                            )}
                          </div>

                          {/* Assignee Avatar */}
                          <div
                            className="neu-avatar"
                            style={{ width: '26px', height: '26px', fontSize: '11px', fontWeight: 'bold' }}
                            title={task.assignedUser ? `@${task.assignedUser.username}` : 'Unassigned'}
                          >
                            {task.assignedUser ? task.assignedUser.username.charAt(0).toUpperCase() : '?'}
                          </div>
                        </div>

                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 10px',
                      color: 'var(--neu-muted)',
                      fontSize: '12px',
                      border: '1px dashed rgba(148, 163, 184, 0.3)',
                      borderRadius: '10px'
                    }}>
                      Drop issues here
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="neu-panel" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(15,23,42,0.16)' }}>
                <th className="neu-subtitle" style={{ padding: '12px' }}>KEY</th>
                <th className="neu-subtitle" style={{ padding: '12px' }}>TITLE</th>
                <th className="neu-subtitle" style={{ padding: '12px' }}>STATUS</th>
                <th className="neu-subtitle" style={{ padding: '12px' }}>PRIORITY</th>
                <th className="neu-subtitle" style={{ padding: '12px' }}>ASSIGNEE</th>
                <th className="neu-subtitle" style={{ padding: '12px' }}>POINTS</th>
                <th className="neu-subtitle" style={{ padding: '12px' }}>DUE DATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const priorityObj = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
                return (
                  <tr
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsInspectorOpen(true);
                    }}
                    style={{ borderBottom: '1px solid rgba(15,23,42,0.12)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--neu-accent)', fontSize: '12px' }}>
                      TSK-{task.id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>
                      {task.title}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge-status status-${task.status.toLowerCase()}`}>
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge-priority ${priorityObj.badgeClass}`}>
                        {priorityObj.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      {task.assignedUser ? `@${task.assignedUser.username}` : 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      {task.storyPoints || 1} pts
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--neu-muted)' }}>
                      {task.dueDate || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          SLIDE-OVER ISSUE DETAIL INSPECTOR DRAWER
          ======================================================== */}
      {isInspectorOpen && selectedTask && (
        <div
          onClick={() => setIsInspectorOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{
              width: '560px',
              maxWidth: '95vw',
              height: '100%',
              borderRadius: '24px 0 0 24px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 28px rgba(0, 0, 0, 0.2)',
              overflowY: 'auto'
            }}
          >
            {/* Inspector Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neu-accent)' }}>
                  TSK-{selectedTask.id}
                </span>
                <span className="neu-subtitle">/ {selectedTask.project || 'General'}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="neu-btn neu-btn-icon neu-btn-danger"
                  style={{ width: '32px', height: '32px', fontSize: '12px' }}
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  title="Delete Issue"
                >
                  🗑️
                </button>
                <button
                  className="neu-btn neu-btn-icon"
                  style={{ width: '34px', height: '34px' }}
                  onClick={() => setIsInspectorOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Editable Title */}
            <input
              type="text"
              className="neu-input"
              value={selectedTask.title || ''}
              onChange={(e) => handleSaveInspector({ title: e.target.value })}
              style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', padding: '10px 14px' }}
            />

            {/* Status & Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>STATUS</label>
                <select
                  className="neu-input"
                  value={selectedTask.status}
                  onChange={(e) => handleSaveInspector({ status: e.target.value })}
                  style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600' }}
                >
                  {COLUMNS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>PRIORITY</label>
                <select
                  className="neu-input"
                  value={selectedTask.priority}
                  onChange={(e) => handleSaveInspector({ priority: e.target.value })}
                  style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600' }}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee & Story Points Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>ASSIGNEE</label>
                <select
                  className="neu-input"
                  value={selectedTask.assignedUser ? selectedTask.assignedUser.username : ''}
                  onChange={(e) => {
                    const found = users.find(u => u.username === e.target.value);
                    handleSaveInspector({ assignedUser: found || null });
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.username}>@{u.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>STORY POINTS</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  className="neu-input"
                  value={selectedTask.storyPoints || 1}
                  onChange={(e) => handleSaveInspector({ storyPoints: Number(e.target.value) || 1 })}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Due Date & Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DUE DATE</label>
                <input
                  type="date"
                  className="neu-input"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => handleSaveInspector({ dueDate: e.target.value })}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>LABELS (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="Frontend, Bug, API"
                  value={selectedTask.labels || ''}
                  onChange={(e) => handleSaveInspector({ labels: e.target.value })}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Blocked Reason (If Blocked) */}
            {selectedTask.status === 'BLOCKED' && (
              <div style={{ marginBottom: '20px' }}>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px', color: '#e11d48' }}>
                  🚫 BLOCKER REASON
                </label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="Why is this issue blocked?"
                  value={selectedTask.blockedReason || ''}
                  onChange={(e) => handleSaveInspector({ blockedReason: e.target.value })}
                  style={{ borderLeft: '3px solid #e11d48', padding: '8px 12px' }}
                />
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
              <textarea
                className="neu-input"
                rows="4"
                placeholder="Add context, acceptance criteria, or technical details..."
                value={selectedTask.description || ''}
                onChange={(e) => handleSaveInspector({ description: e.target.value })}
                style={{ resize: 'vertical', fontSize: '13px', lineHeight: '1.5' }}
              />
            </div>

            {/* Linked Chat Channel Integration */}
            <div className="neu-panel-inset" style={{ padding: '14px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-text)' }}>
                  💬 Linked Chat Context
                </div>
                <div style={{ fontSize: '11px', color: 'var(--neu-muted)', marginTop: '2px' }}>
                  Channel: #{selectedTask.linkedChannel || 'Global'}
                </div>
              </div>
              <button
                className="neu-btn neu-btn-pill neu-btn-primary"
                style={{ padding: '6px 14px', fontSize: '11px' }}
                onClick={() => navigate('/chat')}
              >
                Open in Chat
              </button>
            </div>

            {/* Subtask Checklist */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="neu-subtitle">SUBTASK CHECKLIST</span>
                {(() => {
                  const stList = parseSubtasks(selectedTask.subtasks);
                  const completed = stList.filter(s => s.completed).length;
                  return stList.length > 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--neu-accent)', fontWeight: 'bold' }}>
                      {completed} of {stList.length} completed
                    </span>
                  ) : null;
                })()}
              </div>

              {/* Subtasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                {parseSubtasks(selectedTask.subtasks).map(st => (
                  <div key={st.id} className="neu-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st.id)}
                      style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: '13px',
                      textDecoration: st.completed ? 'line-through' : 'none',
                      color: st.completed ? 'var(--neu-muted)' : 'var(--neu-text)'
                    }}>
                      {st.title}
                    </span>
                    <button
                      className="neu-btn neu-btn-icon"
                      style={{ width: '22px', height: '22px', fontSize: '10px', opacity: 0.6 }}
                      onClick={() => handleDeleteSubtask(st.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subtask Input */}
              <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="+ Add item to checklist..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                />
                <button type="submit" className="neu-btn neu-btn-pill" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  Add
                </button>
              </form>
            </div>

            {/* Comments Stream */}
            <div style={{ marginBottom: '16px' }}>
              <span className="neu-subtitle" style={{ display: 'block', marginBottom: '10px' }}>ACTIVITY & COMMENTS</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {parseComments(selectedTask.comments).map(c => (
                  <div key={c.id} className="neu-panel-inset" style={{ padding: '10px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--neu-text)' }}>@{c.author}</span>
                      <span style={{ fontSize: '10px', color: 'var(--neu-muted)' }}>{c.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--neu-text)', lineHeight: '1.4' }}>
                      {c.text}
                    </div>
                  </div>
                ))}

                {parseComments(selectedTask.comments).length === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--neu-muted)', textAlign: 'center', padding: '12px' }}>
                    No comments yet. Start the conversation!
                  </div>
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                />
                <button type="submit" className="neu-btn neu-btn-pill neu-btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                  Post
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          CREATE ISSUE MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div
          onClick={() => setIsCreateModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 6, 12, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-panel"
            style={{ width: '500px', maxWidth: '92vw', padding: '32px', borderRadius: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="neu-title" style={{ fontSize: '20px' }}>Create New Issue</h2>
              <button
                className="neu-btn neu-btn-icon"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>
                  ISSUE TITLE <span style={{ color: 'var(--neu-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="neu-input"
                  placeholder="e.g. Implement WebSocket Heartbeat Reconnect"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea
                  className="neu-input"
                  rows="3"
                  placeholder="Provide technical context, steps, or requirements..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ resize: 'vertical', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>STATUS</label>
                  <select
                    className="neu-input"
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>PRIORITY</label>
                  <select
                    className="neu-input"
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>ASSIGNEE</label>
                  <select
                    className="neu-input"
                    value={createForm.assignedUsername}
                    onChange={(e) => setCreateForm({ ...createForm, assignedUsername: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.username}>@{u.username}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>STORY POINTS</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    className="neu-input"
                    value={createForm.storyPoints}
                    onChange={(e) => setCreateForm({ ...createForm, storyPoints: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>DUE DATE</label>
                  <input
                    type="date"
                    className="neu-input"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '6px' }}>LABELS</label>
                  <input
                    type="text"
                    className="neu-input"
                    placeholder="Frontend, Bug, API"
                    value={createForm.labels}
                    onChange={(e) => setCreateForm({ ...createForm, labels: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="neu-btn neu-btn-pill"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn neu-btn-pill neu-btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TaskBoard;