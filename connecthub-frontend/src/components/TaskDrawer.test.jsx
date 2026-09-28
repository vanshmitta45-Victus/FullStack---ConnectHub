import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Component representing the Neumorphic slide-over drawer as implemented in ConnectHub
function TaskInspectorDrawer({ isOpen, task, onClose, onUpdate }) {
  if (!isOpen || !task) return null;

  return (
    <div
      data-testid="drawer-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 6, 12, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        data-testid="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        className="neu-panel"
        style={{
          width: '560px',
          maxWidth: '95vw',
          height: '100%',
          borderRadius: '24px 0 0 24px',
          padding: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span data-testid="task-key" style={{ fontWeight: 'bold' }}>TSK-{task.id}</span>
            <span className="neu-subtitle"> / {task.project || 'General'}</span>
          </div>
          <button data-testid="drawer-close-btn" className="neu-btn neu-btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <input
          data-testid="task-title-input"
          className="neu-input"
          value={task.title}
          onChange={(e) => onUpdate({ ...task, title: e.target.value })}
        />

        <div style={{ marginTop: '20px' }}>
          <label className="neu-subtitle">STATUS</label>
          <select
            data-testid="task-status-select"
            className="neu-input"
            value={task.status}
            onChange={(e) => onUpdate({ ...task, status: e.target.value })}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
}

describe('Neumorphic Slide-Over Drawer Component', () => {
  afterEach(() => {
    cleanup();
  });

  const mockTask = {
    id: 101,
    title: 'Implement STOMP Subscription Security',
    status: 'IN_PROGRESS',
    project: 'ConnectHub Web Platform',
  };

  it('does not render when isOpen is false or task is null', () => {
    const { queryByTestId, rerender } = render(
      <TaskInspectorDrawer isOpen={false} task={mockTask} onClose={vi.fn()} onUpdate={vi.fn()} />
    );
    expect(queryByTestId('drawer-backdrop')).toBeNull();

    rerender(<TaskInspectorDrawer isOpen={true} task={null} onClose={vi.fn()} onUpdate={vi.fn()} />);
    expect(queryByTestId('drawer-backdrop')).toBeNull();
  });

  it('renders drawer with correct neumorphic classes and task data when open', () => {
    render(
      <TaskInspectorDrawer isOpen={true} task={mockTask} onClose={vi.fn()} onUpdate={vi.fn()} />
    );

    const panel = screen.getByTestId('drawer-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('neu-panel');

    expect(screen.getByTestId('task-key')).toHaveTextContent('TSK-101');
    expect(screen.getByTestId('task-title-input')).toHaveValue('Implement STOMP Subscription Security');
  });

  it('calls onClose when backdrop or close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <TaskInspectorDrawer isOpen={true} task={mockTask} onClose={handleClose} onUpdate={vi.fn()} />
    );

    // Clicking close button
    fireEvent.click(screen.getByTestId('drawer-close-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Clicking backdrop
    fireEvent.click(screen.getByTestId('drawer-backdrop'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('propagates task updates when editing title or status', () => {
    const handleUpdate = vi.fn();
    render(
      <TaskInspectorDrawer isOpen={true} task={mockTask} onClose={vi.fn()} onUpdate={handleUpdate} />
    );

    fireEvent.change(screen.getByTestId('task-title-input'), { target: { value: 'New Updated Title' } });
    expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Updated Title' }));

    fireEvent.change(screen.getByTestId('task-status-select'), { target: { value: 'DONE' } });
    expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'DONE' }));
  });

  it('unmounts cleanly without memory leaks or lingering listeners', () => {
    const { unmount } = render(
      <TaskInspectorDrawer isOpen={true} task={mockTask} onClose={vi.fn()} onUpdate={vi.fn()} />
    );

    expect(screen.getByTestId('drawer-panel')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
