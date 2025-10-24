import React from 'react'
import { motion } from 'framer-motion'
import { CreditCard, ShoppingCart, TrendingUp, Gift, Star, Calendar, CheckCircle } from 'lucide-react'

const HotelCredits: React.FC = () => {
  
  const creditPackages = [
    {
      id: 'starter',
      name: 'Starter Package',
      credits: 10,
      price: 1500,
      originalPrice: 1800,
      savings: 300,
      popular: false,
      features: [
        '10 artist booking credits',
        'Access to all artist profiles',
        'Basic venue management',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional Package',
      credits: 25,
      price: 3500,
      originalPrice: 4000,
      savings: 500,
      popular: true,
      features: [
        '25 artist booking credits',
        'Priority artist matching',
        'Advanced analytics',
        'Priority support',
        'Custom performance requests'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise Package',
      credits: 50,
      price: 6500,
      originalPrice: 7500,
      savings: 1000,
      popular: false,
      features: [
        '50 artist booking credits',
        'Multi-venue management',
        'Dedicated account manager',
        '24/7 premium support',
        'Custom event packages'
      ]
    }
  ]

  const transactions = [
    {
      id: '1',
      type: 'purchase',
      credits: 25,
      amount: 3500,
      date: '2024-01-15',
      status: 'completed',
      description: 'Professional Package Purchase',
      paymentMethod: 'Credit Card ****1234'
    },
    {
      id: '2',
      type: 'booking',
      credits: -2,
      amount: 0,
      date: '2024-01-20',
      status: 'completed',
      description: 'Sophie Laurent - Rooftop Terrace',
      paymentMethod: 'Credits Used'
    },
    {
      id: '3',
      type: 'booking',
      credits: -3,
      amount: 0,
      date: '2024-01-25',
      status: 'completed',
      description: 'Marco Silva - Beach Club DJ Set',
      paymentMethod: 'Credits Used'
    },
    {
      id: '4',
      type: 'refund',
      credits: 1,
      amount: 0,
      date: '2024-02-01',
      status: 'completed',
      description: 'Cancellation Refund - Isabella Garcia',
      paymentMethod: 'Credit Refund'
    },
    {
      id: '5',
      type: 'booking',
      credits: -2,
      amount: 0,
      date: '2024-02-05',
      status: 'completed',
      description: 'Jean-Michel Dubois - Jazz Concert',
      paymentMethod: 'Credits Used'
    }
  ]

  const currentCredits = 19
  const totalSpent = 3500
  const totalBookings = 4

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

  const handlePurchase = (packageId: string) => {
    // Handle purchase logic here
    console.log('Purchasing package:', packageId)
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
          <h3 className="text-3xl font-bold text-navy mb-2">{currentCredits}</h3>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditPackages.map((pkg, index) => (
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
                  <span className="text-lg text-gray-500 line-through">€{pkg.originalPrice.toLocaleString()}</span>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Save €{pkg.savings.toLocaleString()}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {pkg.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(pkg.id)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  pkg.popular 
                    ? 'bg-gold text-navy hover:bg-gold/90' 
                    : 'bg-navy text-white hover:bg-navy/90'
                }`}
              >
                Purchase Package
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
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{transaction.description}</h3>
                  <p className="text-sm text-gray-600">{transaction.paymentMethod}</p>
                  <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                  {transaction.type}
                </div>
                <div className="mt-2">
                  <div className={`text-lg font-bold ${
                    transaction.credits > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.credits > 0 ? '+' : ''}{transaction.credits} credits
                  </div>
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
