import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Calendar, Heart } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { bookingsApi, hotelsApi } from '@/utils/api'

const HotelArtists: React.FC = () => {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [hotelId, setHotelId] = useState<string>('')
  const [bookingModal, setBookingModal] = useState<{ open: boolean; artistId?: string; start?: string; end?: string }>({ open: false })
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!user?.id) return
      try {
        const res = await hotelsApi.getByUser(user.id)
        setHotelId((res.data as any)?.data?.id || '')
      } catch {
        // ignore
      }
    })()
  }, [user?.id])
  
  const artists = [
    {
      id: '1',
      name: 'Sophie Laurent',
      discipline: 'Classical Pianist',
      location: 'Paris, France',
      rating: 4.9,
      hotelRating: '4.8',
      specialties: ['Rooftop Piano', 'Intimate Concerts', 'Classical Music'],
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      description: 'Award-winning classical pianist specializing in intimate rooftop performances with stunning city views.',
      availability: 'Available',
      nextAvailable: '2024-02-15',
      totalBookings: 24,
      isFavorite: false,
      priceRange: '€500-1000'
    },
    {
      id: '2',
      name: 'Marco Silva',
      discipline: 'DJ',
      location: 'Lisbon, Portugal',
      rating: 4.8,
      hotelRating: '4.7',
      specialties: ['Sunset DJ Sets', 'Deep House', 'Electronic Music'],
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      description: 'International DJ creating unforgettable rooftop experiences with stunning sunset sets.',
      availability: 'Available',
      nextAvailable: '2024-02-12',
      totalBookings: 18,
      isFavorite: true,
      priceRange: '€300-800'
    },
    {
      id: '3',
      name: 'Jean-Michel Dubois',
      discipline: 'Jazz Saxophonist',
      location: 'Nice, France',
      rating: 4.9,
      hotelRating: '4.9',
      specialties: ['Jazz Ensembles', 'Bebop', 'Contemporary Jazz'],
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      description: 'Professional jazz saxophonist creating magical moments on hotel rooftops with intimate jazz ensembles.',
      availability: 'Busy',
      nextAvailable: '2024-02-20',
      totalBookings: 15,
      isFavorite: false
    },
    {
      id: '4',
      name: 'Isabella Garcia',
      discipline: 'Flamenco Dancer',
      location: 'Seville, Spain',
      rating: 4.7,
      hotelRating: '4.6',
      specialties: ['Flamenco Shows', 'Traditional Dance', 'Cultural Performances'],
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      description: 'Professional flamenco dancer performing traditional and contemporary shows on hotel rooftops.',
      availability: 'Available',
      nextAvailable: '2024-02-18',
      totalBookings: 12,
      isFavorite: false,
      priceRange: '€200-500'
    },
    {
      id: '5',
      name: 'Yoga Master Ananda',
      discipline: 'Yoga Instructor',
      location: 'Marrakech, Morocco',
      rating: 4.8,
      hotelRating: '4.5',
      specialties: ['Sunrise Sessions', 'Meditation', 'Wellness'],
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      description: 'Certified yoga instructor specializing in sunrise rooftop sessions and meditation workshops.',
      availability: 'Available',
      nextAvailable: '2024-02-14',
      totalBookings: 20,
      isFavorite: true
    },
    {
      id: '6',
      name: 'Maria Santos',
      discipline: 'Fado Singer',
      location: 'Lisbon, Portugal',
      rating: 4.6,
      hotelRating: '4.4',
      specialties: ['Fado Music', 'Portuguese Culture', 'Intimate Performances'],
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
      description: 'Traditional fado singer bringing Portuguese soul to luxury hotel terraces and intimate venues.',
      availability: 'Available',
      nextAvailable: '2024-02-16',
      totalBookings: 10,
      isFavorite: false,
      priceRange: '€350-600'
    }
  ]

  const disciplines = ['all', 'Classical Pianist', 'DJ', 'Jazz Saxophonist', 'Flamenco Dancer', 'Yoga Instructor', 'Fado Singer']
  const locations = ['all', 'Paris, France', 'Lisbon, Portugal', 'Nice, France', 'Seville, Spain', 'Marrakech, Morocco']

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artist.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artist.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDiscipline = selectedDiscipline === 'all' || artist.discipline === selectedDiscipline
    const matchesLocation = selectedLocation === 'all' || artist.location === selectedLocation
    
    return matchesSearch && matchesDiscipline && matchesLocation
  })

  const sortedArtists = [...filteredArtists].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating
      case 'price':
        return parseInt((a.priceRange || '€0').split('-')[0].replace('€', '')) - parseInt((b.priceRange || '€0').split('-')[0].replace('€', ''))
      case 'bookings':
        return b.totalBookings - a.totalBookings
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const toggleFavorite = (_artistId: string) => {
    // Toggle favorite logic here
    // TODO: Implement favorite toggle functionality
  }

  const openBooking = (artistId: string) => {
    const start = new Date()
    start.setDate(start.getDate() + 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 1)
    setBookingModal({ open: true, artistId, start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) })
    setBookingError(null)
  }

  const createBooking = async () => {
    if (!hotelId || !bookingModal.artistId || !bookingModal.start || !bookingModal.end) return
    try {
      setProcessing(true)
      setBookingError(null)
      await bookingsApi.create({
        hotelId,
        artistId: bookingModal.artistId,
        startDate: new Date(bookingModal.start).toISOString(),
        endDate: new Date(bookingModal.end).toISOString(),
        creditsUsed: 1
      })
      setBookingModal({ open: false })
      alert('Booking request sent')
    } catch (e: any) {
      setBookingError(e?.response?.data?.message || 'Failed to create booking')
    } finally {
      setProcessing(false)
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-green-100 text-green-800'
      case 'Busy':
        return 'bg-yellow-100 text-yellow-800'
      case 'Unavailable':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
          Browse Artists
        </h1>
        <p className="text-gray-600">
          Discover talented artists for your luxury hotel performances
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card-luxury">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Search Artists</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, discipline, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">Discipline</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="form-input"
            >
              {disciplines.map(discipline => (
                <option key={discipline} value={discipline}>
                  {discipline === 'all' ? 'All Disciplines' : discipline}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="form-input"
            >
              {locations.map(location => (
                <option key={location} value={location}>
                  {location === 'all' ? 'All Locations' : location}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input w-40"
            >
              <option value="rating">Rating</option>
              <option value="price">Price</option>
              <option value="bookings">Bookings</option>
              <option value="name">Name</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {sortedArtists.length} artist{sortedArtists.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedArtists.map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="card-luxury overflow-hidden"
          >
            <div className="relative">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => toggleFavorite(artist.id)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  artist.isFavorite 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${artist.isFavorite ? 'fill-current' : ''}`} />
              </button>
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-navy flex items-center space-x-1">
                <span className="text-gold font-bold">◆</span>
                <span>{artist.rating}</span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-serif font-semibold text-navy mb-2">
                {artist.name}
              </h3>
              <p className="text-gold font-medium mb-3">{artist.discipline}</p>
              <p className="text-gray-600 text-sm mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {artist.location}
              </p>
              
              <p className="text-gray-600 text-sm mb-4">
                {artist.description}
              </p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-navy mb-2">Specialties:</h4>
                <div className="flex flex-wrap gap-2">
                  {artist.specialties.map((specialty, specIndex) => (
                    <span
                      key={specIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <span className="text-gold font-bold mr-1">◆</span>
                    <span className="text-sm font-medium text-navy">{artist.hotelRating}</span>
                  </div>
                  <p className="text-xs text-gray-600">Hotel Rating</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 text-gold mr-1" />
                    <span className="text-sm font-medium text-navy">{artist.totalBookings}</span>
                  </div>
                  <p className="text-xs text-gray-600">Bookings</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(artist.availability)}`}>
                  {artist.availability}
                </span>
                <span className="text-xs text-gray-500">
                  Next: {new Date(artist.nextAvailable).toLocaleDateString()}
                </span>
              </div>

              <div className="flex space-x-2">
                <a className="flex-1 btn-primary" href={`/artist/${artist.id}`}>
                  View Profile
                </a>
                <button className="btn-secondary" onClick={() => openBooking(artist.id)}>
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-soft p-6 w-full max-w-md">
            <h3 className="text-xl font-serif font-semibold text-navy mb-4">Request Booking</h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">Start date</label>
                <input type="date" className="form-input w-full" value={bookingModal.start || ''} onChange={(e)=>setBookingModal(m=>({...m,start:e.target.value}))} />
              </div>
              <div>
                <label className="form-label">End date</label>
                <input type="date" className="form-input w-full" value={bookingModal.end || ''} onChange={(e)=>setBookingModal(m=>({...m,end:e.target.value}))} />
              </div>
              {bookingError && <div className="text-sm text-red-600">{bookingError}</div>}
              <div className="flex justify-end space-x-2 pt-2">
                <button className="btn-secondary" onClick={()=>setBookingModal({open:false})}>Cancel</button>
                <button className="btn-primary" disabled={processing} onClick={createBooking}>{processing? 'Sending…':'Send Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {sortedArtists.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-navy mb-2">
            No Artists Found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or filters
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedDiscipline('all')
              setSelectedLocation('all')
            }}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

export default HotelArtists
