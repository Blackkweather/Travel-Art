import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'

/**
 * Referral redirect page
 * Handles URLs like: /ref/{REFERRAL-CODE}
 * Redirects to registration page with referral code as query parameter
 */
const ReferralRedirectPage: React.FC = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (code) {
      // Store referral code in sessionStorage to persist across navigation
      sessionStorage.setItem('referralCode', code.toUpperCase())
      
      // Redirect to registration page with referral code
      navigate(`/register?ref=${code.toUpperCase()}`, { replace: true })
    } else {
      // No referral code provided, redirect to home
      navigate('/', { replace: true })
    }
  }, [code, navigate])

  return (
    <div className="min-h-screen bg-[#08101D] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-control h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-white/60">Redirecting...</p>
      </div>
    </div>
  )
}

export default ReferralRedirectPage




















