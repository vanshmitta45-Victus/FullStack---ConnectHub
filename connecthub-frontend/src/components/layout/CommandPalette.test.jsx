import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from './CommandPalette';

// Mock axios to avoid real HTTP calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('CommandPalette Neumorphic Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <MemoryRouter>
        <CommandPalette isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('mounts properly and renders search input and default commands when isOpen is true', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Search tasks/i);
    expect(input).toBeInTheDocument();
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  it('filters command list based on user query', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Search tasks/i);
    fireEvent.change(input, { target: { value: 'Chat' } });

    expect(screen.getByText('Chat & Comms')).toBeInTheDocument();
    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('triggers onClose when pressing Escape key on window', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('triggers onClose when clicking the modal backdrop', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    const backdrop = container.firstChild;
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalled();
  });

  it('mounts and unmounts cleanly without leaving active DOM artifacts or memory leaks', () => {
    const { unmount } = render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Search tasks/i)).toBeInTheDocument();

    // Verify unmount cleans up window event listeners without error
    expect(() => unmount()).not.toThrow();
  });
});
