import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Check, Star, Calendar, Gift, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { paymentsApi, artistsApi } from '@/utils/api'
import { toast } from 'react-hot-toast'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/i18n'
import { formatDate, formatShortDate } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

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
      showToast(t('Créez d’abord votre profil d’artiste.'))
      return
    }
    
    const artistId = artist?.id || user?.artist?.id
    
    try {
      setProcessing(true)
      await paymentsApi.membership(artistId, membershipType, 'CARD')
      showToast(t('Adhésion mise à jour'))
      await fetchArtistProfile() // Refresh profile after purchase
    } catch (e: any) {
      console.error('Membership purchase error:', e)
      // The server explains *why* it refused (for example that payment
      // processing is not configured yet, in which case retrying is futile).
      // Telling the artist to "try again" regardless was misleading.
      // The reason lives at data.error.message; reading data.message meant
      // the server's explanation was thrown away every time.
      showToast(
        e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          t('L’adhésion n’a pas pu être mise à jour.')
      )
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
      period: t('/an'),
      description: t('Pensé pour les artistes qui se lancent'),
      features: [
        t('Un profil d’artiste détaillé'),
        t('Portfolio jusqu’à 20 images'),
        t('Calendrier de disponibilités'),
        t('Réception des demandes de réservation'),
        'Statistiques essentielles',
        t('Assistance par e-mail'),
        'T-shirt offert'
      ],
      tier: 'ARTIST' as const,
      popular: false,
      current: currentPlan === 'ARTIST'
    },
    {
      name: t('Artiste confirmé'),
      price: '€100',
      period: t('/an'),
      description: t('Pour les artistes confirmés qui veulent plus de dates'),
      features: [
        t('Tout ce que comprend la formule Artiste'),
        t('Portfolio illimité'),
        t('Priorité dans les résultats'),
        t('Tableau de bord statistique avancé'),
        t('Distinctions et évaluations'),
        'Assistance prioritaire',
        t('Programme de parrainage'),
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
      label: t('Représentations'), 
      value: totalBookings.toString(), 
      icon: Star 
    },
    { 
      label: t('Statut de l’adhésion'), 
      value: membershipStatus === 'ACTIVE' ? t('Active') : t('Inactive'), 
      icon: Users 
    }
  ]

  const benefits = [
    {
      icon: <Crown className="w-6 h-6 text-gold" />,
      title: 'Mise en avant prioritaire',
      description: t('Apparaissez en tête des résultats et recevez davantage de demandes')
    },
    {
      icon: <Star className="w-6 h-6 text-gold" />,
      title: t('Statistiques de performance'),
      description: t('Suivez vos indicateurs et optimisez vos dates')
    },
    {
      icon: <Gift className="w-6 h-6 text-gold" />,
      title: t('Récompenses de parrainage'),
      description: t('Gagnez des crédits pour chaque artiste parrainé')
    },
    {
      icon: <Users className="w-6 h-6 text-gold" />,
      title: t('Accès exclusif'),
      description: t('Accès aux plus beaux lieux et à des dates exclusives')
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-content-secondary">{t('Chargement de votre abonnement…')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SEOHead title={t('Adhésion') + ' — Travel Art'} />
      {/* Header */}
      <div>
        <h1 className="page-head__title">
          {t('Adhésion et facturation')}
        </h1>
        <p className="text-sm text-content-secondary">
          {t('Gérez votre adhésion et suivez votre activité')}
        </p>
      </div>

      {/* Current Membership Status */}
      <div className="bg-surface-raised rounded-card border border-line p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-content mb-2">
              {t('Adhésion en cours')}
            </h2>
            <p className="text-sm text-content-secondary">
              {membershipStatus === 'ACTIVE' 
                ? t('Formule {plan} • active depuis le {date}', {
                    plan: currentPlan === 'PROFESSIONAL' ? t('Artiste confirmé') : t('Artiste'),
                    date: memberSince ? formatDate(memberSince) : t('Récemment'),
                  })
                : t('Aucune adhésion active • choisissez une formule ci-dessous pour commencer')}
            </p>
          </div>
          {membershipStatus === 'ACTIVE' && (
            <div className="text-right">
              <p className="text-2xl font-bold text-content">
                {currentPlan === 'PROFESSIONAL' ? '€100' : '€50'}{t('/an')}
              </p>
              {artist?.membershipRenewal && (
                <p className="text-xs text-content-secondary mt-1">
                  {t('Prochaine échéance : {date}', { date: formatShortDate(artist.membershipRenewal) })}
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
          {membershipStatus === 'ACTIVE' ? t('Faire évoluer votre adhésion') : t('Choisir votre formule')}
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
                  ? 'border-gold'
                  : plan.current
                  ? 'border-gold bg-surface-sunken'
                  : 'border-line hover:border-line-strong'
              }`}
            >
              {plan.popular && !plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="badge border-gold bg-gold text-[var(--text-on-gold)]">
                    {t('Le plus choisi')}
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <span className="badge-positive">
                    {t('Formule actuelle')}
                  </span>
                </div>
              )}
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="mb-2 font-serif text-xl text-content">
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
                  {plan.current
                    ? t('Formule actuelle')
                    : processing
                      ? t('Traitement…')
                      : membershipStatus === 'ACTIVE'
                        ? t('Changer de formule')
                        : t('Choisir cette formule')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-surface-raised rounded-card border border-line p-6">
        <h2 className="text-xl font-semibold text-content mb-6">
          {t('Les avantages de l’adhésion')}
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
          {t('Historique de facturation')}
        </h2>
        <div className="space-y-3">
          {artist?.transactions && artist.transactions.length > 0 ? (
            artist.transactions.map((transaction: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-surface rounded-card border border-line hover:bg-surface-sunken transition-colors">
                <div>
                  <p className="text-sm font-medium text-content">{transaction.type || 'Adhésion'}</p>
                  <p className="text-xs text-content-secondary mt-1">
                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-content">€{transaction.amount || 0}</p>
                  <StatusBadge status="PAID" className="mt-1" />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">{t('Aucun historique de facturation')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Referral Program */}
      {referralCode && (
        <div className="bg-surface-raised rounded-card border border-line p-6">
          <h2 className="text-xl font-semibold text-content mb-6">
            {t('Programme de parrainage')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-semibold text-content mb-3">
                {t('Invitez d’autres artistes')}
              </h3>
              <p className="text-sm text-content-secondary mb-4">
                {t('Partagez votre code de parrainage et gagnez des crédits à chaque parrainage abouti.')}
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
                    toast.success(t('Code de parrainage copié'))
                  }}
                >{t('Copier')}</button>
              </div>
              <p className="text-xs text-content-secondary">
                {t('Partagez ce code avec d’autres artistes : vous y gagnez tous les deux lorsqu’ils nous rejoignent.')}
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-content mb-4">
                {t('Statistiques de parrainage')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-surface rounded-card">
                  <span className="text-sm text-content-secondary">{t('Points de fidélité')}</span>
                  <span className="text-sm font-semibold text-content">{artist?.loyaltyPoints || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-surface rounded-card">
                  <span className="text-sm text-content-secondary">{t('Réservations')}</span>
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
