import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // User is guaranteed to exist due to ProtectedRoute wrapper
  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="flex flex-col md:flex-row">
        <Sidebar user={user} currentPath={location.pathname} />
        
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
