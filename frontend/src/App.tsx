import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { setClerkTokenGetter } from '@/utils/clerkToken'
import { AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import RoleAwareRoute from './components/RoleAwareRoute'
import PasswordPopup from './components/PasswordPopup'
import PageTransition from './components/PageTransition'

// Force import to ensure it loads
console.log('🔒 PasswordPopup imported:', typeof PasswordPopup)

// Public pages
import LandingPage from '@/pages/LandingPage'
import HowItWorksPage from '@/pages/HowItWorksPage'
import PartnersPage from '@/pages/PartnersPage'
import TopArtistsPage from '@/pages/TopArtistsPage'
import TopHotelsPage from '@/pages/TopHotelsPage'
import HotelDetailsPage from '@/pages/HotelDetailsPage'
import PricingPage from '@/pages/PricingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ReferralRedirectPage from '@/pages/ReferralRedirectPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import TermsPage from '@/pages/TermsPage'
import CookiePolicyPage from '@/pages/CookiePolicyPage'
import AboutPage from '@/pages/AboutPage'

// Protected pages
import ArtistDashboard from '@/pages/artist/ArtistDashboard'
import ArtistProfile from '@/pages/artist/ArtistProfile'
import PublicArtistProfile from '@/pages/PublicArtistProfile'
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
import ExperienceDetailsPage from '@/pages/ExperienceDetailsPage'
import PaymentPage from '@/pages/PaymentPage'

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
  const { isLoading, checkAuth, syncClerkUser } = useAuthStore()
  const { isLoaded, isSignedIn, user: clerkUser, getToken } = useAuth()
  const location = useLocation()

  // Set up Clerk token getter for API client
  useEffect(() => {
    if (isLoaded && getToken) {
      setClerkTokenGetter(async () => {
        try {
          return await getToken()
        } catch (error) {
          return null
        }
      })
    }
  }, [isLoaded, getToken])

  useEffect(() => {
    // Sync Clerk user with our backend when Clerk user is available
    if (isLoaded && isSignedIn && clerkUser) {
      syncClerkUser(clerkUser)
    } else if (!isSignedIn) {
      // Fallback to existing auth check if not using Clerk
      checkAuth()
    }
  }, [isLoaded, isSignedIn, clerkUser, syncClerkUser, checkAuth])

  console.log('🔒 App.tsx rendering - PasswordPopup should be visible')
  
  return (
    <>
      <PasswordPopup />
      {isLoading ? (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/how-it-works" element={<PageTransition><HowItWorksPage /></PageTransition>} />
      <Route path="/partners" element={<PageTransition><PartnersPage /></PageTransition>} />
      <Route path="/top-artists" element={<PageTransition><TopArtistsPage /></PageTransition>} />
      <Route path="/top-hotels" element={<PageTransition><TopHotelsPage /></PageTransition>} />
      <Route path="/hotel/:id" element={<PageTransition><HotelDetailsPage /></PageTransition>} />
      <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
      <Route path="/experiences" element={<PageTransition><TravelerExperiencesPage /></PageTransition>} />
      <Route path="/experience/:id" element={<PageTransition><ExperienceDetailsPage /></PageTransition>} />
      <Route path="/payment" element={<PageTransition><PaymentPage /></PageTransition>} />
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
      <Route path="/ref/:code" element={<PageTransition><ReferralRedirectPage /></PageTransition>} />
      <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
      <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
      <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
      <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
      <Route path="/cookies" element={<PageTransition><CookiePolicyPage /></PageTransition>} />
      <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />

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
      <Route path="/artist/:id" element={<PageTransition><PublicArtistProfile /></PageTransition>} />
      
      {/* Hotel Public Profile */}
      <Route path="/hotel/:id" element={<PageTransition><HotelProfile /></PageTransition>} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AnimatePresence>
      )}
    </>
  )
}

export default App







