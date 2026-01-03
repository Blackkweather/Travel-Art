import { useState, useEffect } from 'react';

/**
 * Dark mode hook
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // Check localStorage
    const stored = localStorage.getItem('dark-mode');
    if (stored !== null) {
      return stored === 'true';
    }
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Store preference
    localStorage.setItem('dark-mode', String(isDark));
  }, [isDark]);

  const toggle = () => setIsDark(!isDark);
  const enable = () => setIsDark(true);
  const disable = () => setIsDark(false);

  return {
    isDark,
    toggle,
    enable,
    disable,
  };
};







