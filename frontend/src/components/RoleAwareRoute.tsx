import React from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ArtistProfile from '@/pages/artist/ArtistProfile'
import ArtistBookings from '@/pages/artist/ArtistBookings'
import HotelProfile from '@/pages/hotel/HotelProfile'
import HotelBookings from '@/pages/hotel/HotelBookings'
import AdminBookings from '@/pages/admin/AdminBookings'

interface RoleAwareRouteProps {
  componentType: 'profile' | 'bookings'
}

const RoleAwareRoute: React.FC<RoleAwareRouteProps> = ({ componentType }) => {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Map component type to component based on role
  if (componentType === 'profile') {
    if (user.role === 'ARTIST') {
      return <ArtistProfile />
    }
    if (user.role === 'HOTEL') {
      return <HotelProfile />
    }
  }

  if (componentType === 'bookings') {
    if (user.role === 'ARTIST') {
      return <ArtistBookings />
    }
    if (user.role === 'HOTEL') {
      return <HotelBookings />
    }
    if (user.role === 'ADMIN') {
      return <AdminBookings />
    }
  }

  return <Navigate to="/dashboard" replace />
}

export default RoleAwareRoute

