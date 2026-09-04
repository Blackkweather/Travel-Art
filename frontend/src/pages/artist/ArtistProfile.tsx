import React, { useState, useEffect } from 'react'
import { Save, Edit3, MapPin, Music, Calendar, X, Upload, User, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { artistsApi, apiClient } from '@/utils/api'
import { normalizeImageUrl } from '@/utils/imageUrl'
import toast from 'react-hot-toast'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'
import DateRangePicker from '@/components/DateRangePicker'
import ConfirmDialog from '@/components/ConfirmDialog'
import { t } from '@/i18n'
import { formatShortDate } from '@/utils/i18n'
import SEOHead from '@/components/SEOHead'

const ArtistProfile: React.FC = () => {
  const [uploadingImages, setUploadingImages] = useState(false)
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    discipline: '',
    bio: '',
    location: '',
    images: [] as string[],
    videos: [] as string[],
    specialties: [] as string[],
    rating: 0,
    totalBookings: 0,
    memberSince: ''
  })
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [availabilities, setAvailabilities] = useState<any[]>([])
  const [newAvailability, setNewAvailability] = useState({ dateFrom: '', dateTo: '' })
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchAvailability()
  }, [user])

  const fetchProfile = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await artistsApi.getMyProfile()
      const artist = response.data?.data

      if (artist) {
        setProfile(artist)
        
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
        
        // Include profilePicture in images array if it exists
        const images = artist.images || [];
        const profilePicture = artist.profilePicture;
        const allImages = profilePicture && !images.includes(profilePicture) 
          ? [profilePicture, ...images] 
          : images;
        
        setProfileData({
          name: artist.stageName || artist.user?.name || user.name || '',
          discipline: artist.discipline || artisticProfile.mainCategory || '',
          bio: artist.bio || '',
          location: artist.user?.country || '',
          images: allImages,
          videos: artist.videos || [],
          specialties: artist.discipline ? [artist.discipline] : [],
          rating: artist.avgRating || 0,
          totalBookings: artist.bookings?.length || 0,
          memberSince: artist.user?.createdAt || artist.createdAt || new Date().toISOString()
        })
        
        // Load availability
        if (artist.availability) {
          setAvailabilities(Array.isArray(artist.availability) ? artist.availability : [])
        }
      } else {
        // No profile yet - set defaults from user
        setProfileData({
          name: user.name || '',
          discipline: '',
          bio: '',
          location: user.country || '',
          images: [],
          videos: [],
          specialties: [],
          rating: 0,
          totalBookings: 0,
          memberSince: user.createdAt || new Date().toISOString()
        })
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No profile yet - set defaults from user
        setProfileData({
          name: user?.name || '',
          discipline: '',
          bio: '',
          location: user?.country || '',
          images: [],
          videos: [],
          specialties: [],
          rating: 0,
          totalBookings: 0,
          memberSince: user?.createdAt || new Date().toISOString()
        })
      } else {
        toast.error(t('Impossible de charger le profil'))
        console.error('Error fetching profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile?.id) {
      toast.error(t('Créez d’abord votre profil'))
      return
    }

    try {
      // Update artist profile - only send fields that have values
      const updateData: any = {
        stageName: profileData.name,
        phone: user?.phone || undefined,
        videos: profileData.videos && profileData.videos.length > 0 ? JSON.stringify(profileData.videos) : undefined
      };

      // Only include bio if it has at least 10 characters
      if (profileData.bio && profileData.bio.trim().length >= 10) {
        updateData.bio = profileData.bio;
      }

      // Only include discipline if it has a value
      if (profileData.discipline && profileData.discipline.trim().length >= 2) {
        updateData.discipline = profileData.discipline;
      }

      // Only include priceRange if it has a value
      if (profile.priceRange && profile.priceRange.trim().length > 0) {
        updateData.priceRange = profile.priceRange;
      }

      // Only include profilePicture if it exists
      if (profileData.images && profileData.images.length > 0 && profileData.images[0]) {
        updateData.profilePicture = profileData.images[0];
      }

      // Include location (country) to update user's country
      if (profileData.location && profileData.location.trim().length > 0) {
        updateData.country = profileData.location.trim();
      }

      await apiClient.put('/artists/me', updateData);
      
      toast.success(t('Profil mis à jour'))
      setIsEditing(false)
      await fetchProfile()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
      console.error('Error updating profile:', error)
    }
  }

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) {
      toast.error(t('Saisissez l’adresse d’une vidéo'))
      return
    }
    
    // Validate if it's a YouTube URL or other video URL
    const isValidUrl = newVideoUrl.includes('youtube.com') || 
                       newVideoUrl.includes('youtu.be') || 
                       newVideoUrl.startsWith('http')
    
    if (!isValidUrl) {
      toast.error(t('Saisissez une adresse YouTube ou vidéo valide'))
      return
    }
    
    setProfileData({
      ...profileData,
      videos: [...profileData.videos, newVideoUrl]
    })
    setNewVideoUrl('')
    toast.success(t('Vidéo ajoutée. Utilisez « Enregistrer les modifications » pour mettre à jour votre profil'))
  }

  const handleRemoveVideo = (index: number) => {
    setProfileData({
      ...profileData,
      videos: profileData.videos.filter((_, i) => i !== index)
    })
    toast.success(t('Vidéo retirée. Utilisez « Enregistrer les modifications » pour mettre à jour votre profil'))
  }

  const fetchAvailability = async () => {
    if (!profile?.id) return
    
    try {
      // Availability is already included in profile.availability from fetchProfile
      // This function is kept for manual refresh if needed
      const response = await artistsApi.getMyProfile()
      const artist = response.data?.data
      if (artist?.availability) {
        setAvailabilities(Array.isArray(artist.availability) ? artist.availability : [])
      }
    } catch (error: any) {
      console.error('Error fetching availability:', error)
    }
  }

  const handleAddAvailability = async () => {
    if (!profile?.id) {
      toast.error(t('Créez d’abord votre profil'))
      return
    }

    if (!newAvailability.dateFrom || !newAvailability.dateTo) {
      toast.error(t('Sélectionnez une date de début et une date de fin'))
      return
    }

    if (new Date(newAvailability.dateFrom) >= new Date(newAvailability.dateTo)) {
      toast.error(t('La date de fin doit suivre la date de début'))
      return
    }

    try {
      setLoadingAvailability(true)
      await artistsApi.setAvailability(profile.id, {
        dateFrom: new Date(newAvailability.dateFrom).toISOString(),
        dateTo: new Date(newAvailability.dateTo).toISOString()
      })
      toast.success(t('Disponibilité ajoutée'))
      setNewAvailability({ dateFrom: '', dateTo: '' })
      await fetchAvailability()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add availability')
      console.error('Error adding availability:', error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleRemoveAvailability = async (availabilityId: string) => {
    if (!confirm('Are you sure you want to remove this availability period?')) return

    try {
      // Note: You may need to add a DELETE endpoint for availability
      // For now, we'll just remove it from the local state
      setAvailabilities(prev => prev.filter(a => a.id !== availabilityId))
      toast.success(t('Disponibilité retirée'))
    } catch (error: any) {
      toast.error(t('Impossible de retirer cette disponibilité'))
      console.error('Error removing availability:', error)
    }
  }

  const handleProfilePictureUpload = async (imageUrl: string) => {
    // The upload route already saved to database, just update local state
    // Update profile data with new image - put it first in the images array
    setProfileData(prev => {
      const existingImages = prev.images || [];
      // Remove the old profile picture if it exists, add new one at the start
      const filteredImages = existingImages.filter(img => img !== prev.images[0]);
      return {
        ...prev,
        images: [imageUrl, ...filteredImages]
      };
    });
    
    // Also update the profile state if it exists
    if (profile) {
      setProfile({
        ...profile,
        profilePicture: imageUrl
      });
    }
    
    toast.success(t('Photo de profil enregistrée'));
  }

  const handleDelete = async () => {
    if (!profile?.id) return
    setDeleting(true)
    try {
      await apiClient.delete(`/artists/${profile.id}`)
      toast.success(t('Profil artiste supprimé'))
      setProfile(null)
      await fetchProfile()
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Échec de la suppression')
    } finally {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-content-secondary">{t('Chargement du profil…')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SEOHead title={t('Mon profil') + ' — Travel Art'} />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
            {t('Profil de l’artiste')}
          </h1>
          <p className="text-content-secondary">
            {t('Gérez votre profil et présentez votre travail aux hôtels d’exception')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? t('Annuler') : t('Modifier le profil')}</span>
          </button>
          {profile?.id && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="btn-primary"
            >
              {t('Supprimer le profil')}
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <div className="panel p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {isEditing ? (
              <ProfilePictureUpload
                currentImage={profileData.images[0]}
                onUploadSuccess={handleProfilePictureUpload}
                role="ARTIST"
              />
            ) : (
              <div className="relative w-48 h-48">
                {profileData.images[0] ? (
                  <img decoding="async" loading="lazy"
                    src={normalizeImageUrl(profileData.images[0])}
                    alt={profileData.name}
                    className="w-full h-full rounded-card object-cover bg-surface-sunken ring-2 ring-gold/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const placeholder = target.nextElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`absolute inset-0 w-full h-full rounded-card bg-gradient-to-br from-navy/10 to-gold/10 ring-2 ring-gold/20 flex items-center justify-center ${profileData.images[0] ? 'hidden' : 'flex'}`}
                  style={{ display: profileData.images[0] ? 'none' : 'flex' }}
                >
                  <User className="w-24 h-24 text-content/30" />
                </div>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">{t('Nom de l’artiste')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-xl font-serif font-semibold text-content">{profileData.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="form-label">Discipline</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.discipline}
                    onChange={(e) => setProfileData({...profileData, discipline: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-lg text-gold font-medium">{profileData.discipline || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="form-label">Lieu</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-content-secondary flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {profileData.location || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Note moyenne</label>
                <p className="text-lg font-semibold text-content">
                  {profileData.rating > 0 ? profileData.rating.toFixed(1) : t('Pas encore d’avis')}
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="form-label">Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="form-input h-32 resize-none"
                  placeholder={t('Racontez aux hôtels votre parcours et vos spécialités…')}
                />
              ) : (
                <p className="text-content-secondary leading-relaxed">
                  {profileData.bio || t('Aucune biographie. Utilisez « Modifier le profil » pour en ajouter une.')}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-surface rounded-card">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-gold font-bold mr-1">◆</span>
                  <span className="text-lg font-bold text-content">{profileData.rating > 0 ? profileData.rating.toFixed(1) : '0'}</span>
                </div>
                <p className="text-sm text-content-secondary">Note moyenne</p>
              </div>
              <div className="text-center p-4 bg-surface rounded-card">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-gold mr-1" />
                  <span className="text-lg font-bold text-content">{profileData.totalBookings}</span>
                </div>
                <p className="text-sm text-content-secondary">{t('Réservations')}</p>
              </div>
              <div className="text-center p-4 bg-surface rounded-card">
                <div className="flex items-center justify-center mb-2">
                  <Music className="w-5 h-5 text-gold mr-1" />
                  <span className="text-lg font-bold text-content">{t('Membre')}</span>
                </div>
                <p className="text-sm text-content-secondary">
                  {t('Depuis {date}', { date: profileData.memberSince ? formatShortDate(profileData.memberSince) : t('Récemment') })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Details */}
      {profile && (
        <div className="panel p-6">
          <h2 className="text-xl font-serif font-semibold text-content mb-6 gold-underline">
            {t('Informations d’inscription')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.stageName && (
              <div>
                <label className="form-label">{t('Nom de scène')}</label>
                <p className="text-content font-medium">{profile.stageName}</p>
              </div>
            )}
            
            {profile.birthDate && (
              <div>
                <label className="form-label">{t('Date de naissance')}</label>
                <p className="text-content font-medium">{profile.birthDate}</p>
              </div>
            )}
            
            {profile.phone && (
              <div>
                <label className="form-label">Phone</label>
                <p className="text-content font-medium">{profile.phone}</p>
              </div>
            )}
            
            {profile.user?.email && (
              <div>
                <label className="form-label">E-mail</label>
                <p className="text-content font-medium">{profile.user.email}</p>
              </div>
            )}
            
            {(() => {
              let artisticProfile: any = {}
              if (profile.artisticProfile) {
                try {
                  artisticProfile = typeof profile.artisticProfile === 'string' 
                    ? JSON.parse(profile.artisticProfile) 
                    : profile.artisticProfile
                } catch {
                  return null
                }
              }
              
              return (
                <>
                  {artisticProfile.mainCategory && (
                    <div>
                      <label className="form-label">{t('Catégorie principale')}</label>
                      <p className="text-content font-medium">{artisticProfile.mainCategory}</p>
                    </div>
                  )}
                  
                  {artisticProfile.secondaryCategory && (
                    <div>
                      <label className="form-label">{t('Catégorie secondaire')}</label>
                      <p className="text-content font-medium">{artisticProfile.secondaryCategory}</p>
                    </div>
                  )}
                  
                  {artisticProfile.specificCategory && (
                    <div>
                      <label className="form-label">{t('Spécialité')}</label>
                      <p className="text-content font-medium">{artisticProfile.specificCategory}</p>
                    </div>
                  )}
                  
                  {artisticProfile.domain && (
                    <div>
                      <label className="form-label">Domaine</label>
                      <p className="text-content font-medium">{artisticProfile.domain}</p>
                    </div>
                  )}
                  
                  {artisticProfile.categoryType && (
                    <div>
                      <label className="form-label">Category Type</label>
                      <p className="text-content font-medium">{artisticProfile.categoryType}</p>
                    </div>
                  )}
                  
                  {artisticProfile.languages && artisticProfile.languages.length > 0 && (
                    <div>
                      <label className="form-label">Langues</label>
                      <div className="flex flex-wrap gap-2">
                        {artisticProfile.languages.map((lang: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-medium">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {artisticProfile.audienceType && artisticProfile.audienceType.length > 0 && (
                    <div>
                      <label className="form-label">{t('Type de public')}</label>
                      <div className="flex flex-wrap gap-2">
                        {artisticProfile.audienceType.map((aud: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-navy/10 text-content rounded-full text-sm font-medium">
                            {aud}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
            
            {profile.membershipStatus && (
              <div>
                <label className="form-label">{t('Statut de l’adhésion')}</label>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profile.membershipStatus === 'ACTIVE' ? 'bg-[var(--state-positive)]' : 'bg-[var(--border-strong)]'}`}></div>
                  <p className="text-content font-medium">
                    {profile.membershipStatus === 'ACTIVE' ? t('Active') : profile.membershipStatus}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Images */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-content gold-underline">
            {t('Images du portfolio')}
          </h2>
          {isEditing && (
            <>
              {/* POST /upload/media takes up to ten files per request; the
                  returned URLs are appended to the portfolio and persisted by
                  the page's existing save action. */}
              <input
                id="portfolio-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length) return
                  const form = new FormData()
                  files.slice(0, 10).forEach((f) => form.append('media', f))
                  try {
                    setUploadingImages(true)
                    const res = await apiClient.post('/upload/media', form)
                    const payload = res.data?.data
                    const urls: string[] = Array.isArray(payload)
                      ? payload.map((m: any) => m.url ?? m).filter(Boolean)
                      : (payload?.urls ?? []).filter(Boolean)
                    if (!urls.length) throw new Error('empty response')
                    setProfileData((prev: any) => ({
                      ...prev,
                      images: [...(prev.images || []), ...urls]
                    }))
                    toast.success(
                      `${urls.length} image(s) ajoutée(s). Enregistrez pour confirmer.`
                    )
                  } catch (err: any) {
                    toast.error(
                      err?.response?.data?.error?.message || 'Échec du téléversement'
                    )
                  } finally {
                    setUploadingImages(false)
                    e.target.value = ''
                  }
                }}
              />
              <button
                type="button"
                disabled={uploadingImages}
                onClick={() => document.getElementById('portfolio-upload')?.click()}
                className="btn-secondary flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingImages ? t('Téléversement…') : 'Ajouter des images'}</span>
              </button>
            </>
          )}
        </div>
        {profileData.images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profileData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img decoding="async" loading="lazy"
                  src={normalizeImageUrl(image)}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-48 object-cover rounded-card"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-card flex items-center justify-center">
                    <button className="bg-[var(--state-critical)] text-white p-2 rounded-full hover:bg-[var(--state-critical)] transition-colors">
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-content-secondary">{t('Aucune image dans le portfolio. Utilisez « Modifier le profil » pour en ajouter.')}</p>
        )}
      </div>

      {/* Availability Management */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif font-semibold text-content gold-underline">
              {t('Calendrier de disponibilités')}
            </h2>
            <p className="text-sm text-content-secondary mt-2">{t('Indiquez vos dates disponibles pour les réservations')}</p>
          </div>
        </div>

        {/* Add Availability Form */}
        <div className="mb-6 p-4 bg-[var(--state-info-wash)] border border-[var(--state-info-line)] rounded-card">
          <h3 className="form-label mb-4">{t('Ajouter une période de disponibilité')}</h3>
          <div className="space-y-4">
            <DateRangePicker
              startDate={newAvailability.dateFrom}
              endDate={newAvailability.dateTo}
              onStartDateChange={(date) => setNewAvailability({ ...newAvailability, dateFrom: date })}
              onEndDateChange={(date) => setNewAvailability({ ...newAvailability, dateTo: date })}
              minDate={new Date().toISOString().split('T')[0]}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddAvailability}
                disabled={loadingAvailability || !newAvailability.dateFrom || !newAvailability.dateTo}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {loadingAvailability ? t('Ajout…') : t('Ajouter la disponibilité')}
              </button>
            </div>
          </div>
        </div>

        {/* Availability List */}
        {availabilities.length > 0 ? (
          <div className="space-y-3">
            {availabilities
              .filter((avail: any) => new Date(avail.dateTo) >= new Date())
              .sort((a: any, b: any) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
              .map((avail: any) => (
                <div
                  key={avail.id}
                  className="flex items-center justify-between p-4 bg-surface rounded-card border border-line"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gold" />
                    <div>
                      <p className="font-medium text-content">
                        {new Date(avail.dateFrom).toLocaleDateString('fr-FR')} - {new Date(avail.dateTo).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-content-secondary">
                        {Math.ceil((new Date(avail.dateTo).getTime() - new Date(avail.dateFrom).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveAvailability(avail.id)}
                    className="px-3 py-2 text-[var(--state-critical)] hover:bg-[var(--state-critical-wash)] rounded-card transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Retirer
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-surface rounded-card border-2 border-dashed border-line-strong">
            <Calendar className="w-16 h-16 text-content-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-content mb-2">{t('Aucune disponibilité renseignée')}</h3>
            <p className="text-content-secondary mb-4">
              {t('Ajoutez vos dates ci-dessus pour que les hôtels puissent vous solliciter')}
            </p>
          </div>
        )}
      </div>

      {/* Performance Videos */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif font-semibold text-content gold-underline">
              {t('Vidéos de performances')}
            </h2>
            <p className="text-sm text-content-secondary mt-2">{t('Ajoutez des liens YouTube ou vidéo pour présenter vos performances')}</p>
          </div>
        </div>
        
        {isEditing && (
          <div className="mb-6 p-4 bg-[var(--state-info-wash)] border border-[var(--state-info-line)] rounded-card">
            <label className="form-label">{t('Ajouter un lien YouTube ou vidéo')}</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="form-input flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddVideo()
                  }
                }}
              />
              <button 
                onClick={handleAddVideo}
                className="btn-primary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Add Video
              </button>
            </div>
            <p className="text-xs text-content-secondary mt-2">
              💡 Tip: Paste a YouTube URL (e.g., https://www.youtube.com/watch?v=...) or direct video link
            </p>
          </div>
        )}
        
        {profileData.videos.length > 0 ? (
          <div className="space-y-4">
            {profileData.videos.map((video, index) => {
              // Check if it's a YouTube URL
              const isYouTube = video.includes('youtube.com') || video.includes('youtu.be')
              let videoId = ''
              
              if (isYouTube) {
                if (video.includes('youtube.com/watch?v=')) {
                  videoId = video.split('v=')[1]?.split('&')[0] || ''
                } else if (video.includes('youtu.be/')) {
                  videoId = video.split('youtu.be/')[1]?.split('?')[0] || ''
                } else if (video.includes('youtube.com/embed/')) {
                  videoId = video.split('embed/')[1]?.split('?')[0] || ''
                }
              }
              
              return (
                <div key={index} className="border border-line rounded-card overflow-hidden">
                  {/* Video Preview */}
                  {isYouTube && videoId ? (
                    <div className="aspect-video bg-surface-inverse">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`Performance Video ${index + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-surface-sunken flex items-center justify-center">
                      <div className="text-center">
                        <Music className="w-12 h-12 text-content-secondary mx-auto mb-2" />
                        <p className="text-sm text-content-secondary">Video Preview</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Info */}
                  <div className="p-4 bg-surface flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-content mb-1">Performance Video {index + 1}</p>
                      <p className="text-sm text-content-secondary truncate">{video}</p>
                    </div>
                    {isEditing && (
                      <button 
                        onClick={() => handleRemoveVideo(index)}
                        className="ml-4 px-3 py-2 text-[var(--state-critical)] hover:bg-[var(--state-critical-wash)] rounded-card transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-surface rounded-card border-2 border-dashed border-line-strong">
            <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-content-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-content mb-2">{t('Aucune vidéo')}</h3>
            <p className="text-content-secondary mb-4">
              {isEditing 
                ? t('Ajoutez votre première vidéo avec le formulaire ci-dessus') 
                : t('Utilisez « Modifier le profil » pour ajouter des vidéos de vos performances')}
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary flex items-center justify-center space-x-2">
            <Save className="w-4 h-4 flex-shrink-0" />
            <span className="leading-none">{t('Enregistrer les modifications')}</span>
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        title={t('Supprimer votre profil d’artiste ?')}
        body={
          <>
            <p>
              {t('Votre page publique, vos médias, vos disponibilités et votre historique de résidences seront supprimés.')}
            </p>
            <p>{t('Cette action est définitive.')}</p>
          </>
        }
        confirmLabel={t('Supprimer définitivement')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
        busy={deleting}
      />
    </div>
  )
}

export default ArtistProfile
