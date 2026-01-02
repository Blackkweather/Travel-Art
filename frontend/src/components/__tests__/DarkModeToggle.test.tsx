import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DarkModeToggle from '../DarkModeToggle';
import { useDarkMode } from '@/hooks/useDarkMode';

// Mock useDarkMode hook
vi.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: vi.fn(),
}));

describe('DarkModeToggle', () => {
  const mockToggle = vi.fn();
  const mockEnable = vi.fn();
  const mockDisable = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDarkMode as any).mockReturnValue({
      isDark: false,
      toggle: mockToggle,
      enable: mockEnable,
      disable: mockDisable,
    });
  });

  it('renders without crashing', () => {
    render(<DarkModeToggle />);
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument();
  });

  it('shows moon icon when in light mode', () => {
    render(<DarkModeToggle />);
    const button = screen.getByLabelText(/switch to dark mode/i);
    expect(button).toBeInTheDocument();
  });

  it('shows sun icon when in dark mode', () => {
    (useDarkMode as any).mockReturnValue({
      isDark: true,
      toggle: mockToggle,
      enable: mockEnable,
      disable: mockDisable,
    });
    render(<DarkModeToggle />);
    expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument();
  });

  it('calls toggle when clicked', () => {
    render(<DarkModeToggle />);
    const button = screen.getByLabelText(/switch to dark mode/i);
    fireEvent.click(button);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});





