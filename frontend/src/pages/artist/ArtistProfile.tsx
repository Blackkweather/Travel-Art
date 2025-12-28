import React, { useState, useEffect } from 'react'
import { Save, Edit3, MapPin, Music, Calendar, X, Upload, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { artistsApi, apiClient } from '@/utils/api'
import toast from 'react-hot-toast'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'

const ArtistProfile: React.FC = () => {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
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

  useEffect(() => {
    fetchProfile()
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
        
        setProfileData({
          name: artist.stageName || artist.user?.name || user.name || '',
          discipline: artist.discipline || artisticProfile.mainCategory || '',
          bio: artist.bio || '',
          location: artist.user?.country || '',
          images: artist.images || [],
          videos: artist.videos || [],
          specialties: artist.discipline ? [artist.discipline] : [],
          rating: artist.avgRating || 0,
          totalBookings: artist.bookings?.length || 0,
          memberSince: artist.user?.createdAt || artist.createdAt || new Date().toISOString()
        })
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
        toast.error('Failed to load profile')
        console.error('Error fetching profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile?.id) {
      toast.error('Please create your profile first')
      return
    }

    try {
      // Update artist profile
      await apiClient.put('/artists/me', {
        bio: profileData.bio,
        discipline: profileData.discipline,
        stageName: profileData.name,
        phone: user?.phone,
        videos: JSON.stringify(profileData.videos),
        // Keep existing fields
        priceRange: profile.priceRange || '',
        profilePicture: profileData.images[0] || null
      });
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      await fetchProfile()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
      console.error('Error updating profile:', error)
    }
  }

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) {
      toast.error('Please enter a video URL')
      return
    }
    
    // Validate if it's a YouTube URL or other video URL
    const isValidUrl = newVideoUrl.includes('youtube.com') || 
                       newVideoUrl.includes('youtu.be') || 
                       newVideoUrl.startsWith('http')
    
    if (!isValidUrl) {
      toast.error('Please enter a valid YouTube or video URL')
      return
    }
    
    setProfileData({
      ...profileData,
      videos: [...profileData.videos, newVideoUrl]
    })
    setNewVideoUrl('')
    toast.success('Video added! Click "Save Changes" to update your profile')
  }

  const handleRemoveVideo = (index: number) => {
    setProfileData({
      ...profileData,
      videos: profileData.videos.filter((_, i) => i !== index)
    })
    toast.success('Video removed! Click "Save Changes" to update your profile')
  }

  const handleProfilePictureUpload = async (imageUrl: string) => {
    // Update profile data with new image
    setProfileData(prev => ({
      ...prev,
      images: [imageUrl, ...prev.images.slice(1)]
    }));

    // Save immediately
    try {
      await apiClient.put('/artists/me', {
        profilePicture: imageUrl
      });
      toast.success('Profile picture updated!');
      await fetchProfile();
    } catch (error: any) {
      toast.error('Failed to save profile picture');
    }
  }

  const handleDelete = async () => {
    if (!profile?.id) {
      toast.error('No profile to delete')
      return
    }
    const confirmed = window.confirm('Supprimer votre profil artiste ?')
    if (!confirmed) return
    try {
      await artistsApi.deleteProfile(profile.id)
      toast.success('Profil artiste supprimé')
      setProfile(null)
      await fetchProfile()
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Échec de la suppression')
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
            Artist Profile
          </h1>
          <p className="text-gray-600">
            Manage your profile and showcase your talent to luxury hotels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
          {profile?.id && (
            <button
              onClick={handleDelete}
              className="btn-primary"
            >
              Supprimer le profil
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <div className="card-luxury">
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
                  <img
                    src={profileData.images[0]}
                    alt={profileData.name}
                    className="w-full h-full rounded-xl object-cover bg-gray-200 ring-2 ring-gold/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const placeholder = target.nextElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-navy/10 to-gold/10 ring-2 ring-gold/20 flex items-center justify-center ${profileData.images[0] ? 'hidden' : 'flex'}`}
                  style={{ display: profileData.images[0] ? 'none' : 'flex' }}
                >
                  <User className="w-24 h-24 text-navy/30" />
                </div>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Artist Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-xl font-serif font-semibold text-navy">{profileData.name || 'Not set'}</p>
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
                <label className="form-label">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {profileData.location || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Average Rating</label>
                <p className="text-lg font-semibold text-navy">
                  {profileData.rating > 0 ? profileData.rating.toFixed(1) : 'No ratings yet'}
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
                  placeholder="Tell hotels about your artistic journey and specialties..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">
                  {profileData.bio || 'No bio yet. Click "Edit Profile" to add your bio.'}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-gold font-bold mr-1">◆</span>
                  <span className="text-lg font-bold text-navy">{profileData.rating > 0 ? profileData.rating.toFixed(1) : '0'}</span>
                </div>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-gold mr-1" />
                  <span className="text-lg font-bold text-navy">{profileData.totalBookings}</span>
                </div>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Music className="w-5 h-5 text-gold mr-1" />
                  <span className="text-lg font-bold text-navy">Member</span>
                </div>
                <p className="text-sm text-gray-600">
                  Since {profileData.memberSince ? new Date(profileData.memberSince).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Details */}
      {profile && (
        <div className="card-luxury">
          <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
            Registration Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.stageName && (
              <div>
                <label className="form-label">Stage Name</label>
                <p className="text-navy font-medium">{profile.stageName}</p>
              </div>
            )}
            
            {profile.birthDate && (
              <div>
                <label className="form-label">Birth Date</label>
                <p className="text-navy font-medium">{profile.birthDate}</p>
              </div>
            )}
            
            {profile.phone && (
              <div>
                <label className="form-label">Phone</label>
                <p className="text-navy font-medium">{profile.phone}</p>
              </div>
            )}
            
            {profile.user?.email && (
              <div>
                <label className="form-label">Email</label>
                <p className="text-navy font-medium">{profile.user.email}</p>
              </div>
            )}
            
            {(() => {
              let artisticProfile: any = {}
              if (profile.artisticProfile) {
                try {
                  artisticProfile = typeof profile.artisticProfile === 'string' 
                    ? JSON.parse(profile.artisticProfile) 
                    : profile.artisticProfile
                } catch (e) {
                  return null
                }
              }
              
              return (
                <>
                  {artisticProfile.mainCategory && (
                    <div>
                      <label className="form-label">Main Category</label>
                      <p className="text-navy font-medium">{artisticProfile.mainCategory}</p>
                    </div>
                  )}
                  
                  {artisticProfile.secondaryCategory && (
                    <div>
                      <label className="form-label">Secondary Category</label>
                      <p className="text-navy font-medium">{artisticProfile.secondaryCategory}</p>
                    </div>
                  )}
                  
                  {artisticProfile.specificCategory && (
                    <div>
                      <label className="form-label">Specialty</label>
                      <p className="text-navy font-medium">{artisticProfile.specificCategory}</p>
                    </div>
                  )}
                  
                  {artisticProfile.domain && (
                    <div>
                      <label className="form-label">Domain</label>
                      <p className="text-navy font-medium">{artisticProfile.domain}</p>
                    </div>
                  )}
                  
                  {artisticProfile.categoryType && (
                    <div>
                      <label className="form-label">Category Type</label>
                      <p className="text-navy font-medium">{artisticProfile.categoryType}</p>
                    </div>
                  )}
                  
                  {artisticProfile.languages && artisticProfile.languages.length > 0 && (
                    <div>
                      <label className="form-label">Languages</label>
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
                      <label className="form-label">Target Audience</label>
                      <div className="flex flex-wrap gap-2">
                        {artisticProfile.audienceType.map((aud: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-navy/10 text-navy rounded-full text-sm font-medium">
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
                <label className="form-label">Membership Status</label>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profile.membershipStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <p className="text-navy font-medium">
                    {profile.membershipStatus === 'ACTIVE' ? 'Active' : profile.membershipStatus}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Images */}
      <div className="card-luxury">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-navy gold-underline">
            Portfolio Images
          </h2>
          {isEditing && (
            <button className="btn-secondary flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Add Images</span>
            </button>
          )}
        </div>
        {profileData.images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profileData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No portfolio images yet. Click &quot;Edit Profile&quot; to add images.</p>
        )}
      </div>

      {/* Performance Videos */}
      <div className="card-luxury">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif font-semibold text-navy gold-underline">
              Performance Videos
            </h2>
            <p className="text-sm text-gray-600 mt-2">Add YouTube or video URLs to showcase your performances</p>
          </div>
        </div>
        
        {isEditing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="form-label">Add YouTube or Video URL</label>
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
            <p className="text-xs text-gray-600 mt-2">
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
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Video Preview */}
                  {isYouTube && videoId ? (
                    <div className="aspect-video bg-gray-900">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`Performance Video ${index + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <Music className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Video Preview</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Info */}
                  <div className="p-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy mb-1">Performance Video {index + 1}</p>
                      <p className="text-sm text-gray-600 truncate">{video}</p>
                    </div>
                    {isEditing && (
                      <button 
                        onClick={() => handleRemoveVideo(index)}
                        className="ml-4 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">No videos yet</h3>
            <p className="text-gray-600 mb-4">
              {isEditing 
                ? 'Add your first performance video using the form above' 
                : 'Click "Edit Profile" to add performance videos from YouTube or other sources'}
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary flex items-center justify-center space-x-2">
            <Save className="w-4 h-4 flex-shrink-0" />
            <span className="leading-none">Save Changes</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ArtistProfile
