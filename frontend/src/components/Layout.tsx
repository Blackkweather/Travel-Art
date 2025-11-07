import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

const Layout: React.FC = () => {
  const { user } = useAuthStore()
  const location = useLocation()

  // User is guaranteed to exist due to ProtectedRoute wrapper
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="flex flex-col md:flex-row pt-[55px]">
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
