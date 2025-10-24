import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User } from '@/types'
import { 
  Home, 
  User as UserIcon, 
  Calendar, 
  CreditCard, 
  Users, 
  Gift
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
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <aside className="w-64 bg-white shadow-medium min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar



