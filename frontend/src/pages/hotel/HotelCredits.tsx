import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, ShoppingCart, TrendingUp, Gift, Star, Calendar, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { hotelsApi, paymentsApi } from '@/utils/api'

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
      const txRes = await paymentsApi.transactions({ userId: hotel.id, limit: 20 })
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
        return <ShoppingCart className="w-5 h-5 text-green-600" />
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'refund':
        return <Gift className="w-5 h-5 text-purple-600" />
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800'
      case 'booking':
        return 'bg-blue-100 text-blue-800'
      case 'refund':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePurchase = async (packageId: string) => {
    // Ensure TypeScript recognizes the parameter as used in all build environments
    void packageId
    if (!hotelId) return
    try {
      setProcessing(packageId)
      await paymentsApi.purchaseCredits(hotelId, packageId, 'CARD')
      const [creditsRes, txRes] = await Promise.all([
        hotelsApi.getCredits(hotelId),
        paymentsApi.transactions({ userId: hotelId, limit: 20 })
      ])
      setCredits(creditsRes.data.data)
      setTransactions(txRes.data.data.transactions || [])
    } catch (e) {
      setError('Failed to complete purchase')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Credit Management
        </h1>
        <p className="text-gray-600">
          Manage your credits and purchase packages for artist bookings
        </p>
      </div>

      {/* Current Credits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-luxury text-center"
        >
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-3xl font-bold text-navy mb-2">{credits ? credits.availableCredits : (loading ? '—' : 0)}</h3>
          <p className="text-gray-600">Available Credits</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card-luxury text-center"
        >
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-3xl font-bold text-navy mb-2">€{totalSpent.toLocaleString()}</h3>
          <p className="text-gray-600">Total Spent</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card-luxury text-center"
        >
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gold" />
          </div>
          <h3 className="text-3xl font-bold text-navy mb-2">{totalBookings}</h3>
          <p className="text-gray-600">Total Bookings</p>
        </motion.div>
      </div>

      {/* Credit Packages */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Purchase Credit Packages
        </h2>
        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg: any, index: number) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`border-2 rounded-lg p-6 relative ${
                pkg.popular ? 'border-gold bg-gold/5' : 'border-gray-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-navy px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                  {pkg.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-navy">{pkg.credits}</span>
                  <span className="text-gray-600 ml-2">credits</span>
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl font-bold text-gold">€{pkg.price.toLocaleString()}</span>
                  {pkg.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">€{pkg.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                {pkg.savings ? (
                  <div className="text-sm text-green-600 font-medium">Save €{pkg.savings.toLocaleString()}</div>
                ) : null}
              </div>

              {Array.isArray(pkg.features) && (
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={processing === pkg.id}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
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
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Transaction History
        </h2>
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type === 'CREDIT_PURCHASE' ? 'purchase' : transaction.type === 'REFUND' ? 'refund' : 'booking')}
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{transaction.type.replace('_', ' ')}</h3>
                  <p className="text-sm text-gray-600">{transaction.paymentMethod || '—'}</p>
                  <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionColor(transaction.type === 'CREDIT_PURCHASE' ? 'purchase' : transaction.type === 'REFUND' ? 'refund' : 'booking')}`}>
                  {transaction.type}
                </div>
                <div className="mt-2">
                  {transaction.amount > 0 && (
                    <div className="text-sm text-gray-600">
                      €{transaction.amount.toLocaleString()}
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
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Credit Usage Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-serif font-semibold text-navy mb-4">
              How Credits Work
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Star className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Each booking typically costs 1-3 credits depending on artist level and duration
                </span>
              </li>
              <li className="flex items-start">
                <Star className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Credits are deducted when you confirm a booking
                </span>
              </li>
              <li className="flex items-start">
                <Star className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Cancellations within 48 hours receive full credit refunds
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-serif font-semibold text-navy mb-4">
              Best Practices
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Purchase larger packages for better value and savings
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Monitor your credit balance to avoid booking interruptions
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Use credits strategically for high-value performances
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
