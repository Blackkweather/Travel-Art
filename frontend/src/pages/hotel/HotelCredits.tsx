import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, ShoppingCart, TrendingUp, Gift, Star, Calendar, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { hotelsApi, paymentsApi } from '@/utils/api'
import { transactionTypeLabel } from '@/utils/i18n'

const HotelCredits: React.FC = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [hotelId, setHotelId] = useState<string>('')
  const [packages, setPackages] = useState<any[]>([])
  const [credits, setCredits] = useState<{ availableCredits: number; totalCredits: number; usedCredits: number } | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const totalSpent = useMemo(() => {
    const purchases = transactions.filter((t) => t.type === 'CREDIT_PURCHASE')
    return purchases.reduce((sum, t) => sum + (t.amount || 0), 0)
  }, [transactions])

  const totalBookings = useMemo(() => transactions.filter((t) => t.type === 'BOOKING_FEE').length, [transactions])

  async function loadAll() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [hotelRes, pkgRes] = await Promise.all([
        hotelsApi.getByUser(user.id),
        paymentsApi.getPackages(),
      ])
      const hotel = hotelRes.data.data
      setHotelId(hotel.id)
      setPackages(pkgRes.data.data || [])
      const creditsRes = await hotelsApi.getCredits(hotel.id)
      setCredits(creditsRes.data.data)
      const txRes = await paymentsApi.transactions({ limit: 20 })
      setTransactions(txRes.data.data.transactions || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load credits data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'refund':
        return <Gift className="w-5 h-5 text-purple-600" />
      default:
        return <CreditCard className="w-5 h-5 text-content-secondary" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400'
      case 'booking':
        return 'bg-blue-100 text-blue-800'
      case 'refund':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-surface-sunken text-content'
    }
  }

  const handlePurchase = async (packageId: string) => {
    // Ensure TypeScript recognizes the parameter as used in all build environments
    void packageId
    if (!hotelId) return
    try {
      setProcessing(packageId)
      const res = await paymentsApi.purchaseCredits(hotelId, packageId, 'CARD')

      // The balance is never granted here. This opens a Stripe Checkout
      // Session and hands off to Stripe; the credits arrive when the
      // signature-verified webhook confirms the charge, and the page reloads
      // them on return via ?checkout=success.
      const checkoutUrl = res.data?.data?.checkoutUrl
      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      }

      setError('Impossible de démarrer le paiement. Veuillez réessayer.')
    } catch (e: any) {
      // The server says why it refused — for example that payment processing
      // is not configured yet, in which case retrying will not help.
      setError(e?.response?.data?.error?.message || 'Failed to start checkout')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="dashboard-title mb-3 gold-underline">
          Gestion des crédits
        </h1>
        <p className="dashboard-subtitle">
          Gérez vos crédits et vos formules pour réserver des artistes
        </p>
      </div>

      {/* Current Credits Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="dashboard-stat-card text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 rounded-card flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-3xl font-bold text-content mb-2 count-up">{credits ? credits.availableCredits : (loading ? '—' : 0)}</h3>
          <p className="section-subtitle">Crédits disponibles</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="dashboard-stat-card text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-card flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-content mb-2 count-up">€{totalSpent.toLocaleString('fr-FR')}</h3>
          <p className="section-subtitle">Total dépensé</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="dashboard-stat-card text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-card flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-3xl font-bold text-content mb-2 count-up">{totalBookings}</h3>
          <p className="section-subtitle">Réservations</p>
        </motion.div>
      </div>

      {/* Credit Packages */}
      <div className="card-luxury fade-in-up-delay-1">
        <h2 className="section-title gold-underline">
          Acheter des crédits
        </h2>
        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg: any, index: number) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`border-2 rounded-card p-6 relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                pkg.popular ? 'border-gold bg-gradient-to-br from-gold/10 to-gold/5 shadow-md' : 'border-line hover:border-gold/30'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-navy px-4 py-1 rounded-full text-sm font-medium">
                    Le plus choisi
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-serif font-semibold text-content mb-2">
                  {pkg.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-content">{pkg.credits}</span>
                  <span className="text-content-secondary ml-2">crédits</span>
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl font-bold text-gold">€{pkg.price.toLocaleString('fr-FR')}</span>
                  {pkg.originalPrice && (
                    <span className="text-lg text-content-secondary line-through">€{pkg.originalPrice.toLocaleString('fr-FR')}</span>
                  )}
                </div>
                {pkg.savings ? (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Save €{pkg.savings.toLocaleString('fr-FR')}</div>
                ) : null}
              </div>

              {Array.isArray(pkg.features) && (
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-content-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={processing === pkg.id}
                className={`w-full py-3 rounded-card font-medium transition-colors ${
                  pkg.popular 
                    ? 'bg-gold text-navy hover:bg-gold/90' 
                    : 'bg-navy text-white hover:bg-navy/90'
                } disabled:opacity-60`}
              >
                {processing === pkg.id ? 'Processing…' : 'Purchase Package'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="card-luxury fade-in-up-delay-2">
        <h2 className="section-title gold-underline">
          Historique des transactions
        </h2>
        <div className="space-y-3">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between p-5 bg-surface-sunken rounded-card border border-line hover:border-gold/30 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-surface-raised rounded-card flex items-center justify-center shadow-sm border border-line">
                  {getTransactionIcon(transaction.type === 'CREDIT_PURCHASE' ? 'purchase' : transaction.type === 'REFUND' ? 'refund' : 'booking')}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-content text-lg mb-1">{transaction.type.replace('_', ' ')}</h3>
                  <p className="text-sm text-content-secondary font-medium mb-1">{transaction.paymentMethod || '—'}</p>
                  <p className="text-xs text-content-secondary">{new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionColor(transaction.type === 'CREDIT_PURCHASE' ? 'purchase' : transaction.type === 'REFUND' ? 'refund' : 'booking')}`}>
                  {transactionTypeLabel(transaction.type)}
                </div>
                <div className="mt-2">
                  {transaction.amount > 0 && (
                    <div className="text-sm text-content-secondary">
                      €{transaction.amount.toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Credit Usage Tips */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-content mb-6 gold-underline">
          Bien utiliser ses crédits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-serif font-semibold text-content mb-4">
              Comment fonctionnent les crédits
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Star className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-content-secondary">
                  Une réservation coûte généralement 1 à 3 crédits, selon le niveau de l’artiste et la durée
                </span>
              </li>
              <li className="flex items-start">
                <Star className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-content-secondary">
                  Les crédits sont débités à la confirmation de la réservation
                </span>
              </li>
              <li className="flex items-start">
                <Star className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-content-secondary">
                  Cancellations within 48 hours receive full credit refunds
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-serif font-semibold text-content mb-4">
              Bonnes pratiques
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-content-secondary">
                  Les formules plus importantes sont plus avantageuses
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-content-secondary">
                  Surveillez votre solde pour ne pas interrompre vos réservations
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-content-secondary">
                  Réservez vos crédits pour les dates les plus importantes
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotelCredits
