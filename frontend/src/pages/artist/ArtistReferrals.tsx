import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Gift, Users, Star, Calendar, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { commonApi, artistsApi } from '@/utils/api'
import { createReferralLink } from '@/utils/referralCode'
import toast from 'react-hot-toast'

const ArtistReferrals: React.FC = () => {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [referrals, setReferrals] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCreditsEarned: 0,
    pendingReferrals: 0
  })

  useEffect(() => {
    fetchReferrals()
  }, [user])

  const fetchReferrals = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get artist profile for referral code
      try {
        const artistRes = await artistsApi.getMyProfile()
        const artist = artistRes.data?.data
        if (artist?.referralCode) {
          setReferralCode(artist.referralCode)
          setReferralLink(createReferralLink(artist.referralCode))
        }
      } catch (error: any) {
        // No artist profile yet
        console.log('No artist profile found')
      }

      // Get referrals
      const response = await commonApi.getReferrals()
      const data = response.data?.data
      
      if (data) {
        setReferrals(data.referrals || [])
        setStats({
          totalReferrals: data.stats?.totalReferrals || 0,
          activeReferrals: data.stats?.activeReferrals || 0,
          totalCreditsEarned: data.stats?.totalCreditsEarned || 0,
          pendingReferrals: data.stats?.pendingReferrals || 0
        })
        
        // If referral code not set from artist profile, try from referrals response
        if (!referralCode && data.referralCode) {
          setReferralCode(data.referralCode)
          setReferralLink(createReferralLink(data.referralCode))
        }
      }
    } catch (error: any) {
      console.error('Error fetching referrals:', error)
      if (error.response?.status !== 404) {
        toast.error('Failed to load referrals')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
      toast.error('Failed to copy to clipboard')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const statsDisplay = [
    { label: 'Total Referrals', value: stats.totalReferrals.toString(), icon: Users },
    { label: 'Active Artists', value: stats.activeReferrals.toString(), icon: CheckCircle },
    { label: 'Credits Earned', value: `€${stats.totalCreditsEarned}`, icon: Gift },
    { label: 'Pending Approvals', value: stats.pendingReferrals.toString(), icon: Calendar }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referrals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Referral Program
        </h1>
        <p className="text-gray-600">
          Invite fellow artists and earn credits for each successful referral
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-luxury text-center"
            >
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-2">{stat.value}</h3>
              <p className="text-gray-600">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Referral Code Section */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Your Referral Code
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-serif font-semibold text-navy mb-4">
              Share Your Code
            </h3>
            <p className="text-gray-600 mb-6">
              Share your referral code with other artists. When they join and become active members, 
              you'll both earn credits!
            </p>
            
            {referralCode ? (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Referral Code</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={referralCode}
                      readOnly
                      className="form-input flex-1 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(referralCode)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                
                {referralLink && (
                  <div>
                    <label className="form-label">Referral Link</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="form-input flex-1 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(referralLink)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Create your artist profile first to get a referral code.</p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-serif font-semibold text-navy mb-4">
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-navy">Share Your Code</p>
                  <p className="text-sm text-gray-600">Send your referral code to fellow artists</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-navy">They Join</p>
                  <p className="text-sm text-gray-600">Artists register using your referral code</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-navy">Earn Credits</p>
                  <p className="text-sm text-gray-600">Both of you receive credits when they become active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referred Artists */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Referred Artists
        </h2>
        {referrals.length > 0 ? (
          <div className="space-y-4">
            {referrals.map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {referral.image ? (
                    <img
                      src={referral.image}
                      alt={referral.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle fill="%23e5e7eb" cx="24" cy="24" r="24"/%3E%3Cpath fill="%239ca3af" d="M24 14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 18c-4.4 0-8 1.8-8 4v2h16v-2c0-2.2-3.6-4-8-4z"/%3E%3C/svg%3E'
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-gold" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-navy">{referral.name}</h3>
                    <p className="text-sm text-gray-600">{referral.discipline}</p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(referral.joinedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gold">€{referral.creditsEarned} earned</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {referral.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No referrals yet</p>
            <p className="text-sm text-gray-500">
              Share your referral code to invite other artists and start earning credits!
            </p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Referral Benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-navy mb-2">
              Earn Credits
            </h3>
            <p className="text-gray-600">
              Get credits for each successful referral that becomes an active member
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-navy mb-2">
              Grow Network
            </h3>
            <p className="text-gray-600">
              Build a network of talented artists and expand your professional connections
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-navy mb-2">
              Help Others
            </h3>
            <p className="text-gray-600">
              Help fellow artists discover new opportunities and grow their careers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArtistReferrals
