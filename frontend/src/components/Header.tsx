import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'

const Header: React.FC = () => {
  const { scrollY } = useScroll()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Scroll-based animations for header
  const headerBackground = useTransform(scrollY, [0, 100], ['rgba(11, 31, 63, 0.1)', 'rgba(11, 31, 63, 0.1)'])
  const textColor = useTransform(scrollY, [0, 100], ['white', 'white'])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10"
        style={{
          background: headerBackground,
          padding: '10px 20px md:10px 80px',
          height: '55px',
          overflow: 'visible'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-12 md:h-20 lg:h-24 xl:h-28 w-auto object-contain"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.div style={{ color: textColor }}>
              <Link to="/how-it-works" className="hover:text-gold transition-colors font-medium text-sm">
                How it Works
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/partners" className="hover:text-gold transition-colors font-medium text-sm">
                Partners
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/pricing" className="hover:text-gold transition-colors font-medium text-sm">
                Pricing
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-artists" className="hover:text-gold transition-colors font-medium text-sm">
                Top Artists
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-hotels" className="hover:text-gold transition-colors font-medium text-sm">
                Top Hotels
              </Link>
            </motion.div>
          </div>
          
          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <motion.div style={{ color: textColor }}>
              <Link to="/login" className="hover:text-gold transition-colors font-medium text-sm px-4 py-2">
                Sign In
              </Link>
            </motion.div>
            <Link to="/register" className="bg-gold text-navy px-6 py-2 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-200 text-sm shadow-lg">
              Join
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white hover:text-gold transition-colors p-2"
            aria-label="Toggle mobile menu"
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
          className="fixed top-[55px] left-0 right-0 z-40 bg-navy/95 backdrop-blur-md border-b border-white/10 md:hidden"
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
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="pt-4 border-t border-white/20 space-y-3">
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
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}

export default Header
