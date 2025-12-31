import React from 'react'
import { motion } from 'framer-motion'
import { Users, Building, Calendar, Star, CreditCard, Music } from 'lucide-react'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'

const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: 'Join as Artist or Hotel',
      description: 'Create your profile and showcase your talent or luxury venue. Artists can upload their portfolio, set availability, and define their specialties. Hotels can list their performance spaces and accommodation.',
      details: [
        'Artists: Upload photos/videos of performances',
        'Hotels: Showcase rooftop terraces and intimate venues',
        'Set your availability calendar',
        'Define your artistic discipline and price range'
      ]
    },
    {
      icon: <Building className="w-8 h-8 text-white" />,
      title: 'Discover Perfect Matches',
      description: 'Our intelligent matching system connects artists with hotels based on location, availability, artistic style, and venue requirements. Browse profiles and find your ideal collaboration.',
      details: [
        'Smart matching algorithm',
        'Filter by location, date, and style',
        'View detailed profiles and portfolios',
        'Read reviews and ratings'
      ]
    },
    {
      icon: <Calendar className="w-8 h-8 text-white" />,
      title: 'Book Your Experience',
      description: 'Hotels use credits to book artists for their rooftop performances, intimate concerts, or special events. Artists receive accommodation and the opportunity to perform in luxury settings.',
      details: [
        'Hotels purchase credit packages',
        'Artists pay annual membership fee',
        'Secure booking system',
        'Flexible cancellation policies'
      ]
    },
    {
      icon: <Music className="w-8 h-8 text-white" />,
      title: 'Create Magic Together',
      description: 'Artists perform in stunning rooftop venues, intimate lounges, and luxury hotel spaces. Hotels provide accommodation and unforgettable experiences for their guests.',
      details: [
        'Rooftop performances with city views',
        'Intimate acoustic sets in luxury lounges',
        'Jazz ensembles in elegant ballrooms',
        'DJ sets at sunset beach clubs'
      ]
    },
    {
      icon: <Star className="w-8 h-8 text-white" />,
      title: 'Rate & Review',
      description: 'After each performance, hotels rate artists based on their performance quality, professionalism, and guest satisfaction. Artists see aggregated badges and feedback.',
      details: [
        'Hotels rate artists (1-5 stars)',
        'Artists see performance badges',
        'Detailed feedback system',
        'Build reputation over time'
      ]
    },
    {
      icon: <CreditCard className="w-8 h-8 text-white" />,
      title: 'Earn & Grow',
      description: 'Artists earn accommodation credits and build their portfolio. Hotels enhance their guest experience and create memorable moments. Both parties grow their network.',
      details: [
        'Artists: Free accommodation + performance fees',
        'Hotels: Enhanced guest experience',
        'Referral rewards program',
        'Loyalty points system'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-cream">
      <SimpleNavbar />
      
      {/* Hero Section */}
      <div className="relative py-20 pt-32 overflow-hidden">
        {/* Background Image - Resort Island */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Resort island" 
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy/80"></div>
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-white">
              How Travel Art
              <span className="block text-gold">Works</span>
            </h1>
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
              Connect luxury hotels with talented hearts for unforgettable rooftop performances and intimate experiences. 
              From jazz saxophonists on Parisian terraces to DJs spinning sunset sets in Ibiza.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-luxury"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center shadow-lg">
                    <div className="text-white">
                      {step.icon}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-serif font-semibold text-navy mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-gold rounded-full mr-3"></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
              Why Choose Travel Art?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the perfect blend of luxury hospitality and artistic excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Building className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Luxury Venues
              </h3>
              <p className="text-gray-600">
                Perform in the world's most prestigious hotels with stunning rooftop views and intimate settings.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Curated Artists
              </h3>
              <p className="text-gray-600">
                Work with verified, professional artists who specialize in creating magical moments.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-navy mb-4">
                Quality Guaranteed
              </h3>
              <p className="text-gray-600">
                Our rating system ensures only the best artists perform at your luxury venues.
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
              Ready to Create Magic?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join Travel Art today and start connecting luxury hotels with talented hearts for unforgettable experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="btn-primary text-lg px-8 py-4 text-white">
                Join as Artist
              </a>
              <a href="/register" className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-navy transition-all duration-300 shadow-soft text-lg">
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

export default HowItWorksPage
