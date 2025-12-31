import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getLogoUrl } from '@/config/assets'

export default function SimpleNavbar() {
  const [headerScrolled, setHeaderScrolled] = useState(false)

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      headerScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg' 
        : 'bg-white/90 backdrop-blur-sm'
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
          <nav className="hidden md:flex gap-8">
            <Link 
              to="/experiences" 
              className="text-sm font-semibold transition-all duration-300 relative group text-gray-900"
            >
              Experiences
              <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-teal-600" />
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-sm font-semibold transition-all duration-300 relative group text-gray-900"
            >
              How it Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-teal-600" />
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-semibold transition-all duration-300 hidden sm:block relative group text-gray-900"
          >
            Sign In
            <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-teal-600" />
          </Link>
          <Link 
            to="/register"
            className="bg-teal-500 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-teal-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group"
          >
            <span className="relative z-10">Join Now</span>
            <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </div>
      </div>
    </header>
  )
}


