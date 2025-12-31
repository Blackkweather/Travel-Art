import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Save, Edit3, MapPin, Building, Calendar, Users } from 'lucide-react'

const HotelProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Hotel Plaza Athénée',
    category: 'Luxury Palace',
    bio: 'Iconic luxury hotel in the heart of Paris with stunning Eiffel Tower views and talented hearts rooftop venues. We specialize in intimate concerts and grand performances.',
    location: 'Paris, France',
    address: '25 Avenue Montaigne, 75008 Paris, France',
    specialties: ['Eiffel Tower Views', 'Intimate Concerts', 'Classical Music', 'Rooftop Performances'],
    performanceSpots: [
      {
        name: 'Rooftop Terrace',
        capacity: 50,
        description: 'Stunning outdoor space with panoramic city views',
        amenities: ['Sound System', 'Lighting', 'Weather Protection']
      },
      {
        name: 'Grand Ballroom',
        capacity: 200,
        description: 'Elegant indoor venue for formal performances',
        amenities: ['Grand Piano', 'Professional Lighting', 'Air Conditioning']
      },
      {
        name: 'Elegant Lounge',
        capacity: 30,
        description: 'Intimate space for acoustic performances',
        amenities: ['Acoustic Setup', 'Intimate Lighting', 'Bar Service']
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80'
    ],
    rating: 4.9,
    totalBookings: 45,
    memberSince: '2023-01-10',
    contactEmail: 'events@plaza-athenee.com',
    contactPhone: '+33 1 53 67 66 00'
  })

  const handleSave = () => {
    // Save profile logic here
    setIsEditing(false)
    // Show success message
  }

  return (
    <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
            Hotel Profile
          </h1>
          <p className="text-gray-600">
            Manage your hotel profile and showcase your luxury venues to artists
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
          {/* Hotel Image */}
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
                <label className="form-label">Hotel Name</label>
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
                <label className="form-label">Category</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.category}
                    onChange={(e) => setProfile({...profile, category: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-lg text-gold font-medium">{profile.category}</p>
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
                <label className="form-label">Contact Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.contactEmail}
                    onChange={(e) => setProfile({...profile, contactEmail: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="text-gray-600">{profile.contactEmail}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="form-label">Hotel Description</label>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="form-input h-32 resize-none"
                  placeholder="Describe your hotel and its unique features..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-gold font-bold mr-1">◆</span>
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
                  <Building className="w-5 h-5 text-gold mr-1" />
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
          Hotel Specialties
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

      {/* Performance Spots */}
      <div className="card-luxury">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-navy gold-underline">
            Performance Venues
          </h2>
          {isEditing && (
            <button className="btn-secondary flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Add Venue</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.performanceSpots.map((spot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4"
            >
              <h3 className="font-semibold text-navy mb-2">{spot.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{spot.description}</p>
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <Users className="w-4 h-4 mr-1" />
                <span>Capacity: {spot.capacity}</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-navy mb-2">Amenities:</h4>
                <div className="flex flex-wrap gap-1">
                  {spot.amenities.map((amenity, amenityIndex) => (
                    <span
                      key={amenityIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              {isEditing && (
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 btn-secondary text-sm">Edit</button>
                  <button className="btn-secondary text-sm text-red-600">Remove</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hotel Images */}
      <div className="card-luxury">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-navy gold-underline">
            Hotel Gallery
          </h2>
          {isEditing && (
            <button className="btn-secondary flex items-center justify-center space-x-2">
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="leading-none">Add Images</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profile.images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Hotel ${index + 1}`}
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

      {/* Contact Information */}
      <div className="card-luxury">
        <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Address</label>
            {isEditing ? (
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="form-input h-20 resize-none"
              />
            ) : (
              <p className="text-gray-600">{profile.address}</p>
            )}
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.contactPhone}
                onChange={(e) => setProfile({...profile, contactPhone: e.target.value})}
                className="form-input"
              />
            ) : (
              <p className="text-gray-600">{profile.contactPhone}</p>
            )}
          </div>
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
      </div>
  )
}

export default HotelProfile
