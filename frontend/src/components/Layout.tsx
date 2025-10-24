import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="flex">
        <Sidebar user={user} currentPath={location.pathname} />
        
        <main className="flex-1 p-8">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
