import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'

const NAV_ITEMS = [
  { to: '/experiences', label: 'Expériences' },
  { to: '/top-artists', label: 'Artistes' },
  { to: '/top-hotels', label: 'Hôtels' },
  { to: '/how-it-works', label: 'Le principe' },
  { to: '/about', label: 'À propos' },
]

interface SimpleNavbarProps {
  /**
   * Set on pages whose first screen is a full-bleed image or video, where the
   * bar floats over the photograph. Everywhere else the bar is a solid light
   * surface.
   *
   * This exists because the bar used to be white-on-transparent unconditionally
   * while sixteen of the seventeen pages using it start on a light background -
   * so on all but the landing page the logo, every nav link and "Connexion"
   * were white text on a white page until the user happened to scroll. Making
   * the exception opt-in means the safe rendering is the default.
   */
  overMedia?: boolean
}

/**
 * Site navigation. Fixed at 72px: the logo previously scaled to h-28, which
 * made the bar taller than 110px and ate the top of every page.
 *
 * The desktop nav used to be `hidden md:flex` with no fallback, leaving mobile
 * visitors with no navigation at all. There is now a real menu.
 */
export default function SimpleNavbar({ overMedia = false }: SimpleNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Transparent-over-photography applies only at the very top of a media hero.
  // Once the page scrolls - or the mobile panel opens over the page - the bar
  // becomes the solid light surface, because what is behind it by then is the
  // light page, not the photograph.
  const onMedia = overMedia && !scrolled && !menuOpen

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // A route change should never leave the panel hanging open.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // While the panel covers the page, the page behind it must not scroll.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        onMedia
          ? 'bg-transparent'
          : 'bg-[var(--surface)]/95 backdrop-blur-md border-b border-line'
      }`}
    >
      <div className="shell h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Travel Art, accueil" className="shrink-0">
            <img
              src={getLogoUrl('transparent')}
              alt="Travel Art"
              className={`h-8 md:h-9 w-auto object-contain ${
                onMedia ? 'brightness-0 invert' : 'dark:brightness-0 dark:invert'
              }`}
            />
          </Link>

          <nav className="hidden lg:flex gap-8" aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={pathname === item.to ? 'page' : undefined}
                className={`text-sm font-medium whitespace-nowrap transition-colors duration-300 relative group ${
                  onMedia ? 'text-white/85 hover:text-white' : 'text-content hover:text-gold'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-px bg-gold transition-all duration-300 ${
                    pathname === item.to ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <Link
            to="/login"
            className={`hidden sm:block text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
              onMedia ? 'text-white/85 hover:text-white' : 'text-content hover:text-gold'
            }`}
          >
            Connexion
          </Link>
          <Link to="/register" className="btn-gold btn-sm">
            Nous rejoindre
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className={`lg:hidden p-1 ${onMedia ? 'text-white' : 'text-content'}`}
          >
            {menuOpen
              ? <X size={22} strokeWidth={1.5} aria-hidden="true" />
              : <Menu size={22} strokeWidth={1.5} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Principal"
          className="lg:hidden border-t border-line bg-[var(--surface)]"
        >
          <ul className="shell py-6 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="border-b border-line last:border-0">
                <Link
                  to={item.to}
                  aria-current={pathname === item.to ? 'page' : undefined}
                  className="block py-4 font-serif text-2xl text-content hover:text-gold transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-5 sm:hidden">
              <Link to="/login" className="text-sm font-medium text-content-secondary hover:text-gold">
                Connexion
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
