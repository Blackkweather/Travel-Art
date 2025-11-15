import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import RoleAwareRoute from './components/RoleAwareRoute'
import PasswordPopup from './components/PasswordPopup'

// Force import to ensure it loads
console.log('🔒 PasswordPopup imported:', typeof PasswordPopup)

// Public pages
import LandingPage from '@/pages/LandingPage'
import HowItWorksPage from '@/pages/HowItWorksPage'
import PartnersPage from '@/pages/PartnersPage'
import TopArtistsPage from '@/pages/TopArtistsPage'
import TopHotelsPage from '@/pages/TopHotelsPage'
import PricingPage from '@/pages/PricingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import TermsPage from '@/pages/TermsPage'
import CookiePolicyPage from '@/pages/CookiePolicyPage'
import AboutPage from '@/pages/AboutPage'

// Protected pages
import ArtistDashboard from '@/pages/artist/ArtistDashboard'
import ArtistProfile from '@/pages/artist/ArtistProfile'
// removed unused direct import: ArtistBookings (resolved inside RoleAwareRoute)
import ArtistMembership from '@/pages/artist/ArtistMembership'
import ArtistReferrals from '@/pages/artist/ArtistReferrals'

import HotelDashboard from '@/pages/hotel/HotelDashboard'
import HotelProfile from '@/pages/hotel/HotelProfile'
import HotelArtists from '@/pages/hotel/HotelArtists'
// removed unused direct import: HotelBookings (resolved inside RoleAwareRoute)
import HotelCredits from '@/pages/hotel/HotelCredits'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
// removed unused direct import: AdminBookings (resolved inside RoleAwareRoute)
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import AdminModeration from '@/pages/admin/AdminModeration'
import AdminReferrals from '@/pages/admin/AdminReferrals'
import TravelerExperiencesPage from '@/pages/TravelerExperiencesPage'

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Already in dashboard, just render the appropriate dashboard
  switch (user.role) {
    case 'ARTIST':
      return <ArtistDashboard />
    case 'HOTEL':
      return <HotelDashboard />
    case 'ADMIN':
      return <AdminDashboard />
    default:
      return <Navigate to="/" replace />
  }
}

function App() {
  const { isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  console.log('🔒 App.tsx rendering - PasswordPopup should be visible')
  
  return (
    <>
      <PasswordPopup />
      {isLoading ? (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/partners" element={<PartnersPage />} />
      <Route path="/top-artists" element={<TopArtistsPage />} />
      <Route path="/top-hotels" element={<TopHotelsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/experiences" element={<TravelerExperiencesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRedirect />} />
        
        {/* Role-based routes */}
        <Route 
          path="profile" 
          element={
            <RoleRoute allowedRoles={['ARTIST', 'HOTEL']}>
              <RoleAwareRoute componentType="profile" />
            </RoleRoute>
          } 
        />
        <Route 
          path="bookings" 
          element={
            <RoleRoute allowedRoles={['ARTIST', 'HOTEL', 'ADMIN']}>
              <RoleAwareRoute componentType="bookings" />
            </RoleRoute>
          } 
        />
        <Route 
          path="membership" 
          element={
            <RoleRoute allowedRoles={['ARTIST']}>
              <ArtistMembership />
            </RoleRoute>
          } 
        />
        <Route 
          path="referrals" 
          element={
            <RoleRoute allowedRoles={['ARTIST']}>
              <ArtistReferrals />
            </RoleRoute>
          } 
        />
        <Route 
          path="artists" 
          element={
            <RoleRoute allowedRoles={['HOTEL']}>
              <HotelArtists />
            </RoleRoute>
          } 
        />
        <Route 
          path="credits" 
          element={
            <RoleRoute allowedRoles={['HOTEL']}>
              <HotelCredits />
            </RoleRoute>
          } 
        />
        <Route 
          path="users" 
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </RoleRoute>
          } 
        />
        <Route 
          path="analytics" 
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAnalytics />
            </RoleRoute>
          } 
        />
        <Route 
          path="moderation" 
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminModeration />
            </RoleRoute>
          } 
        />
        <Route 
          path="referrals"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminReferrals />
            </RoleRoute>
          } 
        />
      </Route>

      {/* Artist Public Profile */}
      <Route path="/artist/:id" element={<ArtistProfile />} />
      
      {/* Hotel Public Profile */}
      <Route path="/hotel/:id" element={<HotelProfile />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  )
}

export default App







