import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Calendar, Heart } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatNumber } from '@/utils/i18n'
import { bookingsApi, hotelsApi, commonApi, artistsApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { extractArray } from '@/utils/apiPayload'
import { t } from '@/i18n'
import SEOHead from '@/components/SEOHead'

const PLACEHOLDER_IMAGE = '/images/placeholder-experience.webp'

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


  useEffect(() => {
    (async () => {
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

    (async () => {
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
        setError(t('Impossible de charger les artistes pour le moment. Réessayez plus tard.'))
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
      const matchesLoyalty = loyaltyTierFilter === 'all' || 
        (loyaltyTierFilter === 'high' && (artist.loyaltyPoints ?? 0) >= 100) ||
        (loyaltyTierFilter === 'medium' && (artist.loyaltyPoints ?? 0) >= 50 && (artist.loyaltyPoints ?? 0) < 100) ||
        (loyaltyTierFilter === 'low' && (artist.loyaltyPoints ?? 0) < 50)

      const matchesAvailability = !availabilityWindow || 
        (availabilityWindow === 'available' && artist.availability === 'Available') ||
        (availabilityWindow === 'pending' && artist.availability === 'Pending')

      return matchesSearch && matchesDiscipline && matchesLocation && matchesLoyalty && matchesAvailability
    })
  }, [artists, searchTerm, selectedDiscipline, selectedLocation, loyaltyTierFilter, availabilityWindow])

  const sortedArtists = useMemo(() => {
    const copy = [...filteredArtists]
    switch (sortBy) {
      case 'rating':
        copy.sort((a, b) => b.rating - a.rating)
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
  }, [filteredArtists, sortBy])

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
      })
      setBookingModal({ open: false })
      // Booking created successfully - receipt will be available after payment
    } catch (e: any) {
      setBookingError(e?.response?.data?.message || 'Failed to create booking')
    } finally {
      setProcessing(false)
    }
  }

  /* Availability arrives from the API in English. It is a status, so it uses
     the shared badge vocabulary rather than a fourth private colour map. */
  const availabilityClass = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'badge-positive'
      case 'Pending':
        return 'badge-caution'
      default:
        return 'badge-critical'
    }
  }

  const availabilityLabel = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'Disponible'
      case 'Pending':
        return 'À confirmer'
      default:
        return 'Indisponible'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 bg-surface-sunken rounded-card w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-surface-sunken rounded-card w-96 animate-pulse" />
        </div>
        <div className="panel p-6 animate-pulse">
          <div className="h-10 bg-surface-sunken rounded-card mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-10 bg-surface-sunken rounded-card" />
            <div className="h-10 bg-surface-sunken rounded-card" />
            <div className="h-10 bg-surface-sunken rounded-card" />
            <div className="h-10 bg-surface-sunken rounded-card" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel p-6 animate-pulse">
              <div className="h-64 bg-surface-sunken rounded-card mb-4" />
              <div className="space-y-3">
                <div className="h-6 bg-surface-sunken rounded-card w-3/4" />
                <div className="h-4 bg-surface-sunken rounded-card w-1/2" />
                <div className="h-4 bg-surface-sunken rounded-card w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SEOHead title={t('Parcourir les artistes') + ' — Travel Art'} />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
          {t('Parcourir les artistes')}
        </h1>
        <p className="text-content-secondary">
          {t('Découvrez les artistes à inviter dans votre établissement')}
        </p>
      </div>

      {error && (
        <div className="notice-critical">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-container">
        <div className="filters-row">
          <div className="md:col-span-2">
            <label className="form-label">{t('Rechercher des artistes')}</label>
            <div className="search-icon-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder={t('Rechercher par nom, discipline ou ville…')}
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
                  {discipline === 'all' ? 'Toutes les disciplines' : discipline}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">Lieu</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="filter-select"
            >
              {locations.map(location => (
                <option key={location} value={location}>
                  {location === 'all' ? 'Tous les lieux' : location}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-content-secondary whitespace-nowrap">{t('Trier par')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input w-40"
            >
              <option value="rating">Note</option>
              <option value="bookings">{t('Réservations')}</option>
              <option value="name">Nom</option>
            </select>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-gold hover:underline whitespace-nowrap"
            >
              {showAdvancedFilters ? t('Masquer les filtres avancés') : t('Filtres avancés')}
            </button>
          </div>
          
          <div className="text-sm text-content-secondary">
            {t(
              sortedArtists.length >= 2
                ? '{count} artistes trouvés'
                : '{count} artiste trouvé',
              { count: formatNumber(sortedArtists.length) }
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div>
              <label className="form-label">{t('Niveau de fidélité')}</label>
              <select
                value={loyaltyTierFilter}
                onChange={(e) => setLoyaltyTierFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">{t('Tous les niveaux')}</option>
                <option value="high">{t('Élevé (100 points et plus)')}</option>
                <option value="medium">{t('Intermédiaire (50 à 99 points)')}</option>
                <option value="low">{t('Débutant (moins de 50 points)')}</option>
              </select>
            </div>
            <div>
              <label className="form-label">Availability</label>
              <select
                value={availabilityWindow}
                onChange={(e) => setAvailabilityWindow(e.target.value)}
                className="form-input"
              >
                <option value="">{t('Toutes les disponibilités')}</option>
                <option value="available">Disponible maintenant</option>
                <option value="pending">En attente</option>
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
            className="panel p-6 overflow-hidden"
          >
            <div className="relative">
              <img decoding="async"
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
                       aria-label={artist.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                       className={`absolute top-4 right-4 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
                         artist.isFavorite
                           ? 'bg-gold text-[var(--text-on-gold)]'
                           : 'bg-surface-raised/80 text-content-secondary hover:bg-surface-raised'
                       }`}
                     >
                       <Heart className={`w-4 h-4 ${artist.isFavorite ? 'fill-current' : ''}`} />
                     </button>
              <div className="absolute top-4 left-4 bg-surface-raised/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-content flex items-center space-x-1">
                <span className="text-gold font-bold">◆</span>
                <span>{artist.rating}</span>
              </div>
            </div>
            
                   <div className="p-6">
                     <div className="flex items-center space-x-2 mb-2">
                       <h3 className="text-xl font-serif font-semibold text-content">
                         {artist.name}
                       </h3>
                       {artist.membershipStatus === 'ENTERPRISE' && (
                         <VerifiedBadge type="artist" size="sm" />
                       )}
                     </div>
                     <p className="text-gold font-medium mb-3">{artist.discipline}</p>
              <p className="text-content-secondary text-sm mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {artist.location}
              </p>
              
              {artist.notes ? (
                <p className="text-content-secondary text-sm mb-4">
                  {artist.notes}
                </p>
              ) : (
                <p className="text-content-secondary text-sm mb-4 italic">
                  Artist biography coming soon.
                </p>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-content mb-2">{t('Spécialités :')}</h4>
                <div className="flex flex-wrap gap-2">
                  {artist.specialties.length > 0 ? (
                    artist.specialties.map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="px-2 py-1 bg-surface-sunken text-content-secondary text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 bg-surface-sunken text-content-secondary text-xs rounded-full">
                      Luxury Performances
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-surface rounded-card">
                  <div className="text-sm font-medium text-content mb-1">{artist.rank || 'Standard'}</div>
                  <p className="text-xs text-content-secondary">Rang</p>
                </div>
                <div className="text-center p-3 bg-surface rounded-card">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 text-gold mr-1" />
                    <span className="text-sm font-medium text-content">{artist.totalBookings}</span>
                  </div>
                  <p className="text-xs text-content-secondary">{t('Réservations')}</p>
                </div>
                <div className="text-center p-3 bg-surface rounded-card">
                  <div className="text-sm font-medium text-content mb-1">{artist.loyaltyPoints ?? 0}</div>
                  <p className="text-xs text-content-secondary">Points</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={availabilityClass(artist.availability)}>
                  {availabilityLabel(artist.availability)}
                </span>
                <span className="text-xs text-content-secondary">
                  Prochaine date : {artist.nextAvailable ? new Date(artist.nextAvailable).toLocaleDateString('fr-FR') : t('à définir')}
                </span>
              </div>

              <div className="flex space-x-2">
                <a className="flex-1 btn-primary" href={`/artist/${artist.id}`}>
                  {t('Voir le profil')}
                </a>
                <button className="btn-secondary" onClick={() => openBooking(artist.id)} data-testid="book-button">
                  {t('Réserver')}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface-raised rounded-card shadow-soft p-6 w-full max-w-md">
            <h3 className="text-xl font-serif font-semibold text-content mb-4">{t('Demander une date')}</h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">{t('Date de début')}</label>
                <input type="date" name="startDate" className="form-input w-full" value={bookingModal.start || ''} onChange={(e)=>setBookingModal(m=>({...m,start:e.target.value}))} />
              </div>
              <div>
                <label className="form-label">{t('Date de fin')}</label>
                <input type="date" name="endDate" className="form-input w-full" value={bookingModal.end || ''} onChange={(e)=>setBookingModal(m=>({...m,end:e.target.value}))} />
              </div>
              <div>
                <label className="form-label">{t('Notes (facultatif)')}</label>
                <input type="text" name="notes" className="form-input w-full" placeholder={t('Demandes particulières ou remarques')} onChange={(e)=>setBookingModal(m=>({...m,notes:e.target.value}))} />
              </div>
              {bookingError && <div className="text-sm text-[var(--state-critical)]">{bookingError}</div>}
              <div className="flex justify-end space-x-2 pt-2">
                <button className="btn-secondary" onClick={()=>setBookingModal({open:false})}>Annuler</button>
                <button className="btn-primary" disabled={processing} onClick={createBooking}>{processing ? t('Envoi…') : t('Envoyer la demande')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {sortedArtists.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-surface-sunken rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-content-secondary" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-content mb-2">
            {t('Aucun artiste trouvé')}
          </h3>
          <p className="text-content-secondary mb-6">
            {t('Essayez d’élargir votre recherche ou vos filtres')}
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedDiscipline('all')
              setSelectedLocation('all')
            }}
            className="btn-primary"
          >
            {t('Réinitialiser les filtres')}
          </button>
        </div>
      )}
    </div>
  )
}

export default HotelArtists
