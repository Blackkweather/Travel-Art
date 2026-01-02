import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'
import { useAuthStore } from '@/store/authStore'

const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  
  // Header scroll effect - same as SimpleNavbar
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const handleLogout = async () => {
    // Only logout on explicit user action - prevent any automatic logout
    const confirmLogout = window.confirm('Are you sure you want to logout?')
    if (!confirmLogout) return
    
    // Clear local auth state
    logout()
    window.location.href = '/'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        headerScrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="hover:opacity-80 transition-all duration-300 hover:scale-105">
              <img 
                src={getLogoUrl('transparent')} 
                alt="Travel Art" 
                className="h-12 md:h-20 lg:h-24 xl:h-28 w-auto object-contain transition-all duration-300"
              />
            </Link>
            
            {/* Desktop Navigation - Only show for logged-in users */}
            {user && (
              <nav className="hidden md:flex gap-8">
                <Link 
                  to="/how-it-works" 
                  className={`text-sm font-semibold transition-all duration-300 relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  How it Works
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
                <Link 
                  to="/partners" 
                  className={`text-sm font-semibold transition-all duration-300 relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  Partners
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
                <Link 
                  to="/pricing" 
                  className={`text-sm font-semibold transition-all duration-300 relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  Pricing
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
                <Link 
                  to="/top-artists" 
                  className={`text-sm font-semibold transition-all duration-300 relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  Top Artists
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
                <Link 
                  to="/top-hotels" 
                  className={`text-sm font-semibold transition-all duration-300 relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  Top Hotels
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
                <Link 
                  to="/experiences" 
                  className={`text-sm font-semibold transition-all duration-300 relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  Experiences
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
              </nav>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-semibold transition-all duration-300 hidden sm:block relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  Dashboard
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-teal-500 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-teal-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group"
                  data-testid="user-menu"
                >
                  <span className="relative z-10">Logout</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`text-sm font-semibold transition-all duration-300 hidden sm:block relative group ${
                    headerScrolled ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  Sign In
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    headerScrolled ? 'bg-teal-600' : 'bg-teal-300'
                  }`} />
                </Link>
                <Link 
                  to="/register"
                  className="bg-teal-500 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-teal-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group"
                >
                  <span className="relative z-10">Join Now</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className={`md:hidden transition-colors p-2 ${
              headerScrolled ? 'text-gray-900' : 'text-gray-200'
            } hover:text-teal-500`}
            aria-label="Toggle mobile menu"
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-[88px] left-0 right-0 z-40 border-b shadow-lg md:hidden transition-all duration-300 ${
            headerScrolled 
              ? 'bg-white/95 backdrop-blur-md border-gray-200/50' 
              : 'bg-transparent border-white/10'
          }`}
          data-testid="mobile-menu"
        >
          <div className="px-6 py-4 space-y-4">
            {/* Mobile Navigation Links - Only show for logged-in users */}
            {user && (
              <div className="space-y-3">
                <Link 
                  to="/how-it-works" 
                  className={`block transition-colors font-medium py-2 ${
                    headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-gray-200 hover:text-teal-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How it Works
                </Link>
                <Link 
                  to="/partners" 
                  className={`block transition-colors font-medium py-2 ${
                    headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-gray-200 hover:text-teal-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Partners
                </Link>
                <Link 
                  to="/pricing" 
                  className={`block transition-colors font-medium py-2 ${
                    headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-gray-200 hover:text-teal-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/top-artists" 
                  className={`block transition-colors font-medium py-2 ${
                    headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-gray-200 hover:text-teal-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Top Artists
                </Link>
                <Link
                  to="/top-hotels"
                  className={`block transition-colors font-medium py-2 ${
                    headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-gray-200 hover:text-teal-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Top Hotels
                </Link>
                <Link
                  to="/experiences"
                  className={`block transition-colors font-medium py-2 ${
                    headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-gray-200 hover:text-teal-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Experiences
                </Link>
              </div>
            )}
            
            {/* Mobile Action Buttons */}
            <div className={`pt-4 border-t space-y-3 ${
              headerScrolled ? 'border-gray-200/50' : 'border-white/10'
            }`}>
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`block transition-colors font-medium py-2 ${
                      headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-white hover:text-teal-300'
                    }`}
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
                    className="w-full bg-teal-500 text-white px-6 py-3 rounded-full font-bold hover:bg-teal-400 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`block transition-colors font-medium py-2 ${
                      headerScrolled ? 'text-gray-900 hover:text-teal-600' : 'text-white hover:text-teal-300'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="block bg-teal-500 text-white px-6 py-3 rounded-full font-bold hover:bg-teal-400 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
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
