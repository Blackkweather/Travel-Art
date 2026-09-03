import React, { useEffect, lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
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
import PageTransition from './components/PageTransition'

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'))
const PartnersPage = lazy(() => import('@/pages/PartnersPage'))
const TopArtistsPage = lazy(() => import('@/pages/TopArtistsPage'))
const TopHotelsPage = lazy(() => import('@/pages/TopHotelsPage'))
const HotelDetailsPage = lazy(() => import('@/pages/HotelDetailsPage'))
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
const HotelArtists = lazy(() => import('@/pages/hotel/HotelArtists'))
const HotelCredits = lazy(() => import('@/pages/hotel/HotelCredits'))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminModeration = lazy(() => import('@/pages/admin/AdminModeration'))
const AdminAdmissions = lazy(() => import('@/pages/admin/AdminAdmissions'))
const AdminReferrals = lazy(() => import('@/pages/admin/AdminReferrals'))
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs'))
const TravelerExperiencesPage = lazy(() => import('@/pages/TravelerExperiencesPage'))
const ExperienceDetailsPage = lazy(() => import('@/pages/ExperienceDetailsPage'))
const RegistrationSentPage = lazy(() => import('@/pages/RegistrationSentPage'))
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'))

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

// Referrals route component - renders appropriate referrals page based on role
const ReferralsRoute = () => {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  switch (user.role) {
    case 'ARTIST':
      return <ArtistReferrals />
    case 'ADMIN':
      return <AdminReferrals />
    default:
      return <Navigate to="/dashboard" replace />
  }
}

function App() {
  const { isLoading, checkAuth, user, token } = useAuthStore()
  const location = useLocation()
  const [initialAuthChecked, setInitialAuthChecked] = useState(false)
  
  // Enable keyboard shortcuts
  useAppKeyboardShortcuts()

  // Check auth on mount - non-blocking
  useEffect(() => {
    // If we have user and token in state, skip API call for faster initial load
    if (user && token) {
      setInitialAuthChecked(true)
      return
    }
    
    // Otherwise, check auth but don't block rendering
    checkAuth().finally(() => {
      setInitialAuthChecked(true)
    })
  }, []) // Empty deps - only run once on mount

  // Track page views
  useEffect(() => {
    analytics.pageView(location.pathname, document.title)
  }, [location.pathname])

  // Show loading only on very first mount if we don't have cached auth
  const showInitialLoading = !initialAuthChecked && !user && !token
  
  return (
    <ErrorBoundary>
      <SkipToContent />
      <SEOHead structuredData={getDefaultOrganizationSchema()} />
      {showInitialLoading ? (
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <Suspense fallback={
          <div className="min-h-screen bg-surface flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }>
            <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/how-it-works" element={<PageTransition><HowItWorksPage /></PageTransition>} />
      <Route path="/partners" element={<PageTransition><PartnersPage /></PageTransition>} />
      <Route path="/top-artists" element={<PageTransition><TopArtistsPage /></PageTransition>} />
      <Route path="/top-hotels" element={<PageTransition><TopHotelsPage /></PageTransition>} />
      <Route path="/hotel/:id" element={<PageTransition><HotelDetailsPage /></PageTransition>} />
      <Route path="/experiences" element={<PageTransition><TravelerExperiencesPage /></PageTransition>} />
      <Route path="/experience/:id" element={<PageTransition><ExperienceDetailsPage /></PageTransition>} />
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
      <Route path="/inscription-envoyee" element={<PageTransition><RegistrationSentPage /></PageTransition>} />
      <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />
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
          path="admissions"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminAdmissions />
            </RoleRoute>
          }
        />
        <Route 
          path="referrals"
          element={
            <ReferralsRoute />
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
      </Route>

      {/* Artist Public Profile */}
      <Route path="/artist/:id" element={<PageTransition><PublicArtistProfile /></PageTransition>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
      )}
    </ErrorBoundary>
  )
}

export default App







