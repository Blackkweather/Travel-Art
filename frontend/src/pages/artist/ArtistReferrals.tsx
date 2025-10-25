import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Gift, Users, Star, Calendar, CheckCircle } from 'lucide-react'

const ArtistReferrals: React.FC = () => {
  const [copied, setCopied] = useState(false)
  
  const referralCode = 'TRAVELART-SOPHIE'
  const referralLink = `https://travelart.com/register?ref=${referralCode}`
  
  const referrals = [
    {
      id: '1',
      name: 'Isabella Garcia',
      email: 'isabella@example.com',
      discipline: 'Flamenco Dancer',
      joinedDate: '2024-01-15',
      status: 'active',
      creditsEarned: 50,
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=100&h=100&fit=crop'
    },
    {
      id: '2',
      name: 'Marco Silva',
      email: 'marco@example.com',
      discipline: 'DJ',
      joinedDate: '2024-01-20',
      status: 'active',
      creditsEarned: 50,
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop'
    },
    {
      id: '3',
      name: 'Jean-Michel Dubois',
      email: 'jean@example.com',
      discipline: 'Jazz Saxophonist',
      joinedDate: '2024-02-01',
      status: 'pending',
      creditsEarned: 0,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop'
    },
    {
      id: '4',
      name: 'Maria Santos',
      email: 'maria@example.com',
      discipline: 'Fado Singer',
      joinedDate: '2024-02-10',
      status: 'active',
      creditsEarned: 50,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'
    },
    {
      id: '5',
      name: 'Yoga Master Ananda',
      email: 'ananda@example.com',
      discipline: 'Yoga Instructor',
      joinedDate: '2024-02-15',
      status: 'active',
      creditsEarned: 50,
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&h=100&fit=crop'
    }
  ]

  const stats = [
    { label: 'Total Referrals', value: '8', icon: Users },
    { label: 'Active Artists', value: '5', icon: CheckCircle },
    { label: 'Credits Earned', value: '€250', icon: Gift },
    { label: 'Pending Approvals', value: '1', icon: Calendar }
  ]

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
        {stats.map((stat, index) => {
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
              you'll both earn €50 credits!
            </p>
            
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
            </div>
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
                  <p className="text-sm text-gray-600">Both of you receive €50 credits when they become active</p>
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
                <img
                  src={referral.image}
                  alt={referral.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-navy">{referral.name}</h3>
                  <p className="text-sm text-gray-600">{referral.discipline}</p>
                  <p className="text-xs text-gray-500">Joined {new Date(referral.joinedDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gold">€{referral.creditsEarned} earned</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                    {referral.status}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gold font-bold">◆</span>
                  <span className="text-sm text-gray-600">4.8</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
              Get €50 credits for each successful referral that becomes an active member
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
