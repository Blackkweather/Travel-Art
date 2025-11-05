import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from './LoadingSpinner'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: ('ARTIST' | 'HOTEL' | 'ADMIN')[]
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to user's dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default RoleRoute










