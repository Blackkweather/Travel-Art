import React, { useEffect, Suspense, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import SEOHead from '@/components/SEOHead'
import { getDefaultOrganizationSchema } from '@/utils/structuredData'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkipToContent from '@/components/SkipToContent'
import SiteIntro from '@/components/SiteIntro'
import CookieBanner from '@/components/CookieBanner'
import analytics from '@/utils/analytics'
import { useAppKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { lazyRoute } from '@/utils/lazyRoute'

import Layout from '@/components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import RoleAwareRoute from './components/RoleAwareRoute'
import PageTransition from './components/PageTransition'

// Lazy load pages for code splitting
const LandingPage = lazyRoute(() => import('@/pages/LandingPage'))
const HowItWorksPage = lazyRoute(() => import('@/pages/HowItWorksPage'))
const PartnersPage = lazyRoute(() => import('@/pages/PartnersPage'))
const TopArtistsPage = lazyRoute(() => import('@/pages/TopArtistsPage'))
const TopHotelsPage = lazyRoute(() => import('@/pages/TopHotelsPage'))
const HotelDetailsPage = lazyRoute(() => import('@/pages/HotelDetailsPage'))
const LoginPage = lazyRoute(() => import('@/pages/LoginPage'))
const RegisterPage = lazyRoute(() => import('@/pages/RegisterPage'))
const ReferralRedirectPage = lazyRoute(() => import('@/pages/ReferralRedirectPage'))
const ForgotPasswordPage = lazyRoute(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazyRoute(() => import('./pages/ResetPasswordPage'))
const PrivacyPolicyPage = lazyRoute(() => import('@/pages/PrivacyPolicyPage'))
const TermsPage = lazyRoute(() => import('@/pages/TermsPage'))
const CookiePolicyPage = lazyRoute(() => import('@/pages/CookiePolicyPage'))
const AboutPage = lazyRoute(() => import('@/pages/AboutPage'))
const FaqPage = lazyRoute(() => import('@/pages/FaqPage'))

// Protected pages - lazy loaded
const ArtistDashboard = lazyRoute(() => import('@/pages/artist/ArtistDashboard'))
const PublicArtistProfile = lazyRoute(() => import('@/pages/PublicArtistProfile'))
const ArtistMembership = lazyRoute(() => import('@/pages/artist/ArtistMembership'))
const ArtistReferrals = lazyRoute(() => import('@/pages/artist/ArtistReferrals'))

const HotelDashboard = lazyRoute(() => import('@/pages/hotel/HotelDashboard'))
const HotelArtists = lazyRoute(() => import('@/pages/hotel/HotelArtists'))
const HotelCredits = lazyRoute(() => import('@/pages/hotel/HotelCredits'))

const AdminDashboard = lazyRoute(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazyRoute(() => import('@/pages/admin/AdminUsers'))
const AdminAnalytics = lazyRoute(() => import('@/pages/admin/AdminAnalytics'))
const AdminModeration = lazyRoute(() => import('@/pages/admin/AdminModeration'))
const AdminAdmissions = lazyRoute(() => import('@/pages/admin/AdminAdmissions'))
const AdminReferrals = lazyRoute(() => import('@/pages/admin/AdminReferrals'))
const AdminLogs = lazyRoute(() => import('@/pages/admin/AdminLogs'))
const TravelerExperiencesPage = lazyRoute(() => import('@/pages/TravelerExperiencesPage'))
const ExperienceDetailsPage = lazyRoute(() => import('@/pages/ExperienceDetailsPage'))
const RegistrationSentPage = lazyRoute(() => import('@/pages/RegistrationSentPage'))
const VerifyEmailPage = lazyRoute(() => import('@/pages/VerifyEmailPage'))
const NotFoundPage = lazyRoute(() => import('@/pages/NotFoundPage'))

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
  const { checkAuth, user, token } = useAuthStore()
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
      {/* Only at the front door. A hotelier arriving straight at
          /dashboard/bookings is at work, not being introduced to a brand, and
          the component itself already limits this to once a session. */}
      {location.pathname === '/' && (
        <SiteIntro
          videoSrc="/intro/courtyard.mp4"
          posterSrc="/intro/courtyard.jpg"
        />
      )}
      <CookieBanner />
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
      <Route path="/top-artists" element={<ProtectedRoute><PageTransition><TopArtistsPage /></PageTransition></ProtectedRoute>} />
      <Route path="/top-hotels" element={<ProtectedRoute><PageTransition><TopHotelsPage /></PageTransition></ProtectedRoute>} />
      <Route path="/hotel/:id" element={<ProtectedRoute><PageTransition><HotelDetailsPage /></PageTransition></ProtectedRoute>} />
      <Route path="/experiences" element={<ProtectedRoute><PageTransition><TravelerExperiencesPage /></PageTransition></ProtectedRoute>} />
      <Route path="/experience/:id" element={<ProtectedRoute><PageTransition><ExperienceDetailsPage /></PageTransition></ProtectedRoute>} />
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
      <Route path="/faq" element={<PageTransition><FaqPage /></PageTransition>} />

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
      <Route path="/artist/:id" element={<ProtectedRoute><PageTransition><PublicArtistProfile /></PageTransition></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
      )}
    </ErrorBoundary>
  )
}

export default App







