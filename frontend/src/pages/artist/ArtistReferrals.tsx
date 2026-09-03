import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Gift, Users, Star, Calendar, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { commonApi, artistsApi } from '@/utils/api'
import { createReferralLink } from '@/utils/referralCode'
import toast from 'react-hot-toast'
import StatusBadge from '@/components/StatusBadge'
import { t } from '@/i18n'

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
      } catch {
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
        toast.error(t('Impossible de charger les parrainages'))
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(t('Copié dans le presse-papiers'))
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
      toast.error(t('Impossible de copier dans le presse-papiers'))
    }
  }


  const statsDisplay = [
    { label: 'Parrainages', value: stats.totalReferrals.toString(), icon: Users },
    { label: 'Artistes actifs', value: stats.activeReferrals.toString(), icon: CheckCircle },
    { label: t('Crédits gagnés'), value: `€${stats.totalCreditsEarned}`, icon: Gift },
    { label: 'Validations en attente', value: stats.pendingReferrals.toString(), icon: Calendar }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-content-secondary">{t('Chargement des parrainages…')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
          {t('Programme de parrainage')}
        </h1>
        <p className="text-content-secondary">
          {t('Invitez d’autres artistes et gagnez des crédits à chaque parrainage abouti')}
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
              className="panel p-6 text-center"
            >
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-2xl font-bold text-content mb-2">{stat.value}</h3>
              <p className="text-content-secondary">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Referral Code Section */}
      <div className="panel p-6">
        <h2 className="text-xl font-serif font-semibold text-content mb-6 gold-underline">
          {t('Votre code de parrainage')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-serif font-semibold text-content mb-4">
              {t('Partagez votre code')}
            </h3>
            <p className="text-content-secondary mb-6">
              {t('Partagez votre code avec d’autres artistes. Lorsqu’ils nous rejoignent et deviennent actifs, vous gagnez des crédits tous les deux.')}
            </p>
            
            {referralCode ? (
              <div className="space-y-4">
                <div>
                  <label className="form-label">{t('Votre code de parrainage')}</label>
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
                    <label className="form-label">{t('Votre lien de parrainage')}</label>
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
              <p className="text-content-secondary">{t('Créez d’abord votre profil d’artiste pour obtenir un code de parrainage.')}</p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-serif font-semibold text-content mb-4">
              {t('Comment ça marche')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-content font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-content">{t('Partagez votre code')}</p>
                  <p className="text-sm text-content-secondary">{t('Envoyez votre code à d’autres artistes')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-content font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-content">{t('Ils nous rejoignent')}</p>
                  <p className="text-sm text-content-secondary">{t('Ils s’inscrivent avec votre code')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-content font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-content">{t('Gagnez des crédits')}</p>
                  <p className="text-sm text-content-secondary">{t('Vous recevez tous les deux des crédits dès qu’ils deviennent actifs')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referred Artists */}
      <div className="panel p-6">
        <h2 className="text-xl font-serif font-semibold text-content mb-6 gold-underline">
          {t('Artistes parrainés')}
        </h2>
        {referrals.length > 0 ? (
          <div className="space-y-4">
            {referrals.map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-surface rounded-card"
              >
                <div className="flex items-center space-x-4">
                  {referral.image ? (
                    <img decoding="async" loading="lazy"
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
                    <h3 className="font-semibold text-content">{referral.name}</h3>
                    <p className="text-sm text-content-secondary">{referral.discipline}</p>
                    <p className="text-xs text-content-secondary">
                      Inscrit le {new Date(referral.joinedDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gold">€{referral.creditsEarned} gagnés</p>
                    <StatusBadge status={referral.status} className="mt-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-content-secondary mx-auto mb-4" />
            <p className="text-content-secondary mb-2">Aucun parrainage</p>
            <p className="text-sm text-content-secondary">
              {t('Partagez votre code pour inviter d’autres artistes et commencer à gagner des crédits.')}
            </p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="panel p-6">
        <h2 className="text-xl font-serif font-semibold text-content mb-6 gold-underline">
          {t('Les avantages du parrainage')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-content mb-2">
              {t('Gagnez des crédits')}
            </h3>
            <p className="text-content-secondary">
              {t('Des crédits pour chaque parrainage qui devient un membre actif')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-content mb-2">
              {t('Développer son réseau')}
            </h3>
            <p className="text-content-secondary">
              {t('Construisez un réseau d’artistes et élargissez vos contacts professionnels')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-content mb-2">
              Aider ses pairs
            </h3>
            <p className="text-content-secondary">
              {t('Aidez d’autres artistes à trouver de nouvelles scènes et à faire grandir leur carrière')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArtistReferrals
