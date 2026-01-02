import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSkeleton from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders without crashing', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
  });

  it('renders with rectangular variant by default', () => {
    const { container } = render(<LoadingSkeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded');
  });

  it('renders circular variant', () => {
    const { container } = render(<LoadingSkeleton variant="circular" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('renders text variant', () => {
    const { container } = render(<LoadingSkeleton variant="text" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-4');
  });

  it('renders multiple text lines', () => {
    const { container } = render(<LoadingSkeleton variant="text" lines={3} />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('applies custom width and height', () => {
    const { container } = render(
      <LoadingSkeleton width={200} height={100} />
    );
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('100px');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSkeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
  });
});
