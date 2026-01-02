import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User } from '@/types'
import { 
  Home, 
  User as UserIcon, 
  Calendar, 
  CreditCard, 
  Users, 
  Gift,
  TrendingUp,
  Activity
} from 'lucide-react'

interface SidebarProps {
  user: User
  currentPath: string
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const location = useLocation()

  const getNavItems = () => {
    switch (user.role) {
      case 'ARTIST':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
          { path: '/dashboard/bookings', label: 'My Bookings', icon: Calendar },
          { path: '/dashboard/membership', label: 'Membership', icon: CreditCard },
          { path: '/dashboard/referrals', label: 'Referrals', icon: Gift },
        ]
      case 'HOTEL':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/dashboard/profile', label: 'Hotel Profile', icon: UserIcon },
          { path: '/dashboard/artists', label: 'Browse Artists', icon: Users },
          { path: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
          { path: '/dashboard/credits', label: 'Credits', icon: CreditCard },
        ]
      case 'ADMIN':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/dashboard/users', label: 'Users', icon: Users },
          { path: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
          { path: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
          { path: '/dashboard/moderation', label: 'Moderation', icon: UserIcon },
          { path: '/dashboard/logs', label: 'Activity Logs', icon: Activity },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <aside className="hidden md:block w-64 bg-white shadow-lg min-h-screen border-r border-gray-100">
      <div className="p-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-navy to-navy/95 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gold/10 hover:to-gold/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full"></div>
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                  isActive ? 'text-white' : 'text-gray-600 group-hover:text-gold'
                } ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className={`font-medium text-sm ${
                  isActive ? 'text-white' : 'text-gray-700 group-hover:text-navy'
                }`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar



