import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import i18n, { SupportedLanguage } from '@/utils/i18n';

/**
 * Language switcher component
 */
const LanguageSwitcher: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(i18n.getLanguage());
  const [isOpen, setIsOpen] = useState(false);

  const languages = i18n.getSupportedLanguages();

  useEffect(() => {
    setCurrentLang(i18n.getLanguage());
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.setLanguage(lang);
    setCurrentLang(lang);
    setIsOpen(false);
    // Reload page to apply language changes (or use context for reactive updates)
    window.location.reload();
  };

  const currentLanguageName = languages.find(l => l.code === currentLang)?.name || 'English';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguageName}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    currentLang === lang.code ? 'bg-gold/10 text-gold font-semibold' : ''
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;







