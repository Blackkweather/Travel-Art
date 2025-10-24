import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'

// Public pages
import LandingPage from '@/pages/LandingPage'
import HowItWorksPage from '@/pages/HowItWorksPage'
import PartnersPage from '@/pages/PartnersPage'
import TopArtistsPage from '@/pages/TopArtistsPage'
import TopHotelsPage from '@/pages/TopHotelsPage'
import PricingPage from '@/pages/PricingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

// Protected pages
import ArtistDashboard from '@/pages/artist/ArtistDashboard'
import ArtistProfile from '@/pages/artist/ArtistProfile'
import ArtistBookings from '@/pages/artist/ArtistBookings'
import ArtistMembership from '@/pages/artist/ArtistMembership'
import ArtistReferrals from '@/pages/artist/ArtistReferrals'

import HotelDashboard from '@/pages/hotel/HotelDashboard'
import HotelProfile from '@/pages/hotel/HotelProfile'
import HotelArtists from '@/pages/hotel/HotelArtists'
import HotelBookings from '@/pages/hotel/HotelBookings'
import HotelCredits from '@/pages/hotel/HotelCredits'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminBookings from '@/pages/admin/AdminBookings'

function App() {
  const { user, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/partners" element={<PartnersPage />} />
      <Route path="/top-artists" element={<TopArtistsPage />} />
      <Route path="/top-hotels" element={<TopHotelsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<Layout />}>
        {user?.role === 'ARTIST' && (
          <>
            <Route index element={<ArtistDashboard />} />
            <Route path="profile" element={<ArtistProfile />} />
            <Route path="bookings" element={<ArtistBookings />} />
            <Route path="membership" element={<ArtistMembership />} />
            <Route path="referrals" element={<ArtistReferrals />} />
          </>
        )}
        
        {user?.role === 'HOTEL' && (
          <>
            <Route index element={<HotelDashboard />} />
            <Route path="profile" element={<HotelProfile />} />
            <Route path="artists" element={<HotelArtists />} />
            <Route path="bookings" element={<HotelBookings />} />
            <Route path="credits" element={<HotelCredits />} />
          </>
        )}
        
        {user?.role === 'ADMIN' && (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="bookings" element={<AdminBookings />} />
          </>
        )}
      </Route>

      {/* Artist Public Profile */}
      <Route path="/artist/:id" element={<ArtistProfile />} />
      
      {/* Hotel Public Profile */}
      <Route path="/hotel/:id" element={<HotelProfile />} />
    </Routes>
  )
}

export default App


