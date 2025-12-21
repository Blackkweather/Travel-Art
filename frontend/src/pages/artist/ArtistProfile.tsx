import React, { useState, useEffect } from 'react'
import { Camera, Upload, Save, Edit3, MapPin, Music, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { artistsApi } from '@/utils/api'
import toast from 'react-hot-toast'

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
        setProfileData({
          name: artist.user?.name || user.name || '',
          discipline: artist.discipline || '',
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
      // TODO: Implement update profile API call
      toast.success('Profile updated successfully')
      setIsEditing(false)
      await fetchProfile()
    } catch (error: any) {
      toast.error('Failed to update profile')
      console.error('Error updating profile:', error)
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
            <div className="relative">
              <img
                src={profileData.images[0] || '/placeholder-artist.jpg'}
                alt={profileData.name}
                className="w-48 h-48 rounded-xl object-cover bg-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-artist.jpg'
                }}
              />
              {isEditing && (
                <button className="absolute bottom-2 right-2 bg-gold text-navy p-2 rounded-full hover:bg-gold/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
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

      {/* Specialties */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Specialties
        </h2>
        {profileData.specialties.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {profileData.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium"
              >
                {specialty}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No specialties added yet. Click &quot;Edit Profile&quot; to add specialties.</p>
        )}
      </div>

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
          <h2 className="text-xl font-serif font-semibold text-navy gold-underline">
            Performance Videos
          </h2>
          {isEditing && (
            <button className="btn-secondary flex items-center justify-center space-x-2">
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="leading-none">Add Video</span>
            </button>
          )}
        </div>
        {profileData.videos.length > 0 ? (
          <div className="space-y-4">
            {profileData.videos.map((video, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gold rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <p className="font-medium text-navy">Performance Video {index + 1}</p>
                    <p className="text-sm text-gray-600">{video}</p>
                  </div>
                </div>
                {isEditing && (
                  <button className="text-red-500 hover:text-red-700">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No performance videos yet. Click &quot;Edit Profile&quot; to add videos.</p>
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
