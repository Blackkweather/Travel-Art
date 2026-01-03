import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect, lazy, Suspense } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import SEOHead from '@/components/SEOHead'
import { getDefaultOrganizationSchema } from '@/utils/structuredData'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkipToContent from '@/components/SkipToContent'
import analytics from '@/utils/analytics'
import { useAppKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

import Layout from '@/components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import RoleAwareRoute from './components/RoleAwareRoute'
import PasswordPopup from './components/PasswordPopup'
import PageTransition from './components/PageTransition'

// Force import to ensure it loads
console.log('🔒 PasswordPopup imported:', typeof PasswordPopup)

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LandingPageNewV2 = lazy(() => import('@/pages/LandingPageNewV2'))
const LandingPageNewV3 = lazy(() => import('@/pages/LandingPageNewV3'))
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'))
const PartnersPage = lazy(() => import('@/pages/PartnersPage'))
const TopArtistsPage = lazy(() => import('@/pages/TopArtistsPage'))
const TopHotelsPage = lazy(() => import('@/pages/TopHotelsPage'))
const HotelDetailsPage = lazy(() => import('@/pages/HotelDetailsPage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ReferralRedirectPage = lazy(() => import('@/pages/ReferralRedirectPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const CookiePolicyPage = lazy(() => import('@/pages/CookiePolicyPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))

// Protected pages - lazy loaded
const ArtistDashboard = lazy(() => import('@/pages/artist/ArtistDashboard'))
const ArtistProfile = lazy(() => import('@/pages/artist/ArtistProfile'))
const PublicArtistProfile = lazy(() => import('@/pages/PublicArtistProfile'))
const ArtistMembership = lazy(() => import('@/pages/artist/ArtistMembership'))
const ArtistReferrals = lazy(() => import('@/pages/artist/ArtistReferrals'))

const HotelDashboard = lazy(() => import('@/pages/hotel/HotelDashboard'))
const HotelProfile = lazy(() => import('@/pages/hotel/HotelProfile'))
const HotelArtists = lazy(() => import('@/pages/hotel/HotelArtists'))
const HotelCredits = lazy(() => import('@/pages/hotel/HotelCredits'))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminModeration = lazy(() => import('@/pages/admin/AdminModeration'))
const AdminReferrals = lazy(() => import('@/pages/admin/AdminReferrals'))
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs'))
const TravelerExperiencesPage = lazy(() => import('@/pages/TravelerExperiencesPage'))
const ExperienceDetailsPage = lazy(() => import('@/pages/ExperienceDetailsPage'))
const PaymentPage = lazy(() => import('@/pages/PaymentPage'))

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
  const location = useLocation()
  
  // Enable keyboard shortcuts
  useAppKeyboardShortcuts()

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Track page views
  useEffect(() => {
    analytics.pageView(location.pathname, document.title)
  }, [location.pathname])

  // console.log('🔒 App.tsx rendering - PasswordPopup should be visible')
  
  return (
    <ErrorBoundary>
      <SkipToContent />
      <SEOHead structuredData={getDefaultOrganizationSchema()} />
      {/* PasswordPopup temporarily disabled - uncomment to activate */}
      {/* <PasswordPopup /> */}
      {isLoading ? (
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><LandingPageNewV3 /></PageTransition>} />
        <Route path="/v2" element={<PageTransition><LandingPageNewV2 /></PageTransition>} />
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
        <Route 
          path="logs"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminLogs />
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
          path="referrals" 
          element={
            <RoleRoute allowedRoles={['ARTIST']}>
              <ArtistReferrals />
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
          </Suspense>
      )}
    </ErrorBoundary>
  )
}

export default App







