// Artist Registration Form Types

export interface BasicInfo {
  stageName: string;
  birthDate: string;
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  agreeToTerms: boolean;
}

export interface ArtisticCategory {
  mainCategory: string;
  secondaryCategory?: string;
  audienceType: string[];
  languages: string[];
}

export interface SubcategoryInfo {
  categoryType: string;
  specificCategory: string;
  domain: string;
}

export interface MediaRequirements {
  profileImageUrl: string;
  travelInstruments: string[];
  performanceLinks: string[];
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export interface ArtistRegistrationData {
  step: number;
  basicInfo: BasicInfo;
  artisticCategory: ArtisticCategory;
  subcategory: SubcategoryInfo;
  media: MediaRequirements;
}

// Category Options
export const MAIN_CATEGORIES = [
  { value: 'Musique', label: 'Musique (Music)' },
  { value: 'Visuel', label: 'Visuel (Visual)' },
  { value: 'Arts & craft', label: 'Arts & craft' },
  { value: 'Cirque', label: 'Cirque (Circus)' },
  { value: 'Magie', label: 'Magie (Magic)' },
  { value: 'Humour', label: 'Humour (Humor)' },
  { value: 'Danse', label: 'Danse (Dance)' },
  { value: 'Famille', label: 'Famille (Family)' },
  { value: 'Lifestyle', label: 'Lifestyle' }
];

export const AUDIENCE_TYPES = [
  { value: 'Adultes', label: 'Adultes (Adults)' },
  { value: 'Familles', label: 'Familles (Families)' }
];

export const LANGUAGES = [
  { value: 'Français', label: 'Français' },
  { value: 'English', label: 'English' },
  { value: 'Autre', label: 'Autre (Other)' }
];

// Subcategory mapping by main category
export const SUBCATEGORY_MAP: Record<string, Record<string, string[]>> = {
  'Musique': {
    'Tribu Artistique': [],
    'Performer': ['Saxophone', 'Chant', 'Flûte', 'Piano', 'Guitare', 'Basse', 'Contrebasse', 'Violon', 'Trompette', 'Batterie', 'Harmonica'],
    'DJ': ['DJ & Saxophone', 'DJ Live'],
    'Solo': ['Chant', 'Guitare - voix', 'Piano-voix'],
    'Groupe de musique': ['Duo', 'Trio', 'Quartet', 'Quintet'],
    'Univers Artistique': ['Arts & craft', 'Cirque', 'Magie', 'Humour', 'Danse']
  },
  'Visuel': {
    'Arts & craft': ['Street-art / Graphe', 'Design', 'Dessin / Calligraphie', 'Sculpture', 'Peinture', 'Photographie', 'Arts plastiques'],
    'Visuel': ['Street-art / Graphe', 'Design', 'Dessin / Calligraphie', 'Sculpture', 'Peinture', 'Photographie', 'Arts plastiques']
  },
  'Cirque': {
    'Cirque': ['Acrobatie', 'Jonglage', 'Equilibre', 'Mât chinois', 'Aérien / Tissu']
  },
  'Magie': {
    'Magie': ['Happening / Close-up', 'Spectacle / Close-up', 'Spectacle', 'Mentalisme']
  },
  'Humour': {
    'Humour': ['Visuel & Mime', 'Stand-up / One-man']
  },
  'Danse': {
    'Danse': ['Salon', 'Salsa / Bachata', 'Hip-Hop', 'Moderne jazz']
  },
  'Famille': {
    'Magie pour enfants': ['Spectacle', 'Close-up', 'Initiation'],
    'Sculpture de bulles': ['Spectacle', 'Happening'],
    'Conte': ['Conte', 'Poésie'],
    'Chant': ['Atelier éveil musical', 'Mini-concert enfants'],
    'Arts & craft Famille': ['Arts plastiques', 'Dessin', 'Ateliers parents-enfants']
  },
  'Arts & craft': {
    'Arts & craft': ['Street-art / Graphe', 'Design', 'Dessin / Calligraphie', 'Sculpture', 'Peinture', 'Photographie', 'Arts plastiques']
  },
  'Lifestyle': {
    'Lifestyle': []
  }
};

// Countries list (simplified - expand as needed)
export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic',
  'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea',
  'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
  'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
  'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

// Validation patterns
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  password: /^(?=.*[A-Z])(?=.*\d)[A-Z\d]{2,}$/,
  date: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/
};

export const PASSWORD_REQUIREMENTS = {
  minLength: 2,
  uppercase: true,
  lowercase: false,
  numbers: true,
  special: false
};
