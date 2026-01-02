/**
 * Internationalization (i18n) utilities
 * Basic i18n implementation ready for react-i18next integration
 */

export type SupportedLanguage = 'en' | 'fr' | 'es' | 'de' | 'it';

export interface Translations {
  [key: string]: string | Translations;
}

// Basic translations structure
const translations: Record<SupportedLanguage, Translations> = {
  en: {
    common: {
      welcome: 'Welcome',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    nav: {
      home: 'Home',
      artists: 'Artists',
      hotels: 'Hotels',
      experiences: 'Experiences',
      howItWorks: 'How It Works',
    },
  },
  fr: {
    common: {
      welcome: 'Bienvenue',
      login: 'Connexion',
      register: "S'inscrire",
      logout: 'Déconnexion',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      search: 'Rechercher',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
    },
    nav: {
      home: 'Accueil',
      artists: 'Artistes',
      hotels: 'Hôtels',
      experiences: 'Expériences',
      howItWorks: 'Comment ça marche',
    },
  },
  es: {
    common: {
      welcome: 'Bienvenido',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      logout: 'Cerrar sesión',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      search: 'Buscar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
    },
    nav: {
      home: 'Inicio',
      artists: 'Artistas',
      hotels: 'Hoteles',
      experiences: 'Experiencias',
      howItWorks: 'Cómo funciona',
    },
  },
  de: {
    common: {
      welcome: 'Willkommen',
      login: 'Anmelden',
      register: 'Registrieren',
      logout: 'Abmelden',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      search: 'Suchen',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
    },
    nav: {
      home: 'Startseite',
      artists: 'Künstler',
      hotels: 'Hotels',
      experiences: 'Erlebnisse',
      howItWorks: 'Wie es funktioniert',
    },
  },
  it: {
    common: {
      welcome: 'Benvenuto',
      login: 'Accedi',
      register: 'Registrati',
      logout: 'Esci',
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      search: 'Cerca',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
    },
    nav: {
      home: 'Home',
      artists: 'Artisti',
      hotels: 'Hotel',
      experiences: 'Esperienze',
      howItWorks: 'Come funziona',
    },
  },
};

class I18n {
  private currentLanguage: SupportedLanguage = 'en';
  private translations: Record<SupportedLanguage, Translations> = translations;

  /**
   * Set current language
   */
  setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', lang);
      document.documentElement.lang = lang;
    }
  }

  /**
   * Get current language
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Detect user's preferred language
   */
  detectLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') return 'en';

    // Check localStorage first
    const stored = localStorage.getItem('preferred-language') as SupportedLanguage;
    if (stored && this.isSupportedLanguage(stored)) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
    if (this.isSupportedLanguage(browserLang)) {
      return browserLang;
    }

    return 'en';
  }

  /**
   * Check if language is supported
   */
  isSupportedLanguage(lang: string): lang is SupportedLanguage {
    return ['en', 'fr', 'es', 'de', 'it'].includes(lang);
  }

  /**
   * Get translation by key path (e.g., 'common.welcome')
   */
  t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = this.translations.en;
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value;
  }

  /**
   * Initialize i18n
   */
  init() {
    const detectedLang = this.detectLanguage();
    this.setLanguage(detectedLang);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'es', name: 'Español' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
    ];
  }
}

// Singleton instance
export const i18n = new I18n();

// Initialize on load
if (typeof window !== 'undefined') {
  i18n.init();
}

export default i18n;





