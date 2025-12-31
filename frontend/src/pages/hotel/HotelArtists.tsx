import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Calendar, Heart } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { bookingsApi, hotelsApi, commonApi, artistsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { VerifiedBadge } from '@/components/VerifiedBadge'

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=Artist'

type AvailabilityBadge = 'Available' | 'Pending' | 'Unavailable'

interface ArtistCardData {
  id: string
  name: string
  discipline: string
  location: string
  rating: number
  hotelRating?: number | null
  specialties: string[]
  image: string
  availability: AvailabilityBadge
  nextAvailable?: string | null
  totalBookings: number
  priceRange?: string
  membershipStatus?: string
  loyaltyPoints?: number
  rank?: string
  isFavorite: boolean
  notes?: string
}

const HotelArtists: React.FC = () => {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [priceRangeFilter, setPriceRangeFilter] = useState<[number, number]>([0, 10000])
  const [loyaltyTierFilter, setLoyaltyTierFilter] = useState('all')
  const [availabilityWindow, setAvailabilityWindow] = useState<string>('')
  const [hotelId, setHotelId] = useState<string>('')
  const [bookingModal, setBookingModal] = useState<{ open: boolean; artistId?: string; start?: string; end?: string }>({ open: false })
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [artists, setArtists] = useState<ArtistCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const favoriteIdsRef = useRef<string[]>([])

  const storageKey = useMemo(() => (hotelId ? `travel-art:favorites:${hotelId}` : null), [hotelId])

  const parseJsonArray = useCallback(<T,>(value: unknown, fallback: T[]): T[] => {
    if (!value) return fallback
    if (Array.isArray(value)) return value as T[]
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? (parsed as T[]) : fallback
      } catch {
        return fallback
      }
    }
    return fallback
  }, [])

  const deriveAvailability = useCallback((status?: string): AvailabilityBadge => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'Available'
      case 'PENDING':
        return 'Pending'
      default:
        return 'Unavailable'
    }
  }, [])

  const transformArtist = useCallback((artist: any): ArtistCardData => {
    const imageList = parseJsonArray<string>(artist.images, [])
    const specialtyList = parseJsonArray<string>(artist.mediaUrls, [])
    const availability = deriveAvailability(artist.membershipStatus)

    const location = artist.user?.country || artist.location || 'Worldwide'

    const nextAvailable = artist.membershipRenewal ? new Date(artist.membershipRenewal).toISOString() : null

    const rating = typeof artist.averageRating === 'number' ? artist.averageRating : artist.rating ?? 0
    const totalBookings = typeof artist.totalBookings === 'number' ? artist.totalBookings : artist.bookingCount ?? 0

    const priceRange = artist.priceRange || undefined

    const specialties = specialtyList.length
      ? specialtyList.slice(0, 4)
      : [artist.discipline, artist.rank].filter(Boolean)

    return {
      id: artist.id,
      name: artist.user?.name || artist.name || 'Unknown Artist',
      discipline: artist.discipline || 'Performer',
      location,
      rating,
      hotelRating: artist.hotelRating ?? null,
      specialties,
      image: imageList[0] || PLACEHOLDER_IMAGE,
      availability,
      nextAvailable,
      totalBookings,
      priceRange,
      membershipStatus: artist.membershipStatus,
      loyaltyPoints: artist.loyaltyPoints,
      rank: artist.rank,
      isFavorite: Boolean(artist.isFavorite),
      notes: artist.bio
    }
  }, [deriveAvailability, parseJsonArray])

  const extractArtists = useCallback((payload: any): any[] => {
    if (!payload) return []
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.artists)) return payload.artists
    if (Array.isArray(payload?.data?.artists)) return payload.data.artists
    if (Array.isArray(payload?.data)) return payload.data
    return []
  }, [])

  const extractArray = useCallback((payload: any, key: string): any[] => {
    if (!payload) return []
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload[key])) return payload[key]
    if (payload.data) {
      if (Array.isArray(payload.data[key])) return payload.data[key]
      if (Array.isArray(payload.data)) return payload.data
    }
    return []
  }, [])

  const getPriceValue = useCallback((priceRange?: string) => {
    if (!priceRange) return Number.MAX_SAFE_INTEGER
    const match = priceRange.match(/\d+/)
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER
  }, [])

  // Convert price range (€) to credits (1 credit = 10 EUR)
  const convertPriceToCredits = useCallback((priceRange?: string): string => {
    if (!priceRange) return 'Custom Pricing'
    const matches = priceRange.match(/(\d+)-(\d+)/)
    if (matches) {
      const min = Math.round(parseInt(matches[1], 10) / 10)
      const max = Math.round(parseInt(matches[2], 10) / 10)
      return `${min}-${max} credits`
    }
    const singleMatch = priceRange.match(/(\d+)/)
    if (singleMatch) {
      const credits = Math.round(parseInt(singleMatch[0], 10) / 10)
      return `${credits} credits`
    }
    return 'Custom Pricing'
  }, [])

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

  useEffect(() => {
    if (!hotelId) {
      favoriteIdsRef.current = []
      setFavoriteIds([])
      return
    }

    ;(async () => {
      try {
        const res = await hotelsApi.getFavorites(hotelId)
        const favorites = extractArray(res.data?.data, 'favorites')
        const ids = favorites.map((f: any) => f?.artistId || f?.id || f).filter(Boolean)
        favoriteIdsRef.current = ids
        setFavoriteIds(ids)
      } catch (err) {
        console.warn('Failed to fetch favorites, falling back to localStorage', err)
        // Fallback to localStorage
        if (storageKey) {
          try {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (Array.isArray(parsed)) {
                favoriteIdsRef.current = parsed
                setFavoriteIds(parsed)
              }
            }
          } catch (e) {
            console.warn('Failed to parse stored favorites', e)
          }
        }
      }
    })()
  }, [hotelId, storageKey])

  const fetchArtists = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await commonApi.getTopArtists()
      const list = extractArtists(res.data?.data)
      if (list.length) {
        const favoriteSet = new Set(favoriteIdsRef.current)
        setArtists(list.map(item => {
          const transformed = transformArtist(item)
          return { ...transformed, isFavorite: favoriteSet.has(transformed.id) }
        }))
        setLoading(false)
        return
      }
      throw new Error('No artists returned from top artists endpoint')
    } catch (primaryError) {
      console.warn('Falling back to artists service:', primaryError)
      try {
        const fallbackRes = await artistsApi.getAll({ limit: 50 })
        const list = extractArtists(fallbackRes.data)
        if (!list.length) {
          throw new Error('Artist list is empty')
        }
        const favoriteSet = new Set(favoriteIdsRef.current)
        setArtists(list.map(item => {
          const transformed = transformArtist(item)
          return { ...transformed, isFavorite: favoriteSet.has(transformed.id) }
        }))
      } catch (fallbackError) {
        console.error('Failed to load artists', fallbackError)
        setError('We could not load artists right now. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
  }, [extractArtists, transformArtist])

  useEffect(() => {
    const favoriteSet = new Set(favoriteIds)
    setArtists((prev) =>
      prev.map((artist) => ({ ...artist, isFavorite: favoriteSet.has(artist.id) }))
    )
  }, [favoriteIds])

  useEffect(() => {
    fetchArtists()
  }, [fetchArtists])
  
  const disciplines = useMemo(() => {
    const unique = new Set<string>()
    artists.forEach((artist) => {
      if (artist.discipline) {
        unique.add(artist.discipline)
      }
    })
    return ['all', ...Array.from(unique).sort()]
  }, [artists])

  const locations = useMemo(() => {
    const unique = new Set<string>()
    artists.forEach((artist) => {
      if (artist.location && artist.location !== 'Worldwide') {
        unique.add(artist.location)
      }
    })
    return ['all', ...Array.from(unique).sort()]
  }, [artists])

  const filteredArtists = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return artists.filter((artist) => {
      const matchesSearch = !query || [
        artist.name,
        artist.discipline,
        artist.location,
        artist.specialties.join(' ')
      ].some((field) => field.toLowerCase().includes(query))

      const matchesDiscipline = selectedDiscipline === 'all' || artist.discipline === selectedDiscipline
      const matchesLocation = selectedLocation === 'all' || artist.location === selectedLocation

      // Advanced filters
      const priceValue = getPriceValue(artist.priceRange)
      const matchesPrice = priceValue >= priceRangeFilter[0] && priceValue <= priceRangeFilter[1]

      const matchesLoyalty = loyaltyTierFilter === 'all' || 
        (loyaltyTierFilter === 'high' && (artist.loyaltyPoints ?? 0) >= 100) ||
        (loyaltyTierFilter === 'medium' && (artist.loyaltyPoints ?? 0) >= 50 && (artist.loyaltyPoints ?? 0) < 100) ||
        (loyaltyTierFilter === 'low' && (artist.loyaltyPoints ?? 0) < 50)

      const matchesAvailability = !availabilityWindow || 
        (availabilityWindow === 'available' && artist.availability === 'Available') ||
        (availabilityWindow === 'pending' && artist.availability === 'Pending')

      return matchesSearch && matchesDiscipline && matchesLocation && matchesPrice && matchesLoyalty && matchesAvailability
    })
  }, [artists, searchTerm, selectedDiscipline, selectedLocation, priceRangeFilter, loyaltyTierFilter, availabilityWindow, getPriceValue])

  const sortedArtists = useMemo(() => {
    const copy = [...filteredArtists]
    switch (sortBy) {
      case 'rating':
        copy.sort((a, b) => b.rating - a.rating)
        break
      case 'price':
        copy.sort((a, b) => getPriceValue(a.priceRange) - getPriceValue(b.priceRange))
        break
      case 'bookings':
        copy.sort((a, b) => b.totalBookings - a.totalBookings)
        break
      case 'name':
        copy.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }
    return copy
  }, [filteredArtists, getPriceValue, sortBy])

  const toggleFavorite = async (artistId: string) => {
    if (!hotelId) return

    const wasFavorite = favoriteIdsRef.current.includes(artistId)
    
    // Optimistic update
    setArtists((prev) =>
      prev.map((artist) =>
        artist.id === artistId
          ? { ...artist, isFavorite: !wasFavorite }
          : artist
      )
    )

    const updatedSet = new Set(favoriteIdsRef.current)
    if (wasFavorite) {
      updatedSet.delete(artistId)
      favoriteIdsRef.current = Array.from(updatedSet)
      setFavoriteIds(Array.from(updatedSet))
      try {
        await hotelsApi.removeFavorite(hotelId, artistId)
      } catch (err) {
        console.warn('Failed to remove favorite, reverting', err)
        updatedSet.add(artistId)
        favoriteIdsRef.current = Array.from(updatedSet)
        setFavoriteIds(Array.from(updatedSet))
        setArtists((prev) =>
          prev.map((artist) =>
            artist.id === artistId ? { ...artist, isFavorite: true } : artist
          )
        )
      }
    } else {
      updatedSet.add(artistId)
      favoriteIdsRef.current = Array.from(updatedSet)
      setFavoriteIds(Array.from(updatedSet))
      try {
        await hotelsApi.addFavorite(hotelId, artistId)
      } catch (err) {
        console.warn('Failed to add favorite, reverting', err)
        updatedSet.delete(artistId)
        favoriteIdsRef.current = Array.from(updatedSet)
        setFavoriteIds(Array.from(updatedSet))
        setArtists((prev) =>
          prev.map((artist) =>
            artist.id === artistId ? { ...artist, isFavorite: false } : artist
          )
        )
      }
    }

    // Also update localStorage as backup
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(updatedSet)))
      } catch (err) {
        console.warn('Failed to update localStorage', err)
      }
    }
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
      const res = await bookingsApi.create({
        hotelId,
        artistId: bookingModal.artistId,
        startDate: new Date(bookingModal.start).toISOString(),
        endDate: new Date(bookingModal.end).toISOString(),
        creditsUsed: 1
      })
      setBookingModal({ open: false })
      // Booking created successfully - receipt will be available after payment
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
      case 'Pending':
        return 'bg-amber-100 text-amber-800'
      case 'Unavailable':
      default:
        return 'bg-red-100 text-red-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
        </div>
        <div className="card-luxury animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-luxury animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg mb-4" />
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
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

      {error && (
        <div className="card-luxury border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-container">
        <div className="filters-row">
          <div className="md:col-span-2">
            <label className="form-label">Search Artists</label>
            <div className="search-icon-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, discipline, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                data-testid="filter-input"
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">Discipline</label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="filter-select"
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
              className="filter-select"
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
              <option value="price">Credits</option>
              <option value="bookings">Bookings</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-gold hover:underline"
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            {sortedArtists.length} artist{sortedArtists.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div>
              <label className="form-label">Credits Range</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={Math.round(priceRangeFilter[0] / 10)}
                  onChange={(e) => setPriceRangeFilter([Number(e.target.value) * 10, priceRangeFilter[1]])}
                  className="form-input w-24"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={Math.round(priceRangeFilter[1] / 10)}
                  onChange={(e) => setPriceRangeFilter([priceRangeFilter[0], Number(e.target.value) * 10])}
                  className="form-input w-24"
                />
                <span className="text-sm text-gray-500">credits</span>
              </div>
            </div>
            <div>
              <label className="form-label">Loyalty Tier</label>
              <select
                value={loyaltyTierFilter}
                onChange={(e) => setLoyaltyTierFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Tiers</option>
                <option value="high">High (100+ points)</option>
                <option value="medium">Medium (50-99 points)</option>
                <option value="low">Low (&lt;50 points)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Availability</label>
              <select
                value={availabilityWindow}
                onChange={(e) => setAvailabilityWindow(e.target.value)}
                className="form-input"
              >
                <option value="">All Availability</option>
                <option value="available">Available Now</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="artists-list">
        {sortedArtists.map((artist, index) => (
          <motion.div
            key={artist.id}
            data-testid="artist-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="card-luxury overflow-hidden"
          >
            <div className="relative">
              <img
                src={artist.image}
                alt={`${artist.name}, ${artist.discipline} performing in ${artist.location}`}
                className="w-full h-64 object-cover"
                loading="lazy"
              />
                     <button
                       onClick={() => toggleFavorite(artist.id)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' || e.key === ' ') {
                           e.preventDefault()
                           toggleFavorite(artist.id)
                         }
                       }}
                       aria-label={artist.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                       className={`absolute top-4 right-4 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
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
                     <div className="flex items-center space-x-2 mb-2">
                       <h3 className="text-xl font-serif font-semibold text-navy">
                         {artist.name}
                       </h3>
                       {artist.membershipStatus === 'ENTERPRISE' && (
                         <VerifiedBadge type="artist" size="sm" />
                       )}
                     </div>
                     <p className="text-gold font-medium mb-3">{artist.discipline}</p>
              <p className="text-gray-600 text-sm mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {artist.location}
              </p>
              
              {artist.notes ? (
                <p className="text-gray-600 text-sm mb-4">
                  {artist.notes}
                </p>
              ) : (
                <p className="text-gray-500 text-sm mb-4 italic">
                  Artist biography coming soon.
                </p>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-navy mb-2">Specialties:</h4>
                <div className="flex flex-wrap gap-2">
                  {artist.specialties.length > 0 ? (
                    artist.specialties.map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Luxury Performances
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-navy mb-1">{artist.rank || 'Standard'}</div>
                  <p className="text-xs text-gray-600">Artist Rank</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-navy mb-1">{convertPriceToCredits(artist.priceRange)}</div>
                  <p className="text-xs text-gray-600">Credits</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 text-gold mr-1" />
                    <span className="text-sm font-medium text-navy">{artist.totalBookings}</span>
                  </div>
                  <p className="text-xs text-gray-600">Total Bookings</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-navy mb-1">{artist.loyaltyPoints ?? 0}</div>
                  <p className="text-xs text-gray-600">Loyalty Points</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(artist.availability)}`}>
                  {artist.availability}
                </span>
                <span className="text-xs text-gray-500">
                  Next: {artist.nextAvailable ? new Date(artist.nextAvailable).toLocaleDateString() : 'TBD'}
                </span>
              </div>

              <div className="flex space-x-2">
                <a className="flex-1 btn-primary" href={`/artist/${artist.id}`}>
                  View Profile
                </a>
                <button className="btn-secondary" onClick={() => openBooking(artist.id)} data-testid="book-button">
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
                <input type="date" name="startDate" className="form-input w-full" value={bookingModal.start || ''} onChange={(e)=>setBookingModal(m=>({...m,start:e.target.value}))} />
              </div>
              <div>
                <label className="form-label">End date</label>
                <input type="date" name="endDate" className="form-input w-full" value={bookingModal.end || ''} onChange={(e)=>setBookingModal(m=>({...m,end:e.target.value}))} />
              </div>
              <div>
                <label className="form-label">Notes (optional)</label>
                <input type="text" name="notes" className="form-input w-full" placeholder="Special requests or notes" onChange={(e)=>setBookingModal(m=>({...m,notes:e.target.value}))} />
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
