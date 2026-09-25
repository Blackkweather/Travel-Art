import { t } from '@/i18n'
export interface OrganizationSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  logo?: string
  sameAs?: string[]
  contactPoint?: {
    '@type': string
    telephone?: string
    contactType?: string
    email?: string
    availableLanguage?: string
  }
}

export function getDefaultOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Travel Art',
    description: t('Travel Art réunit les hôtels d’exception et les artistes : résidences, concerts et expositions au sein de lieux d’accueil d’exception.'),
    url: typeof window !== 'undefined' ? window.location.origin : 'https://travelart.com',
    logo: typeof window !== 'undefined' ? `${window.location.origin}/logo-1-final.png` : 'https://travelart.com/logo-1-final.png',
    sameAs: [
      // Add social media links here if available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Service client',
      availableLanguage: 'French',
    },
  }
}
