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
          { path: '/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/dashboard/profile', label: 'Mon profil', icon: UserIcon },
          { path: '/dashboard/bookings', label: 'Mes réservations', icon: Calendar },
          { path: '/dashboard/membership', label: 'Adhésion', icon: CreditCard },
          { path: '/dashboard/referrals', label: 'Parrainage', icon: Gift },
        ]
      case 'HOTEL':
        return [
          { path: '/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/dashboard/profile', label: 'Profil de l’hôtel', icon: UserIcon },
          { path: '/dashboard/artists', label: 'Parcourir les artistes', icon: Users },
          { path: '/dashboard/bookings', label: 'Réservations', icon: Calendar },
          { path: '/dashboard/credits', label: 'Crédits', icon: CreditCard },
        ]
      case 'ADMIN':
        return [
          { path: '/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/dashboard/users', label: 'Utilisateurs', icon: Users },
          { path: '/dashboard/bookings', label: 'Réservations', icon: Calendar },
          { path: '/dashboard/analytics', label: 'Statistiques', icon: TrendingUp },
          { path: '/dashboard/moderation', label: 'Modération', icon: UserIcon },
          { path: '/dashboard/logs', label: 'Journal d’activité', icon: Activity },
          { path: '/dashboard/referrals', label: 'Parrainage', icon: Gift },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <aside className="hidden md:block w-64 bg-surface-raised shadow-lg min-h-screen border-r border-line">
      <div className="p-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-4 px-4 py-3 rounded-card transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-navy to-navy/95 text-white shadow-md'
                    : 'text-content-secondary hover:bg-gradient-to-r hover:from-gold/10 hover:to-gold/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full"></div>
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                  isActive ? 'text-white' : 'text-content-secondary group-hover:text-gold'
                } ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className={`font-medium text-sm ${
                  isActive ? 'text-white' : 'text-content-secondary group-hover:text-content'
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



