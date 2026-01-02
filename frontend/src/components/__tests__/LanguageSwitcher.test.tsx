import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';
import i18n from '@/utils/i18n';

// Mock i18n
vi.mock('@/utils/i18n', () => ({
  default: {
    getLanguage: vi.fn(() => 'en'),
    setLanguage: vi.fn(),
    getSupportedLanguages: vi.fn(() => [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'es', name: 'Español' },
    ]),
  },
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByLabelText(/change language/i)).toBeInTheDocument();
  });

  it('displays current language', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByLabelText(/change language/i);
    fireEvent.click(button);
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('changes language when option is selected', () => {
    const setLanguageSpy = vi.fn();
    (i18n.setLanguage as any) = setLanguageSpy;
    
    render(<LanguageSwitcher />);
    const button = screen.getByLabelText(/change language/i);
    fireEvent.click(button);
    
    const frenchOption = screen.getByText('Français');
    fireEvent.click(frenchOption);
    
    expect(setLanguageSpy).toHaveBeenCalledWith('fr');
  });
});





