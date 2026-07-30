import React from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Linkedin, Facebook } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'
import NewsletterSignup from './NewsletterSignup'

const DISCOVER_LINKS = [
  { to: '/experiences', label: 'Experiences' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/top-artists', label: 'Artists' },
  { to: '/top-hotels', label: 'Hotels' },
]

const COMPANY_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/partners', label: 'Partners' },
  { to: '/pricing', label: 'Pricing' },
]

const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
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
    <footer className="bg-[#08101D] border-t border-white/10">
      <div className="shell py-20">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-14">
          <div className="col-span-2 lg:col-span-4">
            <img
              src={getLogoUrl('transparent')}
              alt="Travel Art"
              className="h-9 w-auto object-contain brightness-0 invert"
            />
            <p className="mt-6 text-white/55 leading-relaxed max-w-[38ch]">
              Artist residencies inside luxury hotels. Musicians, visual artists
              and performers, hosted where their work belongs.
            </p>

            <div className="mt-8 max-w-sm">
              <NewsletterSignup variant="inline" />
            </div>
          </div>

          <nav className="lg:col-span-2 lg:col-start-6" aria-label="Discover">
            <h3 className="font-sans text-sm font-semibold text-white mb-5">Discover</h3>
            <ul className="space-y-3">
              {DISCOVER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/55 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-2" aria-label="Company">
            <h3 className="font-sans text-sm font-semibold text-white mb-5">Company</h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/55 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h3 className="font-sans text-sm font-semibold text-white mb-5">Contact</h3>
            <ul className="space-y-3 text-sm text-white/55">
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
                    className="text-white/45 hover:text-gold transition-colors inline-block"
                  >
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Travel Art
          </p>
          <ul className="flex flex-wrap gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/40 hover:text-gold transition-colors">
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
