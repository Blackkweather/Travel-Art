import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Building, Star, MapPin, Users, Calendar, Award } from 'lucide-react'
import Footer from '../components/Footer'

const PartnersPage: React.FC = () => {
  const { scrollY } = useScroll()
  
  // Scroll-based animations for header
  const headerBackground = useTransform(scrollY, [0, 100], ['rgba(11, 31, 63, 0.1)', 'rgba(11, 31, 63, 0.1)'])
  const textColor = useTransform(scrollY, [0, 100], ['white', 'white'])
  const partners = [
    {
      name: 'Hotel Plaza Athénée',
      location: 'Paris, France',
      category: 'Luxury Palace',
      rating: 4.9,
      bookings: 45,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      description: 'Iconic luxury hotel in the heart of Paris with stunning Eiffel Tower views and world-class rooftop venues.',
      specialties: ['Eiffel Tower Views', 'Intimate Concerts', 'Classical Music'],
      performanceSpots: ['Rooftop Terrace', 'Grand Ballroom', 'Elegant Lounge']
    },
    {
      name: 'Hotel Negresco',
      location: 'Nice, France',
      category: 'Historic Luxury',
      rating: 4.8,
      bookings: 38,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      description: 'Historic luxury hotel on the French Riviera with Mediterranean views and legendary rooftop performances.',
      specialties: ['Mediterranean Views', 'Jazz Performances', 'Sunset Sets'],
      performanceSpots: ['Rooftop Jazz Lounge', 'Garden Terrace', 'Beach Club']
    },
    {
      name: 'La Mamounia',
      location: 'Marrakech, Morocco',
      category: 'Palace Hotel',
      rating: 4.9,
      bookings: 32,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      description: 'Iconic palace hotel with traditional Moroccan architecture and magical rooftop performances under the stars.',
      specialties: ['Atlas Mountain Views', 'Traditional Music', 'Cultural Performances'],
      performanceSpots: ['Atlas Rooftop Bar', 'Pool Deck Stage', 'Traditional Courtyard']
    },
    {
      name: 'Palácio Belmonte',
      location: 'Lisbon, Portugal',
      category: 'Boutique Palace',
      rating: 4.7,
      bookings: 28,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      description: 'Boutique palace hotel with panoramic views of Lisbon and intimate rooftop concerts.',
      specialties: ['Lisbon Views', 'Fado Music', 'Intimate Venues'],
      performanceSpots: ['Terrace Bar', 'Wine Cellar', 'Garden Pavilion']
    },
    {
      name: 'Nobu Hotel Ibiza',
      location: 'Ibiza, Spain',
      category: 'Beach Resort',
      rating: 4.8,
      bookings: 25,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      description: 'Luxury beachfront hotel with world-class dining and legendary rooftop DJ performances.',
      specialties: ['Beach Views', 'Electronic Music', 'DJ Sets'],
      performanceSpots: ['Rooftop Beach Club', 'Sunset Lounge', 'Pool Deck']
    },
    {
      name: 'The Ritz-Carlton',
      location: 'Barcelona, Spain',
      category: 'Luxury Chain',
      rating: 4.6,
      bookings: 22,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      description: 'Elegant hotel in Barcelona with stunning city views and sophisticated performance spaces.',
      specialties: ['City Views', 'Sophisticated Venues', 'Cultural Events'],
      performanceSpots: ['Sky Terrace', 'Elegant Lounge', 'Conference Center']
    }
  ]

  const benefits = [
    {
      icon: <Building className="w-8 h-8 text-gold" />,
      title: 'Exclusive Access',
      description: 'Partner with the world\'s most prestigious hotels and luxury venues'
    },
    {
      icon: <Star className="w-8 h-8 text-gold" />,
      title: 'Premium Quality',
      description: 'Work with verified, professional artists who deliver exceptional performances'
    },
    {
      icon: <Users className="w-8 h-8 text-gold" />,
      title: 'Dedicated Support',
      description: 'Personal account managers and 24/7 support for all your needs'
    },
    {
      icon: <Award className="w-8 h-8 text-gold" />,
      title: 'Brand Recognition',
      description: 'Enhance your hotel\'s reputation with curated artistic experiences'
    }
  ]

  const stats = [
    { label: 'Partner Hotels', value: '23', icon: Building },
    { label: 'Performance Venues', value: '67', icon: MapPin },
    { label: 'Successful Events', value: '342', icon: Calendar },
    { label: 'Average Rating', value: '4.8', icon: Star }
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10"
        style={{
          background: headerBackground,
          padding: '10px 80px',
          height: '55px',
          overflow: 'visible'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity -ml-4">
            <img 
              src="/logo-transparent.png" 
              alt="Travel Art" 
              style={{
                height: '150px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.div style={{ color: textColor }}>
              <Link to="/how-it-works" className="hover:text-gold transition-colors font-medium text-sm">
                How it Works
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/partners" className="hover:text-gold transition-colors font-medium text-sm">
                Partners
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/pricing" className="hover:text-gold transition-colors font-medium text-sm">
                Pricing
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-artists" className="hover:text-gold transition-colors font-medium text-sm">
                Top Artists
              </Link>
            </motion.div>
            <motion.div style={{ color: textColor }}>
              <Link to="/top-hotels" className="hover:text-gold transition-colors font-medium text-sm">
                Top Hotels
              </Link>
            </motion.div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <motion.div style={{ color: textColor }}>
              <Link to="/login" className="hover:text-gold transition-colors font-medium text-sm px-4 py-2">
                Sign In
              </Link>
            </motion.div>
            <Link to="/register" className="bg-gold text-navy px-6 py-2 rounded-2xl font-semibold hover:bg-gold/90 transition-all duration-200 text-sm shadow-lg">
              Join
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative py-20 pt-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
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
              Our Luxury Hotel
              <span className="block text-gold">Partners</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover the world's most prestigious hotels offering stunning rooftop venues and intimate performance spaces for unforgettable artistic experiences.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-navy" />
                  </div>
                  <h3 className="text-3xl font-bold text-navy mb-2">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
            Featured Partners
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the world's most luxurious hotels with stunning rooftop venues and intimate performance spaces
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-luxury overflow-hidden"
            >
              <div className="relative">
                <img
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/600x400/0B1F3F/C9A63C?text=' + encodeURIComponent(partner.name)
                  }}
                />
                <div className="absolute top-4 right-4 bg-gold text-navy px-3 py-1 rounded-full text-sm font-medium">
                  ⭐ {partner.rating}
                </div>
                <div className="absolute bottom-4 left-4 bg-navy text-white px-3 py-1 rounded-full text-sm font-medium">
                  {partner.category}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                  {partner.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {partner.location}
                </p>
                
                <p className="text-gray-600 text-sm mb-4">
                  {partner.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-navy mb-2">Specialties:</h4>
                  <div className="flex flex-wrap gap-2">
                    {partner.specialties.map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="px-2 py-1 bg-gold/20 text-gold text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-navy mb-2">Performance Spots:</h4>
                  <div className="flex flex-wrap gap-2">
                    {partner.performanceSpots.map((spot, spotIndex) => (
                      <span
                        key={spotIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {partner.bookings} bookings
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {partner.rating} rating
                  </span>
                </div>

                <button className="w-full btn-primary">
                  View Venues
                </button>
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
              Partnership Benefits
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Why luxury hotels choose to partner with Travel Art
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
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-6 py-20 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-navy mb-6 gold-underline">
            What Our Partners Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="card-luxury"
          >
            <div className="flex items-center mb-4">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              "Travel Art has transformed our rooftop terrace into a magical performance space. The artists are incredibly talented and our guests love the intimate concerts."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mr-4">
                <Building className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h4 className="font-semibold text-navy">Marie Dubois</h4>
                <p className="text-sm text-gray-600">Hotel Plaza Athénée, Paris</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card-luxury"
          >
            <div className="flex items-center mb-4">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              "The jazz performances on our rooftop have become legendary. Travel Art connects us with world-class artists who create unforgettable experiences."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mr-4">
                <Building className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h4 className="font-semibold text-navy">Jean-Pierre Martin</h4>
                <p className="text-sm text-gray-600">Hotel Negresco, Nice</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card-luxury"
          >
            <div className="flex items-center mb-4">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              "Our Atlas rooftop bar has become the place to be in Marrakech. The cultural performances under the stars are absolutely magical."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mr-4">
                <Building className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h4 className="font-semibold text-navy">Ahmed Benali</h4>
                <p className="text-sm text-gray-600">La Mamounia, Marrakech</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-navy text-white py-20 pb-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-serif font-bold mb-6">
              Ready to Become a Partner?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our exclusive network of luxury hotels and start offering unforgettable artistic experiences to your guests.
            </p>
            <a href="/register" className="btn-primary text-lg px-8 py-4">
              Join as Hotel Partner
            </a>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default PartnersPage
