import { useEffect, useRef } from 'react';

/**
 * Optimized scroll handler using requestAnimationFrame
 * Prevents performance issues from frequent scroll events
 */
export function useOptimizedScroll(
  callback: (scrollY: number) => void,
  dependencies: any[] = []
) {
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          
          // Only call callback if scroll position actually changed
          if (scrollY !== lastScrollY.current) {
            lastScrollY.current = scrollY;
            callback(scrollY);
          }
          
          rafId.current = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, dependencies);
}






