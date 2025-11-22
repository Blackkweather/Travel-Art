import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Check, Star, Calendar, Gift, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { paymentsApi, artistsApi } from '@/utils/api'
import { toast } from 'react-hot-toast'

function showToast(message: string) {
  try {
    toast.success(message)
  } catch {
    alert(message)
  }
}

const ArtistMembership: React.FC = () => {
  const { user } = useAuthStore()
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [artist, setArtist] = useState<any>(null)
  const [membershipStatus, setMembershipStatus] = useState<string>('INACTIVE')
  const [referralCode, setReferralCode] = useState('')
  const [totalBookings, setTotalBookings] = useState(0)
  const [memberSince, setMemberSince] = useState('')

  useEffect(() => {
    fetchArtistProfile()
  }, [user])

  const fetchArtistProfile = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await artistsApi.getMyProfile()
      const artistData = response.data?.data
      
      if (artistData) {
        setArtist(artistData)
        setMembershipStatus(artistData.membershipStatus || 'INACTIVE')
        setReferralCode(artistData.referralCode || '')
        setTotalBookings(artistData.bookings?.length || 0)
        setMemberSince(artistData.user?.createdAt || artistData.createdAt || new Date().toISOString())
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching artist profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (membershipType: 'PROFESSIONAL' | 'ENTERPRISE') => {
    if (!user?.artist?.id && !artist?.id) {
      showToast('Artist profile not found. Please create your profile first.')
      return
    }
    
    const artistId = artist?.id || user?.artist?.id
    
    try {
      setProcessing(true)
      await paymentsApi.membership(artistId, membershipType, 'CARD')
      showToast('Membership purchased successfully')
      await fetchArtistProfile() // Refresh profile after purchase
    } catch (e: any) {
      console.error('Membership purchase error:', e)
      showToast('Membership purchase failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Determine current plan based on membership status
  const getCurrentPlan = () => {
    if (membershipStatus === 'ACTIVE' && artist) {
      // Check if they have a professional/enterprise membership
      return 'professional' // Default to professional if active
    }
    return null // No active plan
  }

  const currentPlan = getCurrentPlan()
  
  const plans = [
    {
      name: 'Artist',
      price: '€50',
      period: '/year',
      description: 'Perfect for emerging artists starting their journey',
      features: [
        'Create detailed artist profile',
        'Upload portfolio (up to 20 images)',
        'Set availability calendar',
        'Receive booking requests',
        'Basic performance analytics',
        'Email support',
        'Free T-shirt included'
      ],
      popular: false,
      current: currentPlan === 'basic' || membershipStatus === 'ACTIVE'
    },
    {
      name: 'Professional Artist',
      price: '€100',
      period: '/year',
      description: 'Ideal for established artists seeking more opportunities',
      features: [
        'Everything in Artist plan',
        'Unlimited portfolio uploads',
        'Priority in search results',
        'Advanced analytics dashboard',
        'Performance badges & ratings',
        'Priority customer support',
        'Referral rewards program',
        'Free T-shirt included'
      ],
      popular: true,
      current: currentPlan === 'professional'
    }
  ]

  const membershipStats = [
    { 
      label: 'Member Since', 
      value: memberSince ? new Date(memberSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently', 
      icon: Calendar 
    },
    { 
      label: 'Total Performances', 
      value: totalBookings.toString(), 
      icon: Star 
    },
    { 
      label: 'Membership Status', 
      value: membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive', 
      icon: Users 
    }
  ]

  const benefits = [
    {
      icon: <Crown className="w-6 h-6 text-gold" />,
      title: 'Priority Placement',
      description: 'Get featured in search results and receive more booking requests'
    },
    {
      icon: <Star className="w-6 h-6 text-gold" />,
      title: 'Performance Analytics',
      description: 'Track your performance metrics and optimize your bookings'
    },
    {
      icon: <Gift className="w-6 h-6 text-gold" />,
      title: 'Referral Rewards',
      description: 'Earn credits for every successful artist referral'
    },
    {
      icon: <Users className="w-6 h-6 text-gold" />,
      title: 'Exclusive Access',
      description: 'Access to premium venues and exclusive performance opportunities'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading membership information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Membership & Billing
        </h1>
        <p className="text-gray-600">
          Manage your membership plan and track your performance
        </p>
      </div>

      {/* Current Membership Status */}
      <div className="card-luxury">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif font-semibold text-navy mb-2">
              Current Membership
            </h2>
            <p className="text-gray-600">
              {membershipStatus === 'ACTIVE' 
                ? `${currentPlan === 'professional' ? 'Professional' : 'Artist'} Plan • Active since ${memberSince ? new Date(memberSince).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}`
                : 'No active membership • Choose a plan below to get started'}
            </p>
          </div>
          {membershipStatus === 'ACTIVE' && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gold">
                {currentPlan === 'professional' ? '€100' : '€50'}/year
              </p>
              {artist?.membershipRenewal && (
                <p className="text-sm text-gray-600">
                  Next billing: {new Date(artist.membershipRenewal).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Membership Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {membershipStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <Icon className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="font-semibold text-navy">{stat.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Membership Plans */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-navy mb-6 gold-underline">
          {membershipStatus === 'ACTIVE' ? 'Upgrade Your Membership' : 'Choose Your Membership Plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`card-luxury relative ${plan.popular ? 'ring-2 ring-gold' : ''} ${plan.current ? 'bg-gold/5' : ''}`}
            >
              {plan.popular && !plan.current && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-navy px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-serif font-semibold text-navy mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-navy">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.current 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : plan.popular 
                      ? 'bg-gold text-navy hover:bg-gold/90' 
                      : 'bg-navy text-white hover:bg-navy/90'
                }`}
                disabled={processing || plan.current}
                onClick={() => handleUpgrade(plan.name === 'Professional Artist' ? 'PROFESSIONAL' : 'PROFESSIONAL')}
              >
                {plan.current ? 'Current Plan' : (processing ? 'Processing…' : membershipStatus === 'ACTIVE' ? 'Upgrade Plan' : 'Choose Plan')}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="card-luxury">
        <h2 className="text-2xl font-serif font-bold text-navy mb-6 gold-underline">
          Membership Benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-start space-x-4"
            >
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-navy mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="card-luxury">
        <h2 className="text-2xl font-serif font-bold text-navy mb-6 gold-underline">
          Billing History
        </h2>
        <div className="space-y-4">
          {artist?.transactions && artist.transactions.length > 0 ? (
            artist.transactions.map((transaction: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-navy">{transaction.type || 'Membership'}</p>
                  <p className="text-sm text-gray-600">
                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-navy">€{transaction.amount || 0}</p>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    paid
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-8">No billing history yet</p>
          )}
        </div>
      </div>

      {/* Referral Program */}
      {referralCode && (
        <div className="card-luxury">
          <h2 className="text-2xl font-serif font-bold text-navy mb-6 gold-underline">
            Referral Program
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-serif font-semibold text-navy mb-4">
                Invite Fellow Artists
              </h3>
              <p className="text-gray-600 mb-4">
                Share your referral code and earn credits for each successful referral.
              </p>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  className="form-input flex-1"
                />
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode)
                    toast.success('Referral code copied!')
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Share this code with other artists. You'll both benefit when they join!
              </p>
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold text-navy mb-4">
                Referral Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loyalty Points</span>
                  <span className="font-semibold text-navy">{artist?.loyaltyPoints || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-semibold text-navy">{totalBookings}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArtistMembership
