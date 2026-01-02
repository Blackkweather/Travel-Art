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
  }
}

export function getDefaultOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Travel Art',
    description: 'Luxury hotel and artist exchange platform connecting talented artists with premium hospitality venues.',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://travelart.com',
    logo: typeof window !== 'undefined' ? `${window.location.origin}/logo-1-final.png` : 'https://travelart.com/logo-1-final.png',
    sameAs: [
      // Add social media links here if available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
    },
  }
}
