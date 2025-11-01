import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User } from '@/types'
import { LogOut, Bell, Settings, Menu, X, User as UserIcon } from 'lucide-react'
import { getLogoUrl } from '@/config/assets'

interface NavbarProps {
  user: User
  onLogout: () => void
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleLogout = () => {
    onLogout()
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-navy text-white shadow-medium sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Top Left */}
          <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex'
                }
              }}
            />
            <div className="hidden items-center space-x-2">
              <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                <span className="text-navy font-bold text-lg">🧭</span>
              </div>
              <h1 className="text-xl font-serif font-bold text-white">Travel Art</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-navy/80 transition-colors"
              >
                <Bell className="w-5 h-5 text-gold" />
                <span className="text-sm">Notifications</span>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
              </button>
              
              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-navy/80 transition-colors">
                <Settings className="w-5 h-5 text-gold" />
                <span className="text-sm">Settings</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 pl-4 border-l border-gray-600">
              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gold" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-300 capitalize">{user.role.toLowerCase()}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-navy/80 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gold" />
            ) : (
              <Menu className="w-6 h-6 text-gold" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-600">
            <div className="pt-4 space-y-3">
              <div className="flex items-center space-x-3 px-3 py-2 bg-navy/50 rounded-lg">
                <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-300 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy/80 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-gold" />
                  <span className="text-sm">Notifications</span>
                </div>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
              </button>
              
              <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-navy/80 transition-colors">
                <Settings className="w-5 h-5 text-gold" />
                <span className="text-sm">Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-6 top-16 bg-white text-navy rounded-lg shadow-large border border-gray-200 w-80 max-w-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-navy">Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <p className="text-sm font-medium text-navy">New booking request</p>
                <p className="text-xs text-gray-600">Sophie Laurent wants to perform at your rooftop terrace</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
              <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <p className="text-sm font-medium text-navy">Performance confirmed</p>
                <p className="text-xs text-gray-600">Marco Silva's DJ set is confirmed for Feb 15</p>
                <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
              </div>
              <div className="p-4 hover:bg-gray-50">
                <p className="text-sm font-medium text-navy">Credit package purchased</p>
                <p className="text-xs text-gray-600">Professional Package (25 credits) added to your account</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-sm text-gold hover:text-gold/80 font-medium">
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
