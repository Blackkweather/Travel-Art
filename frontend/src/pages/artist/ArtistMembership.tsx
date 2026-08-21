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
  const [membershipTier, setMembershipTier] = useState<string | null>(null)
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
        setMembershipTier(artistData.membershipTier ?? null)
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

  const handleUpgrade = async (membershipType: 'ARTIST' | 'PROFESSIONAL') => {
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
      // The server explains *why* it refused (for example that payment
      // processing is not configured yet, in which case retrying is futile).
      // Telling the artist to "try again" regardless was misleading.
      showToast(e?.response?.data?.message || 'Membership purchase failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // The held tier comes from the active Membership row. This used to return
  // 'professional' for anyone with an ACTIVE status, which combined with the
  // plan flags below marked *both* plans as the current one and disabled both
  // buttons — an active member could never change plan.
  const currentPlan = membershipStatus === 'ACTIVE' ? membershipTier : null

  const plans = [
    {
      name: 'Artiste',
      price: '€50',
      period: '/year',
      description: 'Pensé pour les artistes qui se lancent',
      features: [
        'Un profil d’artiste détaillé',
        'Portfolio jusqu’à 20 images',
        'Calendrier de disponibilités',
        'Réception des demandes de réservation',
        'Statistiques essentielles',
        'Assistance par e-mail',
        'T-shirt offert'
      ],
      tier: 'ARTIST' as const,
      popular: false,
      current: currentPlan === 'ARTIST'
    },
    {
      name: 'Professional Artist',
      price: '€100',
      period: '/year',
      description: 'Pour les artistes confirmés qui veulent plus de dates',
      features: [
        'Tout ce que comprend la formule Artiste',
        'Portfolio illimité',
        'Priorité dans les résultats',
        'Tableau de bord statistique avancé',
        'Distinctions et évaluations',
        'Assistance prioritaire',
        'Programme de parrainage',
        'T-shirt offert'
      ],
      tier: 'PROFESSIONAL' as const,
      popular: true,
      current: currentPlan === 'PROFESSIONAL'
    }
  ]

  const membershipStats = [
    { 
      label: 'Membre depuis', 
      value: memberSince ? new Date(memberSince).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently', 
      icon: Calendar 
    },
    { 
      label: 'Représentations', 
      value: totalBookings.toString(), 
      icon: Star 
    },
    { 
      label: 'Statut de l’adhésion', 
      value: membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive', 
      icon: Users 
    }
  ]

  const benefits = [
    {
      icon: <Crown className="w-6 h-6 text-gold" />,
      title: 'Mise en avant prioritaire',
      description: 'Apparaissez en tête des résultats et recevez davantage de demandes'
    },
    {
      icon: <Star className="w-6 h-6 text-gold" />,
      title: 'Statistiques de performance',
      description: 'Suivez vos indicateurs et optimisez vos dates'
    },
    {
      icon: <Gift className="w-6 h-6 text-gold" />,
      title: 'Récompenses de parrainage',
      description: 'Gagnez des crédits pour chaque artiste parrainé'
    },
    {
      icon: <Users className="w-6 h-6 text-gold" />,
      title: 'Accès exclusif',
      description: 'Accès aux plus beaux lieux et à des dates exclusives'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-content-secondary">Chargement de votre abonnement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-content mb-2">
          Adhésion et facturation
        </h1>
        <p className="text-sm text-content-secondary">
          Gérez votre adhésion et suivez votre activité
        </p>
      </div>

      {/* Current Membership Status */}
      <div className="bg-surface-raised rounded-card border border-line p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-content mb-2">
              Adhésion en cours
            </h2>
            <p className="text-sm text-content-secondary">
              {membershipStatus === 'ACTIVE' 
                ? `${currentPlan === 'PROFESSIONAL' ? 'Professional' : 'Artist'} Plan • Active since ${memberSince ? new Date(memberSince).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}`
                : 'No active membership • Choose a plan below to get started'}
            </p>
          </div>
          {membershipStatus === 'ACTIVE' && (
            <div className="text-right">
              <p className="text-2xl font-bold text-content">
                {currentPlan === 'PROFESSIONAL' ? '€100' : '€50'}/year
              </p>
              {artist?.membershipRenewal && (
                <p className="text-xs text-content-secondary mt-1">
                  Next billing: {new Date(artist.membershipRenewal).toLocaleDateString('fr-FR')}
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
              <div key={index} className="bg-surface rounded-card p-4 border border-line">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-card bg-gold/10">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-content-secondary uppercase tracking-wide mb-1">{stat.label}</p>
                    <p className="text-lg font-semibold text-content">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Membership Plans */}
      <div>
        <h2 className="text-2xl font-semibold text-content mb-6">
          {membershipStatus === 'ACTIVE' ? 'Upgrade Your Membership' : 'Choose Your Membership Plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative bg-surface-raised rounded-card border-2 transition-all hover:shadow-lg ${
                plan.popular && !plan.current
                  ? 'border-gold shadow-md'
                  : plan.current
                  ? 'border-gold/50 bg-gold/5'
                  : 'border-line hover:border-gold/30'
              }`}
            >
              {plan.popular && !plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-navy px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                    Le plus choisi
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-content mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-content-secondary mb-4">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-content">{plan.price}</span>
                    <span className="text-content-secondary ml-2 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                        plan.popular ? 'bg-gold/20' : 'bg-gold/10'
                      }`}>
                        <Check className={`w-3 h-3 ${
                          plan.popular ? 'text-gold' : 'text-gold'
                        }`} />
                      </div>
                      <span className="text-sm text-content-secondary leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-3 px-4 rounded-card font-semibold text-sm transition-all ${
                    plan.current 
                      ? 'bg-surface-sunken text-content-secondary cursor-not-allowed' 
                      : plan.popular 
                        ? 'bg-gold text-navy hover:bg-gold/90 shadow-md hover:shadow-lg' 
                        : 'bg-navy text-white hover:bg-navy/90 shadow-md hover:shadow-lg'
                  }`}
                  disabled={processing || plan.current}
                  onClick={() => handleUpgrade(plan.tier)}
                >
                  {plan.current ? 'Current Plan' : (processing ? 'Processing…' : membershipStatus === 'ACTIVE' ? 'Upgrade Plan' : 'Choose Plan')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-surface-raised rounded-card border border-line p-6">
        <h2 className="text-xl font-semibold text-content mb-6">
          Les avantages de l’adhésion
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start gap-4 p-4 rounded-card hover:bg-surface transition-colors"
            >
              <div className="w-10 h-10 bg-gold/10 rounded-card flex items-center justify-center flex-shrink-0">
                {React.cloneElement(benefit.icon, { className: "w-5 h-5 text-gold" })}
              </div>
              <div>
                <h3 className="text-base font-semibold text-content mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-content-secondary">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-surface-raised rounded-card border border-line p-6">
        <h2 className="text-xl font-semibold text-content mb-6">
          Historique de facturation
        </h2>
        <div className="space-y-3">
          {artist?.transactions && artist.transactions.length > 0 ? (
            artist.transactions.map((transaction: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-surface rounded-card border border-line hover:bg-surface-sunken transition-colors">
                <div>
                  <p className="text-sm font-medium text-content">{transaction.type || 'Membership'}</p>
                  <p className="text-xs text-content-secondary mt-1">
                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('fr-FR') : 'Unknown date'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-content">€{transaction.amount || 0}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400 text-xs font-medium rounded-card">
                    Paid
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-content-secondary text-center py-8">Aucun historique de facturation</p>
          )}
        </div>
      </div>

      {/* Referral Program */}
      {referralCode && (
        <div className="bg-surface-raised rounded-card border border-line p-6">
          <h2 className="text-xl font-semibold text-content mb-6">
            Programme de parrainage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-semibold text-content mb-3">
                Invitez d’autres artistes
              </h3>
              <p className="text-sm text-content-secondary mb-4">
                Partagez votre code de parrainage et gagnez des crédits à chaque parrainage abouti.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  className="flex-1 px-4 py-2 bg-surface border border-line rounded-card text-sm font-mono text-content"
                />
                <button 
                  className="px-4 py-2 bg-navy text-white rounded-card text-sm font-medium hover:bg-navy/90 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode)
                    toast.success('Code de parrainage copié')
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-content-secondary">
                Partagez ce code avec d’autres artistes : vous y gagnez tous les deux lorsqu’ils nous rejoignent.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-content mb-4">
                Statistiques de parrainage
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-surface rounded-card">
                  <span className="text-sm text-content-secondary">Points de fidélité</span>
                  <span className="text-sm font-semibold text-content">{artist?.loyaltyPoints || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-surface rounded-card">
                  <span className="text-sm text-content-secondary">Réservations</span>
                  <span className="text-sm font-semibold text-content">{totalBookings}</span>
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
