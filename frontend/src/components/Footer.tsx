import React from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Linkedin, Facebook } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'
import NewsletterSignup from './NewsletterSignup'
import { t } from '@/i18n'

const DISCOVER_LINKS = [
  { to: '/experiences', label: t('Expériences') },
  { to: '/how-it-works', label: t('Le principe') },
  { to: '/top-artists', label: t('Artistes') },
  { to: '/top-hotels', label: t('Hôtels') },
]

const COMPANY_LINKS = [
  { to: '/about', label: t('À propos') },
  { to: '/partners', label: t('Partenaires') },
]

const LEGAL_LINKS = [
  { to: '/privacy', label: t('Confidentialité') },
  { to: '/terms', label: 'Conditions' },
  { to: '/cookies', label: 'Cookies' },
]

const SOCIALS = [
  { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
  { href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
]

/**
 * Site footer. The logo previously rendered at h-36 (144px), dominating every
 * page; it now matches the navigation at h-9.
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--surface-inverse)] text-[var(--text-on-inverse)] border-t border-line">
      <div className="shell py-20">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-14">
          <div className="col-span-2 lg:col-span-4">
            <img decoding="async"
              src={getLogoUrl('transparent')}
              alt="Travel Art"
              className="h-9 w-auto object-contain brightness-0 invert dark:brightness-100 dark:invert-0"
            />
            <p className="mt-6 text-content-inverse/60 leading-relaxed max-w-[38ch]">
              {t('Des résidences d’artistes au cœur des hôtels d’exception. Musiciens, plasticiens et interprètes, reçus là où leur travail trouve sa place.')}
            </p>

            <div className="mt-8 max-w-sm">
              <NewsletterSignup variant="inline" />
            </div>
          </div>

          <nav className="lg:col-span-2 lg:col-start-6" aria-label={t('Découvrir')}>
            <h3 className="font-sans text-sm font-semibold text-[var(--text-on-inverse)] mb-5">{t('Découvrir')}</h3>
            <ul className="space-y-3">
              {DISCOVER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-content-inverse/60 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-2" aria-label={t('La maison')}>
            <h3 className="font-sans text-sm font-semibold text-[var(--text-on-inverse)] mb-5">{t('La maison')}</h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-content-inverse/60 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h3 className="font-sans text-sm font-semibold text-[var(--text-on-inverse)] mb-5">Contact</h3>
            <ul className="space-y-3 text-sm text-content-inverse/60">
              <li>Paris, France</li>
              <li>
                <a href="mailto:hello@travelart.com" className="hover:text-gold transition-colors">
                  hello@travelart.com
                </a>
              </li>
            </ul>

            <ul className="flex gap-5 mt-8">
              {SOCIALS.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-content-inverse/50 hover:text-gold transition-colors inline-block"
                  >
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-content-inverse/15 mt-16 pt-8 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-sm text-content-inverse/50">
            &copy; {new Date().getFullYear()} Travel Art
          </p>
          <ul className="flex flex-wrap gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-content-inverse/50 hover:text-gold transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
