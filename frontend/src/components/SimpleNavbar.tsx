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

/**
 * Site navigation. Fixed at 72px: the logo previously scaled to h-28, which
 * made the bar taller than 110px and ate the top of every page.
 *
 * The desktop nav used to be `hidden md:flex` with no fallback, leaving mobile
 * visitors with no navigation at all. There is now a real menu.
 */
export default function SimpleNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

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
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled || menuOpen
          ? 'bg-[#08101D]/92 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="shell h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Travel Art, accueil" className="shrink-0">
            <img
              src={getLogoUrl('transparent')}
              alt="Travel Art"
              className="h-8 md:h-9 w-auto object-contain brightness-0 invert"
            />
          </Link>

          <nav className="hidden lg:flex gap-8" aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={pathname === item.to ? 'page' : undefined}
                className="text-sm font-medium whitespace-nowrap text-white/85 hover:text-white transition-colors duration-300 relative group"
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
            className="hidden sm:block text-sm font-medium whitespace-nowrap text-white/85 hover:text-white transition-colors duration-300"
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
            className="lg:hidden text-white p-1"
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
          className="lg:hidden border-t border-white/10 bg-[#08101D]/98 backdrop-blur-md"
        >
          <ul className="shell py-6 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="border-b border-white/5 last:border-0">
                <Link
                  to={item.to}
                  aria-current={pathname === item.to ? 'page' : undefined}
                  className="block py-4 font-serif text-2xl text-white hover:text-gold transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-5 sm:hidden">
              <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white">
                Connexion
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
