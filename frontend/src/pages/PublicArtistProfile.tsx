import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, Calendar, Music, ArrowLeft, MessageCircle, Heart, UserPlus, User } from 'lucide-react'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import ScrollAnimationWrapper from '../components/ScrollAnimationWrapper'
import { artistsApi } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const PublicArtistProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [artist, setArtist] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (id) {
      fetchArtistProfile(id)
    }
  }, [id])

  const fetchArtistProfile = async (artistId: string) => {
    try {
      setLoading(true)
      const response = await artistsApi.getById(artistId)
      setArtist(response.data?.data)
    } catch (error: any) {
      console.error('Error fetching artist profile:', error)
      if (error.response?.status === 404) {
        toast.error('Profil d’artiste introuvable')
      } else {
        toast.error('Impossible de charger le profil de l’artiste')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <SimpleNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-control h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-content-secondary">Chargement du profil de l’artiste…</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <SimpleNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-content mb-4">Artiste introuvable</h2>
            <p className="text-content-secondary mb-6">Le profil d’artiste demandé n’existe pas.</p>
            <Link to="/top-artists" className="btn-primary">
              Parcourir les artistes
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Parse images and videos (handle both array and JSON string)
  let images: string[] = []
  let videos: string[] = []
  
  if (artist.images) {
    try {
      images = Array.isArray(artist.images) 
        ? artist.images 
        : (typeof artist.images === 'string' ? JSON.parse(artist.images) : [])
    } catch {
      images = []
    }
  }
  
  if (artist.videos) {
    try {
      videos = Array.isArray(artist.videos) 
        ? artist.videos 
        : (typeof artist.videos === 'string' ? JSON.parse(artist.videos) : [])
    } catch {
      videos = []
    }
  }
  
  // Parse artisticProfile JSON
  let artisticProfile: any = {}
  if (artist.artisticProfile) {
    try {
      artisticProfile = typeof artist.artisticProfile === 'string' 
        ? JSON.parse(artist.artisticProfile) 
        : artist.artisticProfile
    } catch (e) {
      console.error('Error parsing artisticProfile:', e)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]" data-testid="artist-profile">
      <SimpleNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Back Button */}
        <Link 
          to="/top-artists" 
          className="inline-flex items-center text-content hover:text-gold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux artistes
        </Link>

        {/* Artist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-luxury mb-8"
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                {images[0] ? (
                  <img
                    src={images[0]}
                    alt={artist.user?.name || 'Artist'}
                    className="w-full h-full rounded-control object-cover bg-surface-sunken ring-2 ring-gold/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const placeholder = target.nextElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full rounded-control bg-gradient-to-br from-navy/10 to-gold/10 ring-2 ring-gold/20 flex items-center justify-center ${images[0] ? 'hidden' : 'flex'}`}
                  style={{ display: images[0] ? 'none' : 'flex' }}
                >
                  <User className="w-16 h-16 md:w-20 md:h-20 text-content-secondary" />
                </div>
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-content mb-2">
                {artist.stageName || artist.user?.name || 'Artist'}
              </h1>
              {artist.stageName && artist.user?.name && (
                <p className="text-sm text-content-secondary mb-2">({artist.user.name})</p>
              )}
              <p className="text-lg text-gold font-medium mb-3">{artist.discipline || 'Artist'}</p>
              
              {artist.user?.country && (
                <div className="flex items-center text-content-secondary mb-4">
                  <MapPin className="w-4 h-4 mr-2 text-content-secondary" />
                  <span className="text-sm">{artist.user.country}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                {artist.avgRating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold fill-current" />
                    <span className="text-sm font-medium text-content">
                      {artist.avgRating.toFixed(1)} Rating
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-content">
                    {artist.bookings?.length || 0} {(artist.bookings?.length || 0) === 1 ? 'Booking' : 'Bookings'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-control ${artist.membershipStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium text-content">
                    {artist.membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons for Hotels */}
          {user && user.role === 'HOTEL' && (
            <div className="mt-8 pt-6 border-t border-line flex gap-3">
              <button
                onClick={() => {
                  toast.success('Demande de contact envoyée à l’artiste')
                }}
                className="flex-1 bg-navy hover:bg-navy/90 text-white px-6 py-3 rounded-card font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Contacter l’artiste
              </button>
              <button
                onClick={() => {
                  setIsFavorite(!isFavorite)
                  toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites!')
                }}
                className={`px-6 py-3 rounded-card font-medium border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  isFavorite 
                    ? 'bg-gold/10 border-gold text-gold' 
                    : 'bg-[var(--surface-raised)] border-line text-content-secondary hover:border-gold hover:text-gold'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Saved' : 'Save'}
              </button>
            </div>
          )}
        </motion.div>

        {/* About Section */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.1}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-content mb-4">About {artist.stageName || artist.user?.name}</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-content-secondary leading-relaxed text-base mb-4">
                {artist.bio || `${artist.stageName || artist.user?.name} est un artiste professionnel${artist.discipline ? ` — ${artist.discipline}` : ''} qui se produit dans les lieux d’exception du monde entier, avec le goût des moments dont on se souvient.`}
              </p>
              {!artist.bio && (
                <>
                  <p className="text-content-secondary leading-relaxed text-base mb-4">
                    Son style et sa vision artistique ont conquis le public {artist.user?.country ? `en ${artist.user.country}` : 'de nombreuses scènes'},
                    ce qui en fait un artiste recherché par les hôtels d’exception et les événements privés.
                  </p>
                  <p className="text-content-secondary leading-relaxed text-base">
                    Des réunions intimistes aux grandes célébrations, {artist.stageName || artist.user?.name} apporte
                    rigueur, créativité et un vrai talent pour créer le lien avec tous les publics.
                  </p>
                </>
              )}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Artist Details */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.15}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-content mb-6">Informations sur l’artiste</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Category */}
              {(artist.discipline || artisticProfile.mainCategory) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Catégorie principale</p>
                    <p className="text-base font-medium text-content">{artist.discipline || artisticProfile.mainCategory}</p>
                  </div>
                </div>
              )}
              
              {/* Secondary Category */}
              {artisticProfile.secondaryCategory && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Catégorie secondaire</p>
                    <p className="text-base font-medium text-content">{artisticProfile.secondaryCategory}</p>
                  </div>
                </div>
              )}
              
              {/* Specific Category/Type */}
              {artisticProfile.specificCategory && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Spécialité</p>
                    <p className="text-base font-medium text-content">{artisticProfile.specificCategory}</p>
                  </div>
                </div>
              )}
              
              {/* Domain */}
              {artisticProfile.domain && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Domaine</p>
                    <p className="text-base font-medium text-content">{artisticProfile.domain}</p>
                  </div>
                </div>
              )}
              
              {/* Location */}
              {artist.user?.country && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Basé à</p>
                    <p className="text-base font-medium text-content">{artist.user.country}</p>
                  </div>
                </div>
              )}
              
              {/* Stage Name */}
              {artist.stageName && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Nom de scène</p>
                    <p className="text-base font-medium text-content">{artist.stageName}</p>
                  </div>
                </div>
              )}
              
              {/* Phone */}
              {artist.phone && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Téléphone</p>
                    <p className="text-base font-medium text-content">{artist.phone}</p>
                  </div>
                </div>
              )}
              
              {/* Birth Date */}
              {artist.birthDate && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Date de naissance</p>
                    <p className="text-base font-medium text-content">{artist.birthDate}</p>
                  </div>
                </div>
              )}
              
              {/* Languages */}
              {(artisticProfile.languages && artisticProfile.languages.length > 0) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Langues</p>
                    <p className="text-base font-medium text-content">{artisticProfile.languages.join(', ')}</p>
                  </div>
                </div>
              )}
              
              {/* Audience Type */}
              {(artisticProfile.audienceType && artisticProfile.audienceType.length > 0) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Type de public</p>
                    <p className="text-base font-medium text-content">{artisticProfile.audienceType.join(', ')}</p>
                  </div>
                </div>
              )}
              
              {/* Rating */}
              {artist.avgRating && artist.avgRating >= 3.0 && artist.bookings && artist.bookings.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-card bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-gold fill-current" />
                  </div>
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Note moyenne</p>
                    <p className="text-base font-medium text-content">{artist.avgRating.toFixed(1)} / 5.0</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Performance Videos */}
        {(videos.length > 0 || !videos.length) && (
          <ScrollAnimationWrapper animation="fade-up" delay={0.2}>
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-bold text-content mb-4">Vidéos de performances</h2>
              <p className="text-content-secondary mb-6">Découvrez le travail de l’artiste à travers ses performances</p>
              
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videos.map((video: string, index: number) => {
                    // Check if it's a YouTube URL
                    const isYouTube = video.includes('youtube.com') || video.includes('youtu.be')
                    let videoId = ''
                    
                    if (isYouTube) {
                      // Extract YouTube video ID
                      if (video.includes('youtube.com/watch?v=')) {
                        videoId = video.split('v=')[1]?.split('&')[0] || ''
                      } else if (video.includes('youtu.be/')) {
                        videoId = video.split('youtu.be/')[1]?.split('?')[0] || ''
                      } else if (video.includes('youtube.com/embed/')) {
                        videoId = video.split('embed/')[1]?.split('?')[0] || ''
                      }
                    }
                    
                    return (
                      <div key={index} className="relative aspect-video rounded-card overflow-hidden bg-gray-900">
                        {isYouTube && videoId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={`Performance Video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        ) : (
                          <video
                            src={video}
                            controls
                            className="w-full h-full object-cover"
                          >
                            Votre navigateur ne prend pas en charge la lecture vidéo.
                          </video>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Placeholder Videos */}
                  <div className="relative aspect-video rounded-card overflow-hidden bg-gradient-to-br from-surface-sunken to-surface-sunken flex flex-col items-center justify-center p-8 border-2 border-dashed border-line">
                    <div className="w-16 h-16 rounded-control bg-gold/20 flex items-center justify-center mb-4">
                      <Music className="w-8 h-8 text-gold" />
                    </div>
                    <p className="text-content-secondary text-center font-medium mb-2">En représentation</p>
                    <p className="text-content-secondary text-sm text-center">Vidéo à venir</p>
                  </div>
                  <div className="relative aspect-video rounded-card overflow-hidden bg-gradient-to-br from-surface-sunken to-surface-sunken flex flex-col items-center justify-center p-8 border-2 border-dashed border-line">
                    <div className="w-16 h-16 rounded-control bg-gold/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      </svg>
                    </div>
                    <p className="text-content-secondary text-center font-medium mb-2">Performance live</p>
                    <p className="text-content-secondary text-sm text-center">Vidéo à venir</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollAnimationWrapper>
        )}

        {/* Portfolio Images */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.3}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-content mb-4">Portfolio</h2>
            <p className="text-content-secondary mb-6">Un aperçu des performances passées et des moments de scène</p>
            
            {images.length > 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.slice(1).map((image: string, index: number) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-card bg-[var(--surface-warm)] group cursor-pointer">
                    <img
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Cpath d="M200 120l-40 40h80z"/%3E%3Ccircle cx="150" cy="100" r="15"/%3E%3C/g%3E%3C/svg%3E'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <p className="text-content font-medium">Voir l’image</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative aspect-square rounded-card overflow-hidden bg-gradient-to-br from-surface-sunken to-surface-sunken flex flex-col items-center justify-center border-2 border-dashed border-line">
                    <div className="w-16 h-16 rounded-control bg-gold/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-content-secondary text-sm">Photo {i}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollAnimationWrapper>

        {/* What I Offer - Based on Registration Data */}
        {(artisticProfile.mainCategory || artisticProfile.languages?.length > 0 || artisticProfile.audienceType?.length > 0) && (
          <ScrollAnimationWrapper animation="fade-up" delay={0.4}>
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-bold text-content mb-4">Ce que je propose</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Discipline/Category */}
                {(artisticProfile.mainCategory || artist.discipline) && (
                  <div className="p-6 bg-[var(--surface-raised)] rounded-card border border-line hover:border-gold/50 transition-colors">
                    <div className="w-12 h-12 rounded-card bg-gold/10 flex items-center justify-center mb-4">
                      <Music className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-content mb-2">{artisticProfile.mainCategory || artist.discipline} Performances</h3>
                    <p className="text-content-secondary text-sm leading-relaxed">
                      {artisticProfile.specificCategory && `Spécialité : ${artisticProfile.specificCategory}. `}
                      Des prestations pensées pour l’atmosphère de votre établissement.
                      {artisticProfile.domain && ` Expertise : ${artisticProfile.domain}.`}
                    </p>
                  </div>
                )}
                
                {/* Languages */}
                {artisticProfile.languages && artisticProfile.languages.length > 0 && (
                  <div className="p-6 bg-[var(--surface-raised)] rounded-card border border-line hover:border-gold/50 transition-colors">
                    <div className="w-12 h-12 rounded-card bg-gold/10 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-content mb-2">Performances multilingues</h3>
                    <p className="text-content-secondary text-sm leading-relaxed">
                      Fluent in {artisticProfile.languages.join(', ')}. Able to connect with international audiences and adapt performances to different cultural contexts.
                    </p>
                  </div>
                )}
                
                {/* Target Audience */}
                {artisticProfile.audienceType && artisticProfile.audienceType.length > 0 && (
                  <div className="p-6 bg-[var(--surface-raised)] rounded-card border border-line hover:border-gold/50 transition-colors">
                    <div className="w-12 h-12 rounded-card bg-gold/10 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-content mb-2">Un jeu qui s’adapte au public</h3>
                    <p className="text-content-secondary text-sm leading-relaxed">
                      Experienced in performing for {artisticProfile.audienceType.join(', ').toLowerCase()}. Tailored performances that resonate with your specific clientele.
                    </p>
                  </div>
                )}
                
                {/* Professional Commitment */}
                <div className="p-6 bg-[var(--surface-raised)] rounded-card border border-line hover:border-gold/50 transition-colors">
                  <div className="w-12 h-12 rounded-card bg-gold/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-content mb-2">Excellence professionnelle</h3>
                  <p className="text-content-secondary text-sm leading-relaxed">
                    Basé {artist.user?.country ? `en ${artist.user.country}` : 'à l’international'}. Un matériel professionnel et une préparation méticuleuse, au service de la qualité.
                  </p>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        )}

        {/* Rating Badge */}
        {artist.ratingBadge && (
          <ScrollAnimationWrapper animation="fade-up" delay={0.2}>
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/30 rounded-control">
                <Star className="w-5 h-5 text-gold fill-current" />
                <span className="text-sm font-medium text-content">
                  {artist.ratingBadge}
                </span>
              </div>
            </div>
          </ScrollAnimationWrapper>
        )}

        {/* Experience & Achievements */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.5}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-content mb-4">Expérience et distinctions</h2>
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-gold/5 to-transparent rounded-card border-l-4 border-gold">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-control bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-gold fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-content mb-2">Excellence professionnelle</h3>
                    <p className="text-content-secondary text-sm leading-relaxed">
                      Avec {artist.bookings?.length || 0} {(artist.bookings?.length || 0) >= 2 ? 'engagements menés à bien' : 'engagement mené à bien'} et {artist.avgRating ? `une note de ${artist.avgRating.toFixed(1)}/5` : 'd’excellents retours'},
                      {artist.stageName || artist.user?.name} s’est construit une réputation de fiabilité et d’exigence.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-r from-navy/5 to-transparent rounded-card border-l-4 border-navy">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-control bg-navy/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-content" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-content mb-2">Présence internationale</h3>
                    <p className="text-content-secondary text-sm leading-relaxed">
                      Basé {artist.user?.country ? `en ${artist.user.country}` : 'à l’international'}, disponible partout dans le monde.
                      Habitué à s’adapter aux lieux, aux cultures et aux attentes de chaque public.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Availability */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.6}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-content mb-4">Disponibilités</h2>
            <p className="text-content-secondary mb-6">Disponibilités pour les prochaines dates</p>
            
            {artist.availability && artist.availability.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artist.availability.map((avail: any, index: number) => (
                  <div key={index} className="p-5 bg-[var(--surface-raised)] border-2 border-line rounded-card hover:border-gold hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-card bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-control bg-green-500"></div>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">Disponible</span>
                        </div>
                        <p className="text-base font-semibold text-content mb-1">
                          {new Date(avail.dateFrom).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-content-secondary">
                          to {new Date(avail.dateTo).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-[var(--surface-warm)] rounded-card border-2 border-dashed border-line text-center">
                <div className="w-16 h-16 rounded-control bg-surface-sunken flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-content-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-content mb-2">Disponibilités bientôt publiées</h3>
                <p className="text-content-secondary mb-4">
                  Contactez {artist.stageName || artist.user?.name} directement pour échanger sur les dates et les disponibilités.
                </p>
                {user && user.role === 'HOTEL' && (
                  <button
                    onClick={() => toast.success('Demande de contact envoyée')}
                    className="btn-primary mx-auto"
                  >
                    Demander les disponibilités
                  </button>
                )}
              </div>
            )}
          </div>
        </ScrollAnimationWrapper>

        {/* Testimonials Placeholder */}
        {artist.bookings && artist.bookings.length > 0 && (
          <ScrollAnimationWrapper animation="fade-up" delay={0.7}>
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-bold text-content mb-4">Témoignages</h2>
              <p className="text-content-secondary mb-6">Ce que les lieux disent de leur collaboration avec {artist.stageName || artist.user?.name}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Placeholder testimonials */}
                <div className="p-6 bg-[var(--surface-raised)] rounded-card border border-line shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-content-secondary italic mb-4 leading-relaxed">
                    «&nbsp;Un talent et un professionnalisme rares. Nos clients ont été conquis par la qualité de la prestation.&nbsp;»
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-control bg-gold/20 flex items-center justify-center">
                      <span className="text-gold font-semibold text-sm">H</span>
                    </div>
                    <div>
                      <p className="font-semibold text-content text-sm">Hôtel partenaire</p>
                      <p className="text-content-secondary text-xs">Réservation vérifiée</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-[var(--surface-raised)] rounded-card border border-line shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-content-secondary italic mb-4 leading-relaxed">
                    «&nbsp;Un moment vraiment mémorable pour nos clients. Professionnel, ponctuel et remarquablement doué. Nous recommandons sans réserve.&nbsp;»
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-control bg-gold/20 flex items-center justify-center">
                      <span className="text-gold font-semibold text-sm">V</span>
                    </div>
                    <div>
                      <p className="font-semibold text-content text-sm">Responsable du lieu</p>
                      <p className="text-content-secondary text-xs">Réservation vérifiée</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        )}
      </div>
      
      <Footer />
    </div>
  )
}

export default PublicArtistProfile


