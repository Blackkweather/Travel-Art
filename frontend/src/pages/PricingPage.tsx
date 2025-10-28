import React from 'react'
import { motion } from 'framer-motion'
import { Check, Star, CreditCard, Users, Calendar, Award } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ArtistRank, RANK_CONFIG, type RankTier } from '../components/ArtistRank'

const PricingPage: React.FC = () => {
  const artistPlans = [
    {
      name: 'Artist',
      price: '€50',
      period: '/year',
      description: 'Perfect for emerging artists starting their journey',
      features: [
        'Earn €50 per booking credit',
        'Create detailed artist profile',
        'Upload portfolio (up to 20 images)',
        'Set availability calendar',
        'Receive booking requests',
        'Basic performance analytics',
        'Email support',
        'Free T-shirt included'
      ],
      popular: false
    },
    {
      name: 'Professional Artist',
      price: '€100',
      period: '/year',
      description: 'Ideal for established artists seeking more opportunities',
      features: [
        'Earn €50 per booking credit',
        'Everything in Artist plan',
        'Unlimited portfolio uploads',
        'Priority in search results',
        'Advanced analytics dashboard',
        'Performance badges & ratings',
        'Priority customer support',
        'Referral rewards program',
        'Free T-shirt included'
      ],
      popular: true
    }
  ]

  const hotelPlans = [
    {
      name: 'Starter Package',
      credits: '10',
      price: '€1,500',
      description: 'Perfect for boutique hotels and intimate venues',
      features: [
        '10 artist booking credits (€150 each - First Purchase)',
        'Access to all artist profiles',
        'Basic venue management',
        'Booking confirmation system',
        'Email support',
        'Performance rating system'
      ],
      popular: false
    },
    {
      name: 'Professional Package',
      credits: '25',
      bonusCredits: '4',
      price: '€3,500',
      description: 'Ideal for luxury hotels with regular events',
      features: [
        '25 artist booking credits + 4 FREE bonus credits (€150 each - First Purchase)',
        'Everything in Starter',
        'Advanced venue management',
        'Priority artist matching',
        'Custom performance requests',
        'Analytics dashboard',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Enterprise Package',
      credits: '50',
      bonusCredits: '10',
      price: '€6,500',
      description: 'For large hotel chains and exclusive venues',
      features: [
        '50 artist booking credits + 10 FREE bonus credits (€150 each - First Purchase)',
        'Everything in Professional',
        'Multi-venue management',
        'Exclusive artist access',
        'Custom event packages',
        'Dedicated account manager',
        '24/7 premium support'
      ],
      popular: false
    }
  ]

  const benefits = [
    {
      icon: <Star className="w-8 h-8 text-gold" />,
      title: 'Quality Guaranteed',
      description: 'All artists are verified professionals with proven track records'
    },
    {
      icon: <Users className="w-8 h-8 text-gold" />,
      title: 'Curated Network',
      description: 'Access to exclusive luxury hotels and top-tier venues worldwide'
    },
    {
      icon: <CreditCard className="w-8 h-8 text-gold" />,
      title: 'Secure Payments',
      description: 'Safe and reliable payment processing with fraud protection'
    },
    {
      icon: <Calendar className="w-8 h-8 text-gold" />,
      title: 'Flexible Booking',
      description: 'Easy cancellation policies and rescheduling options'
    }
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <div className="relative py-20 pt-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Luxury hotel" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-navy/70"></div>
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              Simple & Transparent
              <span className="block text-gold">Pricing</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. Artists earn €50 per booking and pay annual membership. Hotels get 50% off first credit purchase.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Artist Plans */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
            Artist Membership Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join as an artist and start performing at luxury hotels worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-6">
          {artistPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`card-luxury relative ${plan.popular ? 'ring-2 ring-gold' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-navy px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
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

              <button className={`w-full py-3 rounded-lg font-medium transition-colors ${
                plan.popular 
                  ? 'bg-gold text-navy hover:bg-gold/90' 
                  : 'bg-navy text-white hover:bg-navy/90'
              }`}>
                Choose Plan
              </button>
            </motion.div>
          ))}
        </div>

        {/* Artist Earnings Explanation */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="card-luxury bg-gold/10 border-2 border-gold">
            <div className="flex items-start space-x-4">
              <div className="bg-gold/20 p-3 rounded-full">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                  How Artist Earnings Work
                </h3>
                <p className="text-gray-700 mb-2">
                  Every time a hotel books you using 1 credit (€300), you earn <strong className="text-gold">€50</strong> directly.
                </p>
                <p className="text-sm text-gray-600">
                  Multiple bookings = more earnings! Plus accommodation and meals are included during your performance stay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Plans */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
              Hotel Credit Packages
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Purchase credits to book artists for your luxury venues and events
            </p>
            <div className="mt-6 inline-flex items-center space-x-2 bg-gold/20 px-6 py-3 rounded-xl">
              <Star className="w-5 h-5 text-gold" />
              <p className="text-navy font-semibold">
                First Purchase: 50% OFF - €150 per credit | Regular Price: €300 per credit
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hotelPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`card-luxury relative ${plan.popular ? 'ring-2 ring-gold' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gold text-navy px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-serif font-semibold text-navy mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-navy">{plan.credits}</span>
                    <span className="text-gray-600 ml-2">credits</span>
                    {plan.bonusCredits && (
                      <div className="mt-2">
                        <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm font-bold">
                          + {plan.bonusCredits} FREE BONUS
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gold">{plan.price}</div>
                    <div className="text-sm text-gray-500">
                      <span className="line-through">€{parseInt(plan.price.replace('€', '').replace(',', '')) * 2}</span>
                      <span className="ml-2 text-green-600 font-semibold">50% OFF First Purchase</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Next purchase: €300 per credit
                    </div>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                      <span className={`${feature.includes('FREE') ? 'text-gold font-semibold' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.popular 
                    ? 'bg-gold text-navy hover:bg-gold/90' 
                    : 'bg-navy text-white hover:bg-navy/90'
                }`}>
                  Purchase Credits
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Artist Ranking System */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
              Artist Ranking System
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Artists earn ranks based on performance, ratings, and experience. Each tier unlocks new opportunities and visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {(Object.keys(RANK_CONFIG) as RankTier[]).map((tier, index) => (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-luxury text-center hover:scale-105 transition-transform"
                style={{ borderTop: `4px solid ${RANK_CONFIG[tier].color}` }}
              >
                <div className="flex justify-center mb-4">
                  <ArtistRank tier={tier} size="lg" animated={false} />
                </div>
                <h3 
                  className="text-2xl font-serif font-bold mb-2"
                  style={{ color: RANK_CONFIG[tier].color }}
                >
                  {RANK_CONFIG[tier].label}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {RANK_CONFIG[tier].description}
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    {tier === 'red' && 'Starting Point - Everyone Begins Here'}
                    {tier === 'blue' && '2+ Bookings'}
                    {tier === 'green' && '10+ Bookings'}
                    {tier === 'gold' && '20+ Bookings'}
                    {tier === 'platinum' && '30+ Bookings'}
                    {tier === 'diamond' && 'On Request Only'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border-2 border-blue-500 px-6 py-4 rounded-xl">
              <Award className="w-6 h-6 text-blue-600" />
              <p className="text-navy font-medium">
                All artists start as <span className="font-bold text-blue-600">Rising (Blue)</span> and can progress to <span className="font-bold text-gray-600">Master (Platinum)</span> through excellent performance!
              </p>
            </div>
            <div className="inline-flex items-center space-x-2 bg-cyan-50 border-2 border-cyan-500 px-6 py-4 rounded-xl">
              <Star className="w-6 h-6 text-cyan-600" />
              <p className="text-navy font-medium">
                <span className="font-bold text-cyan-500">Superstar (Diamond)</span> tier is exclusive and available on request only to exceptional artists!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
            Why Choose Travel Art?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the benefits of our premium platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                {benefit.title}
              </h3>
              <p className="text-gray-600">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card-luxury"
            >
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                How does pricing work?
              </h3>
              <p className="text-gray-600">
                Artists pay an annual membership fee to join the platform. Hotels purchase credits to book artists. We offer different packages to suit your needs, with special offers for new partners.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card-luxury"
            >
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Can I cancel or reschedule?
              </h3>
              <p className="text-gray-600">
                Yes! We offer flexible policies. You can cancel or reschedule with advance notice. Specific terms vary depending on your membership or package.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card-luxury"
            >
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                What payment methods are accepted?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, bank transfers, and PayPal. All payments are processed securely.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card-luxury"
            >
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Contact us to learn about special introductory offers and trial options for new members.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-navy text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-serif font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join Travel Art today and start creating magical moments at luxury hotels worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="btn-primary text-lg px-8 py-4">
                Join as Artist
              </a>
              <a href="/register" className="btn-secondary text-lg px-8 py-4">
                Join as Hotel
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default PricingPage
