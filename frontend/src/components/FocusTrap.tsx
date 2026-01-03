import { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  returnFocusOnDeactivate?: boolean;
  initialFocus?: string | HTMLElement;
}

/**
 * Focus trap component for modals and dialogs
 * Ensures keyboard navigation stays within the component
 */
const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  returnFocusOnDeactivate = true,
  initialFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(
        containerRef.current!.querySelectorAll(focusableSelectors)
      ) as HTMLElement[];
    };

    // Focus initial element or first focusable element
    const focusInitial = () => {
      let elementToFocus: HTMLElement | null = null;

      if (initialFocus) {
        if (typeof initialFocus === 'string') {
          elementToFocus = containerRef.current!.querySelector(initialFocus) as HTMLElement;
        } else {
          elementToFocus = initialFocus;
        }
      }

      if (!elementToFocus) {
        const focusableElements = getFocusableElements();
        elementToFocus = focusableElements[0] || null;
      }

      if (elementToFocus) {
        elementToFocus.focus();
      }
    };

    // Handle Tab key navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement || !containerRef.current!.contains(activeElement)) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        // Tab
        if (activeElement === lastElement || !containerRef.current!.contains(activeElement)) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    // Focus initial element after a short delay to ensure DOM is ready
    setTimeout(focusInitial, 0);

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (returnFocusOnDeactivate && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, returnFocusOnDeactivate, initialFocus]);

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  );
};

export default FocusTrap;







