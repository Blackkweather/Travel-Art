// Artist Registration Types and Constants

export type ArtisticCategory = 
  | 'Musique'
  | 'Visuel'
  | 'Cirque'
  | 'Danse'
  | 'Théâtre'
  | 'Littérature'
  | 'Cinéma'
  | 'Photographie'
  | 'Autres';

export type AudienceType = 'Adultes' | 'Familles' | 'Enfants' | 'Tous publics';

export type Language = 'Français' | 'English' | 'Español' | 'Deutsch' | 'Italiano' | 'Autre';

export interface RegistrationFormData {
  // Authentication
  email: string;
  password: string;
  confirmPassword: string;
  role: 'ARTIST';

  // Personal Information
  firstName: string;
  lastName: string;
  stageName: string;
  birthDate: string; // DD/MM/YYYY
  phone: string;
  country: string;

  // Artistic Information
  mainCategory: ArtisticCategory;
  secondaryCategory?: ArtisticCategory;
  audienceType: AudienceType[];
  languages: Language[];
  categoryType: string;
  specificCategory: string;
  domain: string;

  // Legal
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Category hierarchy mapping
export const CATEGORY_HIERARCHY: Record<ArtisticCategory, { subcategories: string[]; domains: string[] }> = {
  'Musique': {
    subcategories: [
      'Classique',
      'Jazz',
      'Pop/Rock',
      'Électronique',
      'Traditionnelle',
      'Fusion',
      'Autres'
    ],
    domains: [
      'Instrumentiste',
      'Chanteur',
      'Compositeur',
      'Producteur'
    ]
  },
  'Visuel': {
    subcategories: [
      'Peinture',
      'Sculpture',
      'Installations',
      'Art Numérique',
      'Graffiti',
      'Autres'
    ],
    domains: [
      'Contemporain',
      'Classique',
      'Moderne',
      'Expérimental'
    ]
  },
  'Cirque': {
    subcategories: [
      'Acrobatie',
      'Jonglerie',
      'Équilibre',
      'Voltige',
      'Clownerie',
      'Autres'
    ],
    domains: [
      'Traditionnel',
      'Contemporain',
      'Hybride'
    ]
  },
  'Danse': {
    subcategories: [
      'Classique',
      'Contemporain',
      'Hip-Hop',
      'Latin',
      'Orientale',
      'Traditionnelle',
      'Autres'
    ],
    domains: [
      'Solo',
      'Ensemble',
      'Chorégraphe',
      'Professeur'
    ]
  },
  'Théâtre': {
    subcategories: [
      'Classique',
      'Moderne',
      'Expérimental',
      'Comédie',
      'Drame',
      'Improvisation',
      'Autres'
    ],
    domains: [
      'Acteur',
      'Metteur en scène',
      'Dramaturge',
      'Auteur'
    ]
  },
  'Littérature': {
    subcategories: [
      'Poésie',
      'Roman',
      'Nouvelle',
      'Essai',
      'Jeunesse',
      'Slam',
      'Autres'
    ],
    domains: [
      'Auteur',
      'Lecteur',
      'Critique',
      'Éditeur'
    ]
  },
  'Cinéma': {
    subcategories: [
      'Réalisation',
      'Scénario',
      'Cinématographie',
      'Montage',
      'Son',
      'Animation',
      'Autres'
    ],
    domains: [
      'Documentaire',
      'Fiction',
      'Court métrage',
      'Long métrage'
    ]
  },
  'Photographie': {
    subcategories: [
      'Portrait',
      'Paysage',
      'Reportage',
      'Mode',
      'Nature',
      'Abstrait',
      'Autres'
    ],
    domains: [
      'Analogique',
      'Numérique',
      'Hybride',
      'Expérimental'
    ]
  },
  'Autres': {
    subcategories: [
      'À spécifier'
    ],
    domains: [
      'Spécialité personnalisée'
    ]
  }
};

// Countries list (common countries)
export const COUNTRIES = [
  'France',
  'Belgique',
  'Suisse',
  'Canada',
  'Québec',
  'Luxembourg',
  'Espagne',
  'Italie',
  'Allemagne',
  'Autres'
];

// Initial form state
export const INITIAL_FORM_DATA: RegistrationFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  role: 'ARTIST',
  firstName: '',
  lastName: '',
  stageName: '',
  birthDate: '',
  phone: '',
  country: '',
  mainCategory: 'Musique',
  secondaryCategory: undefined,
  audienceType: [],
  languages: [],
  categoryType: '',
  specificCategory: '',
  domain: '',
  termsAccepted: false,
  privacyAccepted: false
};

// Audience types
export const AUDIENCE_TYPES: AudienceType[] = [
  'Adultes',
  'Familles',
  'Enfants',
  'Tous publics'
];

// Languages
export const LANGUAGES: Language[] = [
  'Français',
  'English',
  'Español',
  'Deutsch',
  'Italiano',
  'Autre'
];
