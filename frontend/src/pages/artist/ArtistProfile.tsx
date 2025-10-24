import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Save, Edit3, Star, MapPin, Music, Calendar } from 'lucide-react'

const ArtistProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Sophie Laurent',
    discipline: 'Classical Pianist',
    bio: 'Award-winning classical pianist with 15 years of experience performing in prestigious venues across Europe. Specializes in intimate rooftop performances and grand ballroom concerts.',
    location: 'Paris, France',
    hotelRating: '4.8',
    specialties: ['Rooftop Piano', 'Intimate Concerts', 'Classical Music', 'Jazz Fusion'],
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
    ],
    videos: [
      'https://www.youtube.com/watch?v=example1',
      'https://www.youtube.com/watch?v=example2'
    ],
    rating: 4.9,
    totalBookings: 24,
    memberSince: '2023-01-15'
  })

  const handleSave = () => {
    // Save profile logic here
    setIsEditing(false)
    // Show success message
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
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Profile Overview */}
      <div className="card-luxury">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={profile.images[0]}
                alt={profile.name}
                className="w-48 h-48 rounded-xl object-cover"
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
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-xl font-serif font-semibold text-navy">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="form-label">Discipline</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.discipline}
                    onChange={(e) => setProfile({...profile, discipline: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-lg text-gold font-medium">{profile.discipline}</p>
                )}
              </div>

              <div>
                <label className="form-label">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {profile.location}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Hotel Rating</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.hotelRating}
                    onChange={(e) => setProfile({...profile, hotelRating: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-lg font-semibold text-navy">{profile.hotelRating}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="form-label">Bio</label>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="form-input h-32 resize-none"
                  placeholder="Tell hotels about your artistic journey and specialties..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-gold mr-1" />
                  <span className="text-lg font-bold text-navy">{profile.rating}</span>
                </div>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-gold mr-1" />
                  <span className="text-lg font-bold text-navy">{profile.totalBookings}</span>
                </div>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Music className="w-5 h-5 text-gold mr-1" />
                  <span className="text-lg font-bold text-navy">Member</span>
                </div>
                <p className="text-sm text-gray-600">Since {new Date(profile.memberSince).toLocaleDateString()}</p>
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
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm flex items-center"
                >
                  {specialty}
                  <button className="ml-2 text-gold hover:text-gold/70">×</button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add new specialty..."
                className="form-input flex-1"
              />
              <button className="btn-secondary">Add</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {profile.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium"
              >
                {specialty}
              </span>
            ))}
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profile.images.map((image, index) => (
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
        <div className="space-y-4">
          {profile.videos.map((video, index) => (
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
