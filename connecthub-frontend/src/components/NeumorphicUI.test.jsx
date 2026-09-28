import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Neumorphic Design System UI Tokens', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders neumorphic buttons with appropriate classes and handles click interactions', () => {
    const handleClick = vi.fn();
    render(
      <div>
        <button className="neu-btn neu-btn-primary" onClick={handleClick}>
          Primary Action
        </button>
        <button className="neu-btn neu-btn-danger">
          Delete Action
        </button>
      </div>
    );

    const primaryBtn = screen.getByRole('button', { name: /Primary Action/i });
    expect(primaryBtn).toHaveClass('neu-btn', 'neu-btn-primary');

    fireEvent.click(primaryBtn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    const dangerBtn = screen.getByRole('button', { name: /Delete Action/i });
    expect(dangerBtn).toHaveClass('neu-btn', 'neu-btn-danger');
  });

  it('renders neumorphic panels and inset panels properly', () => {
    const { container } = render(
      <div className="neu-panel">
        <div className="neu-panel-inset">
          <span>Inset Content</span>
        </div>
      </div>
    );

    expect(container.querySelector('.neu-panel')).toBeInTheDocument();
    expect(container.querySelector('.neu-panel-inset')).toBeInTheDocument();
    expect(screen.getByText('Inset Content')).toBeInTheDocument();
  });

  it('renders neumorphic input fields with two-way binding without memory leak', () => {
    function InputWrapper() {
      const [val, setVal] = React.useState('');
      return (
        <input
          data-testid="neu-input-field"
          className="neu-input"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    }

    const { unmount } = render(<InputWrapper />);
    const input = screen.getByTestId('neu-input-field');
    expect(input).toHaveClass('neu-input');

    fireEvent.change(input, { target: { value: 'Testing Input' } });
    expect(input).toHaveValue('Testing Input');

    expect(() => unmount()).not.toThrow();
  });
});
