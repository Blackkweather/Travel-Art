import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'
import { useAuthStore } from '@/store/authStore'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { t } from '@/i18n'

/**
 * Header for the signed-in shell. It renders inside Layout, alongside Sidebar,
 * which already carries the account navigation - so this bar deliberately
 * carries only the public-facing links and the account actions. It used to
 * repeat six marketing links that the sidebar also listed.
 *
 * Both the desktop nav and the mobile panel used to be wrapped in `{user && …}`.
 * Layout returns null without a user, so that condition was always true here,
 * but it also meant the signed-out branch of this component rendered a bar with
 * no navigation at all if it were ever mounted outside Layout. The links are
 * unconditional now and the account actions are what varies.
 */

const NAV_ITEMS = [
  { to: '/experiences', label: t('Expériences') },
  { to: '/top-artists', label: t('Artistes') },
  { to: '/top-hotels', label: t('Hôtels') },
  { to: '/how-it-works', label: t('Le principe') },
]

const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { pathname } = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // A route change should never leave the panel hanging open behind the page.
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    // Only ever on an explicit user action - never automatically. No
    // confirmation: signing out costs one sign-in to undo, and a native dialog
    // in front of it was friction on the one action people take deliberately.
    logout()
    window.location.href = '/'
  }

  const linkClass =
    'text-sm font-medium text-content transition-colors duration-300 relative group'

  const underline = (active: boolean) =>
    `absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300 ${
      active ? 'w-full' : 'w-0 group-hover:w-full'
    }`

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          headerScrolled || isMobileMenuOpen
            ? 'bg-surface-raised/95 backdrop-blur-md border-b border-line'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Link
              to={user ? '/dashboard' : '/'}
              className="shrink-0 hover:opacity-80 transition-opacity duration-300"
              aria-label="Travel Art, accueil"
            >
              {/* The mark is navy and gold, which disappears against the dark
                  surface. It inverts only in dark mode - inverting it in light
                  mode would render it white on white. */}
              <img decoding="async"
                src={getLogoUrl('transparent')}
                alt="Travel Art"
                className="h-8 md:h-9 w-auto object-contain dark:brightness-0 dark:invert"
              />
            </Link>

            <nav className="hidden lg:flex gap-8" aria-label="Navigation principale">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={pathname === item.to ? 'page' : undefined}
                  className={linkClass}
                >
                  {item.label}
                  <span className={underline(pathname === item.to)} />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <LanguageSwitcher />
            {user ? (
              <>
                <Link to="/dashboard" className={`${linkClass} hidden sm:block`}>
                  {t('Tableau de bord')}
                  <span className={underline(pathname === '/dashboard')} />
                </Link>
                <button onClick={handleLogout} className="btn-gold btn-sm" data-testid="user-menu">
                  {t('Déconnexion')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${linkClass} hidden sm:block`}>
                  Connexion
                  <span className={underline(pathname === '/login')} />
                </Link>
                <Link to="/register" className="btn-gold btn-sm">
                  {t('Nous rejoindre')}
                </Link>
              </>
            )}

            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="lg:hidden text-content hover:text-gold transition-colors p-1"
              aria-expanded={isMobileMenuOpen}
              aria-controls="header-mobile-nav"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              data-testid="mobile-menu-toggle"
            >
              {isMobileMenuOpen
                ? <X size={22} strokeWidth={1.5} aria-hidden="true" />
                : <Menu size={22} strokeWidth={1.5} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <motion.nav
          id="header-mobile-nav"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          aria-label="Navigation principale"
          /* This was pinned to top-[88px] while the bar is 72px tall, leaving a
             16px strip of the page showing through between the two. */
          className="fixed top-[72px] left-0 right-0 z-40 lg:hidden border-b border-line bg-surface-raised/98 backdrop-blur-md"
          data-testid="mobile-menu"
        >
          <ul className="px-6 py-4 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="border-b border-line/60 last:border-0">
                <Link
                  to={item.to}
                  aria-current={pathname === item.to ? 'page' : undefined}
                  className="block py-4 font-serif text-2xl text-content hover:text-gold transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-5">
              <LanguageSwitcher compact />
            </li>
            <li className="pt-5 sm:hidden">
              {user ? (
                <Link to="/dashboard" className="text-sm font-medium text-content-secondary hover:text-content">
                  {t('Tableau de bord')}
                </Link>
              ) : (
                <Link to="/login" className="text-sm font-medium text-content-secondary hover:text-content">
                  {t('Connexion')}
                </Link>
              )}
            </li>
          </ul>
        </motion.nav>
      )}
    </>
  )
}

export default Header
