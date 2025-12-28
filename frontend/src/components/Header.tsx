import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { getLogoUrl } from '@/config/assets'
import { useAuthStore } from '@/store/authStore'

const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { signOut } = useClerk()
  const { scrollY } = useScroll()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [navbarBg, setNavbarBg] = useState('transparent')
  const [textColor, setTextColor] = useState('text-white')
  const location = useLocation()
  
  // Detect background color behind navbar and adapt colors
  useEffect(() => {
    const detectBackgroundColor = () => {
      const navbar = document.querySelector('nav')
      if (!navbar) return

      const bodyBgColor = window.getComputedStyle(document.body).backgroundColor
      const scrollPosition = window.scrollY

      // Check if on dashboard pages
      const isDashboard = location.pathname.includes('/dashboard')
      
      if (isDashboard || scrollPosition > 100) {
        // Solid background with blur for dashboard and scrolled state
        setNavbarBg('rgba(11, 31, 63, 0.95)')
        setTextColor('text-white')
      } else {
        // Transparent with adaptive text color for landing pages
        const brightness = getBrightness(bodyBgColor)
        setNavbarBg('transparent')
        setTextColor(brightness > 128 ? 'text-navy' : 'text-white')
      }
    }

    const getBrightness = (color: string) => {
      const rgb = color.match(/\d+/g)
      if (!rgb || rgb.length < 3) return 0
      return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000
    }

    detectBackgroundColor()
    window.addEventListener('scroll', detectBackgroundColor)
    return () => window.removeEventListener('scroll', detectBackgroundColor)
  }, [location])
  
  const handleLogout = async () => {
    // Only logout on explicit user action - prevent any automatic logout
    const confirmLogout = window.confirm('Are you sure you want to logout?')
    if (!confirmLogout) return
    
    try {
      // Sign out from Clerk if available
      if (signOut) {
        await signOut()
      }
    } catch (error) {
      console.error('Clerk sign out error:', error)
    }
    // Clear local auth state
    logout()
    window.location.href = '/'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10 px-5 md:px-20 h-[55px] transition-all duration-500 ease-in-out"
        style={{
          background: navbarBg,
          overflow: 'visible'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-12 md:h-20 lg:h-24 xl:h-28 w-auto object-contain"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8 flex-wrap justify-center" data-testid="desktop-menu">
            <Link to="/how-it-works" className={`${textColor} hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap`}>
              How it Works
            </Link>
            <Link to="/partners" className={`${textColor} hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap`}>
              Partners
            </Link>
            <Link to="/pricing" className={`${textColor} hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap`}>
              Pricing
            </Link>
            <Link to="/top-artists" className={`${textColor} hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap`}>
              Top Artists
            </Link>
            <Link to="/top-hotels" className={`${textColor} hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap`}>
              Top Hotels
            </Link>
            <Link to="/experiences" className={`${textColor} hover:text-gold transition-colors font-medium text-xs lg:text-sm whitespace-nowrap`}>
              Experiences
            </Link>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link to="/dashboard" className={`${textColor} hover:text-gold transition-colors font-medium text-sm px-4 py-2`}>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gold text-navy px-6 py-2 rounded-2xl font-semibold hover:bg-gold/90 hover:scale-105 transition-all duration-200 text-sm shadow-lg"
                  data-testid="user-menu"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${textColor} hover:text-gold transition-colors font-medium text-sm px-4 py-2 hidden md:block`}>
                  Sign In
                </Link>
                <Link to="/register" className="bg-gold text-navy px-6 py-2 rounded-2xl font-semibold hover:bg-gold/90 hover:scale-105 transition-all duration-200 text-sm shadow-lg">
                  Join
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className={`md:hidden ${textColor} hover:text-gold transition-colors p-2`}
            aria-label="Toggle mobile menu"
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-[55px] left-0 right-0 z-40 bg-transparent border-b border-white/10 shadow-lg md:hidden"
          data-testid="mobile-menu"
        >
          <div className="px-6 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <div className="space-y-3">
              <Link 
                to="/how-it-works" 
                className="block text-white hover:text-gold transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link 
                to="/partners" 
                className="block text-white hover:text-gold transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Partners
              </Link>
              <Link 
                to="/pricing" 
                className="block text-white hover:text-gold transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                to="/top-artists" 
                className="block text-white hover:text-gold transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Top Artists
              </Link>
              <Link
                to="/top-hotels"
                className="block text-white hover:text-gold transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Top Hotels
              </Link>
              <Link
                to="/experiences"
                className="block text-white hover:text-gold transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Experiences
              </Link>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block text-white hover:text-gold transition-colors font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                      window.location.href = '/'
                    }}
                    className="w-full bg-gold text-navy px-6 py-3 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-200 text-center shadow-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block text-white hover:text-gold transition-colors font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="block bg-gold text-navy px-6 py-3 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-200 text-center shadow-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Join Travel Art
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}

export default Header
