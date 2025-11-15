import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Music, Users, Building, Clock, Phone, Mail, Globe, ArrowLeft } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const HotelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  // Mock hotel data - in real app, fetch from API
  const hotels: Record<string, any> = {
    '1': {
      id: '1',
      name: 'Hotel Plaza Athénée',
      location: 'Paris, France',
      rating: 4.9,
      bookings: 45,
      performanceSpots: ['Rooftop Terrace', 'Grand Ballroom'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop',
      description: 'Luxury hotel in the heart of Paris with stunning views of the Eiffel Tower. Perfect for intimate acoustic sets and grand performances.',
      specialties: ['Eiffel Tower Views', 'Intimate Concerts', 'Classical Music'],
      recentArtists: ['Sophie Laurent', 'Jean-Michel Dubois', 'Maria Santos'],
      address: '25 Avenue Montaigne, 75008 Paris, France',
      phone: '+33 1 53 67 66 65',
      email: 'contact@plaza-athenee.com',
      website: 'www.plaza-athenee.com',
      activities: [
        {
          title: 'Rooftop Terrace Performances',
          description: 'Intimate acoustic sets with panoramic views of the Eiffel Tower. Perfect for sunset concerts and evening performances.',
          time: 'Evening (6 PM - 10 PM)',
          capacity: '50 guests',
          type: 'Outdoor'
        },
        {
          title: 'Grand Ballroom Concerts',
          description: 'Elegant classical music performances in our historic ballroom. Features world-class acoustics and stunning chandeliers.',
          time: 'Evening (7 PM - 11 PM)',
          capacity: '200 guests',
          type: 'Indoor'
        },
        {
          title: 'Jazz Lounge Sessions',
          description: 'Intimate jazz performances in our sophisticated lounge. Perfect for small ensembles and solo artists.',
          time: 'Night (9 PM - 12 AM)',
          capacity: '30 guests',
          type: 'Indoor'
        }
      ],
      amenities: ['Wi-Fi', 'Parking', 'Restaurant', 'Spa', 'Fitness Center', 'Concierge'],
      nearbyAttractions: ['Eiffel Tower (0.5 km)', 'Champs-Élysées (0.3 km)', 'Louvre Museum (2 km)']
    },
    '2': {
      id: '2',
      name: 'Hotel Negresco',
      location: 'Nice, France',
      rating: 4.8,
      bookings: 38,
      performanceSpots: ['Rooftop Jazz Lounge', 'Garden Terrace'],
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop',
      description: 'Historic luxury hotel on the French Riviera with Mediterranean views and legendary rooftop performances.',
      specialties: ['Mediterranean Views', 'Jazz Performances', 'Sunset Sets'],
      recentArtists: ['Marco Silva', 'Jean-Michel Dubois', 'Isabella Garcia'],
      address: '37 Promenade des Anglais, 06000 Nice, France',
      phone: '+33 4 93 16 64 00',
      email: 'contact@hotel-negresco-nice.com',
      website: 'www.hotel-negresco-nice.com',
      activities: [
        {
          title: 'Rooftop Jazz Lounge',
          description: 'Legendary jazz performances with stunning Mediterranean views. Features live music every evening.',
          time: 'Evening (7 PM - 11 PM)',
          capacity: '80 guests',
          type: 'Outdoor'
        },
        {
          title: 'Garden Terrace Concerts',
          description: 'Intimate garden performances surrounded by Mediterranean flora. Perfect for acoustic sets and small ensembles.',
          time: 'Afternoon & Evening (4 PM - 9 PM)',
          capacity: '40 guests',
          type: 'Outdoor'
        }
      ],
      amenities: ['Wi-Fi', 'Beach Access', 'Restaurant', 'Spa', 'Pool', 'Concierge'],
      nearbyAttractions: ['Promenade des Anglais (0.1 km)', 'Old Nice (1 km)', 'Castle Hill (1.5 km)']
    },
    '3': {
      id: '3',
      name: 'La Mamounia',
      location: 'Marrakech, Morocco',
      rating: 4.9,
      bookings: 32,
      performanceSpots: ['Atlas Rooftop Bar', 'Pool Deck Stage'],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=600&fit=crop',
      description: 'Iconic palace hotel with traditional Moroccan architecture and magical rooftop performances under the stars.',
      specialties: ['Atlas Mountain Views', 'Traditional Music', 'Cultural Performances'],
      recentArtists: ['Yoga Master Ananda', 'Isabella Garcia', 'Sophie Laurent'],
      address: 'Avenue Bab Jdid, Marrakech 40040, Morocco',
      phone: '+212 5243-88600',
      email: 'contact@mamounia.com',
      website: 'www.mamounia.com',
      activities: [
        {
          title: 'Atlas Rooftop Bar Performances',
          description: 'Magical performances under the stars with views of the Atlas Mountains. Features traditional Moroccan music and modern fusion.',
          time: 'Evening (7 PM - 12 AM)',
          capacity: '100 guests',
          type: 'Outdoor'
        },
        {
          title: 'Pool Deck Stage',
          description: 'Intimate poolside performances in a stunning setting. Perfect for acoustic sets and cultural showcases.',
          time: 'Afternoon & Evening (5 PM - 10 PM)',
          capacity: '60 guests',
          type: 'Outdoor'
        }
      ],
      amenities: ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Garden', 'Concierge'],
      nearbyAttractions: ['Jemaa el-Fnaa (1 km)', 'Bahia Palace (1.5 km)', 'Atlas Mountains (30 km)']
    },
    '4': {
      id: '4',
      name: 'Palácio Belmonte',
      location: 'Lisbon, Portugal',
      rating: 4.7,
      bookings: 28,
      performanceSpots: ['Terrace Bar', 'Wine Cellar'],
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=600&fit=crop',
      description: 'Boutique palace hotel with panoramic views of Lisbon and intimate rooftop concerts.',
      specialties: ['Lisbon Views', 'Fado Music', 'Intimate Venues'],
      recentArtists: ['Maria Santos', 'Marco Silva', 'Sophie Laurent'],
      address: 'Pátio Dom Fradique 14, 1100-624 Lisbon, Portugal',
      phone: '+351 21 881 66 00',
      email: 'contact@palaciobelmonte.com',
      website: 'www.palaciobelmonte.com',
      activities: [
        {
          title: 'Terrace Bar Fado Nights',
          description: 'Authentic Fado music performances with panoramic views of Lisbon. Intimate setting for traditional Portuguese music.',
          time: 'Evening (8 PM - 11 PM)',
          capacity: '35 guests',
          type: 'Outdoor'
        },
        {
          title: 'Wine Cellar Concerts',
          description: 'Intimate acoustic performances in our historic wine cellar. Perfect for small ensembles and solo artists.',
          time: 'Evening (7 PM - 10 PM)',
          capacity: '25 guests',
          type: 'Indoor'
        }
      ],
      amenities: ['Wi-Fi', 'Restaurant', 'Wine Cellar', 'Garden', 'Concierge'],
      nearbyAttractions: ['São Jorge Castle (0.5 km)', 'Alfama District (0.3 km)', 'Tagus River (1 km)']
    },
    '5': {
      id: '5',
      name: 'Nobu Hotel Ibiza',
      location: 'Ibiza, Spain',
      rating: 4.8,
      bookings: 25,
      performanceSpots: ['Rooftop Beach Club', 'Sunset Lounge'],
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop',
      description: 'Luxury beachfront hotel with world-class dining and legendary rooftop DJ performances.',
      specialties: ['Beach Views', 'Electronic Music', 'DJ Sets'],
      recentArtists: ['Marco Silva', 'Isabella Garcia', 'Jean-Michel Dubois'],
      address: 'Carrer de Cala de Bou, 07830 Sant Josep de sa Talaia, Ibiza, Spain',
      phone: '+34 971 19 22 22',
      email: 'contact@nobuhotelibiza.com',
      website: 'www.nobuhotelibiza.com',
      activities: [
        {
          title: 'Rooftop Beach Club DJ Sets',
          description: 'Legendary DJ performances with stunning beach views. Features world-renowned DJs and electronic music artists.',
          time: 'Night (10 PM - 3 AM)',
          capacity: '300 guests',
          type: 'Outdoor'
        },
        {
          title: 'Sunset Lounge Acoustic Sets',
          description: 'Intimate acoustic performances during sunset. Perfect for relaxed evening entertainment.',
          time: 'Evening (6 PM - 10 PM)',
          capacity: '50 guests',
          type: 'Outdoor'
        }
      ],
      amenities: ['Wi-Fi', 'Beach Access', 'Pool', 'Restaurant', 'Spa', 'Nightclub'],
      nearbyAttractions: ['Cala de Bou Beach (0.1 km)', 'Ibiza Town (15 km)', 'San Antonio (10 km)']
    },
    '6': {
      id: '6',
      name: 'The Ritz-Carlton',
      location: 'Barcelona, Spain',
      rating: 4.6,
      bookings: 22,
      performanceSpots: ['Sky Terrace', 'Elegant Lounge'],
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&h=600&fit=crop',
      description: 'Elegant hotel in Barcelona with stunning city views and sophisticated performance spaces.',
      specialties: ['City Views', 'Sophisticated Venues', 'Cultural Events'],
      recentArtists: ['Sophie Laurent', 'Yoga Master Ananda', 'Maria Santos'],
      address: 'Avinguda Diagonal, 640, 08017 Barcelona, Spain',
      phone: '+34 932 00 90 00',
      email: 'contact@ritzcarltonbarcelona.com',
      website: 'www.ritzcarlton.com/barcelona',
      activities: [
        {
          title: 'Sky Terrace Performances',
          description: 'Sophisticated performances with panoramic city views. Features classical and contemporary music.',
          time: 'Evening (7 PM - 11 PM)',
          capacity: '120 guests',
          type: 'Outdoor'
        },
        {
          title: 'Elegant Lounge Concerts',
          description: 'Intimate classical and jazz performances in our elegant lounge. Perfect for sophisticated evening entertainment.',
          time: 'Evening (8 PM - 11 PM)',
          capacity: '60 guests',
          type: 'Indoor'
        }
      ],
      amenities: ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Fitness Center', 'Concierge'],
      nearbyAttractions: ['Sagrada Familia (3 km)', 'Park Güell (2 km)', 'Las Ramblas (4 km)']
    }
  }

  const hotel = hotels[id || '1']

  if (!hotel) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-serif font-bold text-navy mb-4">Hotel Not Found</h1>
          <p className="text-gray-600 mb-8">The hotel you're looking for doesn't exist.</p>
          <Link to="/top-hotels" className="btn-primary">
            Back to Hotels
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-navy/60"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
              {hotel.name}
            </h1>
            <p className="text-xl flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />
              {hotel.location}
            </p>
          </motion.div>
        </div>
        <Link
          to="/top-hotels"
          className="absolute top-6 left-6 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hotels
        </Link>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card-luxury mb-8"
            >
              <h2 className="text-3xl font-serif font-bold text-navy mb-4 gold-underline">
                About {hotel.name}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {hotel.description}
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="text-xl font-bold text-navy">{hotel.rating}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-xl font-bold text-navy">{hotel.bookings}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-serif font-semibold text-navy mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {hotel.specialties.map((specialty: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-serif font-semibold text-navy mb-3">Recent Artists</h3>
                <div className="flex flex-wrap gap-2">
                  {hotel.recentArtists.map((artist: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Activities Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card-luxury"
            >
              <h2 className="text-3xl font-serif font-bold text-navy mb-6 gold-underline">
                Performance Activities & Venues
              </h2>
              <div className="space-y-6">
                {hotel.activities.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="border-l-4 border-gold pl-6 py-4 bg-gold/5 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-serif font-semibold text-navy">
                        {activity.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activity.type === 'Outdoor' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {activity.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Capacity: {activity.capacity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card-luxury sticky top-6"
            >
              <h3 className="text-2xl font-serif font-bold text-navy mb-6">Contact Information</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
                  <p className="text-gray-600">{hotel.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                  <a href={`tel:${hotel.phone}`} className="text-gray-600 hover:text-gold">
                    {hotel.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                  <a href={`mailto:${hotel.email}`} className="text-gray-600 hover:text-gold">
                    {hotel.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gold flex-shrink-0" />
                  <a href={`https://${hotel.website}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gold">
                    {hotel.website}
                  </a>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="text-lg font-serif font-semibold text-navy mb-4">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((amenity: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-serif font-semibold text-navy mb-4">Nearby Attractions</h4>
                <ul className="space-y-2">
                  {hotel.nearbyAttractions.map((attraction: string, index: number) => (
                    <li key={index} className="text-gray-600 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gold" />
                      {attraction}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default HotelDetailsPage

