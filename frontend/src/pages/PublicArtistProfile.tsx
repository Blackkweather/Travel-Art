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
        toast.error('Artist profile not found')
      } else {
        toast.error('Failed to load artist profile')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <SimpleNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading artist profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-cream">
        <SimpleNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-navy mb-4">Artist Not Found</h2>
            <p className="text-gray-600 mb-6">The artist profile you're looking for doesn't exist.</p>
            <Link to="/top-artists" className="btn-primary">
              Browse Artists
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
    } catch (e) {
      images = []
    }
  }
  
  if (artist.videos) {
    try {
      videos = Array.isArray(artist.videos) 
        ? artist.videos 
        : (typeof artist.videos === 'string' ? JSON.parse(artist.videos) : [])
    } catch (e) {
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
    <div className="min-h-screen bg-cream" data-testid="artist-profile">
      <SimpleNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link 
          to="/top-artists" 
          className="inline-flex items-center text-navy hover:text-gold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Artists
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
                    className="w-full h-full rounded-full object-cover bg-gray-200 ring-2 ring-gold/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const placeholder = target.nextElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full rounded-full bg-gradient-to-br from-navy/10 to-gold/10 ring-2 ring-gold/20 flex items-center justify-center ${images[0] ? 'hidden' : 'flex'}`}
                  style={{ display: images[0] ? 'none' : 'flex' }}
                >
                  <User className="w-16 h-16 md:w-20 md:h-20 text-navy/30" />
                </div>
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy mb-2">
                {artist.stageName || artist.user?.name || 'Artist'}
              </h1>
              {artist.stageName && artist.user?.name && (
                <p className="text-sm text-gray-500 mb-2">({artist.user.name})</p>
              )}
              <p className="text-lg text-gold font-medium mb-3">{artist.discipline || 'Artist'}</p>
              
              {artist.user?.country && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">{artist.user.country}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                {artist.avgRating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold fill-current" />
                    <span className="text-sm font-medium text-navy">
                      {artist.avgRating.toFixed(1)} Rating
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-navy">
                    {artist.bookings?.length || 0} {(artist.bookings?.length || 0) === 1 ? 'Booking' : 'Bookings'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${artist.membershipStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium text-navy">
                    {artist.membershipStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons for Hotels */}
          {user && user.role === 'HOTEL' && (
            <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  toast.success('Contact request sent to artist!')
                }}
                className="flex-1 bg-navy hover:bg-navy/90 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Artist
              </button>
              <button
                onClick={() => {
                  setIsFavorite(!isFavorite)
                  toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites!')
                }}
                className={`px-6 py-3 rounded-lg font-medium border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  isFavorite 
                    ? 'bg-gold/10 border-gold text-gold' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gold hover:text-gold'
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
            <h2 className="text-2xl font-serif font-bold text-navy mb-4">About {artist.stageName || artist.user?.name}</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed text-base mb-4">
                {artist.bio || `${artist.stageName || artist.user?.name} is a professional ${artist.discipline || 'artist'} bringing exceptional talent and experience to luxury venues worldwide. With a passion for creating unforgettable moments, they specialize in delivering talented hearts performances tailored to sophisticated audiences.`}
              </p>
              {!artist.bio && (
                <>
                  <p className="text-gray-700 leading-relaxed text-base mb-4">
                    Their unique style and artistic vision have captivated audiences across {artist.user?.country || 'various locations'}, 
                    making them a sought-after performer for luxury hotels and exclusive events.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-base">
                    Whether performing for intimate gatherings or grand celebrations, {artist.stageName || artist.user?.name} brings 
                    professionalism, creativity, and an unmatched ability to connect with diverse audiences.
                  </p>
                </>
              )}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Artist Details */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.15}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-navy mb-6">Artist Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Category */}
              {(artist.discipline || artisticProfile.mainCategory) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Main Category</p>
                    <p className="text-base font-medium text-navy">{artist.discipline || artisticProfile.mainCategory}</p>
                  </div>
                </div>
              )}
              
              {/* Secondary Category */}
              {artisticProfile.secondaryCategory && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Secondary Category</p>
                    <p className="text-base font-medium text-navy">{artisticProfile.secondaryCategory}</p>
                  </div>
                </div>
              )}
              
              {/* Specific Category/Type */}
              {artisticProfile.specificCategory && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Specialty</p>
                    <p className="text-base font-medium text-navy">{artisticProfile.specificCategory}</p>
                  </div>
                </div>
              )}
              
              {/* Domain */}
              {artisticProfile.domain && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Domain</p>
                    <p className="text-base font-medium text-navy">{artisticProfile.domain}</p>
                  </div>
                </div>
              )}
              
              {/* Location */}
              {artist.user?.country && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Based in</p>
                    <p className="text-base font-medium text-navy">{artist.user.country}</p>
                  </div>
                </div>
              )}
              
              {/* Stage Name */}
              {artist.stageName && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Stage Name</p>
                    <p className="text-base font-medium text-navy">{artist.stageName}</p>
                  </div>
                </div>
              )}
              
              {/* Phone */}
              {artist.phone && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Contact Phone</p>
                    <p className="text-base font-medium text-navy">{artist.phone}</p>
                  </div>
                </div>
              )}
              
              {/* Birth Date */}
              {artist.birthDate && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Birth Date</p>
                    <p className="text-base font-medium text-navy">{artist.birthDate}</p>
                  </div>
                </div>
              )}
              
              {/* Languages */}
              {(artisticProfile.languages && artisticProfile.languages.length > 0) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Languages</p>
                    <p className="text-base font-medium text-navy">{artisticProfile.languages.join(', ')}</p>
                  </div>
                </div>
              )}
              
              {/* Audience Type */}
              {(artisticProfile.audienceType && artisticProfile.audienceType.length > 0) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Target Audience</p>
                    <p className="text-base font-medium text-navy">{artisticProfile.audienceType.join(', ')}</p>
                  </div>
                </div>
              )}
              
              {/* Rating */}
              {artist.avgRating && artist.avgRating >= 3.0 && artist.bookings && artist.bookings.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-gold fill-current" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Average Rating</p>
                    <p className="text-base font-medium text-navy">{artist.avgRating.toFixed(1)} / 5.0</p>
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
              <h2 className="text-2xl font-serif font-bold text-navy mb-4">Performance Videos</h2>
              <p className="text-gray-600 mb-6">Experience the artistry and talent through live performances</p>
              
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
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
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
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Placeholder Videos */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                      <Music className="w-8 h-8 text-gold" />
                    </div>
                    <p className="text-gray-600 text-center font-medium mb-2">Performance Showcase</p>
                    <p className="text-gray-500 text-sm text-center">Video coming soon</p>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      </svg>
                    </div>
                    <p className="text-gray-600 text-center font-medium mb-2">Live Performance</p>
                    <p className="text-gray-500 text-sm text-center">Video coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollAnimationWrapper>
        )}

        {/* Portfolio Images */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.3}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-navy mb-4">Visual Portfolio</h2>
            <p className="text-gray-600 mb-6">A glimpse into past performances and artistic moments</p>
            
            {images.length > 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.slice(1).map((image: string, index: number) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 group cursor-pointer">
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
                      <p className="text-white font-medium">View Image</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Photo {i}</p>
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
              <h2 className="text-2xl font-serif font-bold text-navy mb-4">What I Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Discipline/Category */}
                {(artisticProfile.mainCategory || artist.discipline) && (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gold/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                      <Music className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">{artisticProfile.mainCategory || artist.discipline} Performances</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {artisticProfile.specificCategory && `Specializing in ${artisticProfile.specificCategory}. `}
                      Professional {(artisticProfile.mainCategory || artist.discipline).toLowerCase()} performances tailored to elevate your venue's atmosphere.
                      {artisticProfile.domain && ` Expert in ${artisticProfile.domain}.`}
                    </p>
                  </div>
                )}
                
                {/* Languages */}
                {artisticProfile.languages && artisticProfile.languages.length > 0 && (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gold/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">Multilingual Performances</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Fluent in {artisticProfile.languages.join(', ')}. Able to connect with international audiences and adapt performances to different cultural contexts.
                    </p>
                  </div>
                )}
                
                {/* Target Audience */}
                {artisticProfile.audienceType && artisticProfile.audienceType.length > 0 && (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gold/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">Versatile Audience Appeal</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Experienced in performing for {artisticProfile.audienceType.join(', ').toLowerCase()}. Tailored performances that resonate with your specific clientele.
                    </p>
                  </div>
                )}
                
                {/* Professional Commitment */}
                <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gold/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-2">Professional Excellence</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Based in {artist.user?.country || 'multiple locations'}. Committed to delivering exceptional quality with professional equipment and meticulous preparation.
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
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/30 rounded-full">
                <Star className="w-5 h-5 text-gold fill-current" />
                <span className="text-sm font-medium text-navy">
                  {artist.ratingBadge}
                </span>
              </div>
            </div>
          </ScrollAnimationWrapper>
        )}

        {/* Experience & Achievements */}
        <ScrollAnimationWrapper animation="fade-up" delay={0.5}>
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-navy mb-4">Experience & Recognition</h2>
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-gold/5 to-transparent rounded-lg border-l-4 border-gold">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-gold fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-navy mb-2">Professional Excellence</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      With {artist.bookings?.length || 0} successful {(artist.bookings?.length || 0) === 1 ? 'engagement' : 'engagements'} and {artist.avgRating ? `a ${artist.avgRating.toFixed(1)}/5.0` : 'an excellent'} rating, 
                      {artist.stageName || artist.user?.name} has established a reputation for reliability and outstanding performances.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-r from-navy/5 to-transparent rounded-lg border-l-4 border-navy">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-navy mb-2">Global Reach</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Based in {artist.user?.country || 'multiple locations'}, available for performances worldwide. 
                      Experienced in adapting to different venues, cultures, and audience preferences.
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
            <h2 className="text-2xl font-serif font-bold text-navy mb-4">Booking Availability</h2>
            <p className="text-gray-600 mb-6">Current availability for upcoming engagements</p>
            
            {artist.availability && artist.availability.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artist.availability.map((avail: any, index: number) => (
                  <div key={index} className="p-5 bg-white border-2 border-gray-200 rounded-lg hover:border-gold hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-semibold text-green-600">Available</span>
                        </div>
                        <p className="text-base font-semibold text-navy mb-1">
                          {new Date(avail.dateFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-600">
                          to {new Date(avail.dateTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">Availability Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Contact {artist.stageName || artist.user?.name} directly to discuss booking opportunities and availability.
                </p>
                {user && user.role === 'HOTEL' && (
                  <button
                    onClick={() => toast.success('Contact request sent!')}
                    className="btn-primary mx-auto"
                  >
                    Request Availability
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
              <h2 className="text-2xl font-serif font-bold text-navy mb-4">Client Testimonials</h2>
              <p className="text-gray-600 mb-6">What venues are saying about working with {artist.stageName || artist.user?.name}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Placeholder testimonials */}
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4 leading-relaxed">
                    "Exceptional talent and professionalism. Our guests were thoroughly impressed by the performance quality and engagement."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold font-semibold text-sm">H</span>
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm">Luxury Hotel Partner</p>
                      <p className="text-gray-500 text-xs">Verified Booking</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4 leading-relaxed">
                    "A truly memorable experience for our guests. Professional, punctual, and incredibly talented. Highly recommended!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold font-semibold text-sm">V</span>
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm">Venue Manager</p>
                      <p className="text-gray-500 text-xs">Verified Booking</p>
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


