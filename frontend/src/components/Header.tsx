import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { getLogoUrl } from '@/config/assets'

const Header: React.FC = () => {
  const { scrollY } = useScroll()
  
  // Scroll-based animations for header
  const headerBackground = useTransform(scrollY, [0, 100], ['rgba(11, 31, 63, 0.1)', 'rgba(11, 31, 63, 0.1)'])
  const textColor = useTransform(scrollY, [0, 100], ['white', 'white'])

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10"
      style={{
        background: headerBackground,
        padding: '10px 80px',
        height: '55px',
        overflow: 'visible'
      }}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity -ml-4">
          <img 
            src={getLogoUrl('transparent')} 
            alt="Travel Art" 
            style={{
              height: '150px',
              width: 'auto',
              objectFit: 'contain'
            }}
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
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <motion.div style={{ color: textColor }}>
            <Link to="/login" className="hover:text-gold transition-colors font-medium text-sm px-4 py-2">
              Sign In
            </Link>
          </motion.div>
          <Link to="/register" className="bg-gold text-navy px-6 py-2 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-200 text-sm shadow-lg">
            Join
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

export default Header
