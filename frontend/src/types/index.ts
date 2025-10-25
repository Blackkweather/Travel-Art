export interface User {
  id: string
  role: 'ARTIST' | 'HOTEL' | 'ADMIN'
  email: string
  name: string
  country?: string
  language: string
  createdAt: string
  isActive: boolean
  artist?: Artist
  hotel?: Hotel
}

export interface Artist {
  id: string
  userId: string
  bio?: string
  discipline: string
  priceRange: string
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'PENDING'
  membershipRenewal?: string
  images?: string[]
  videos?: string[]
  mediaUrls?: string[]
  referralCode: string
  loyaltyPoints: number
  user?: User
  availability?: ArtistAvailability[]
  ratingBadge?: string
}

export interface Hotel {
  id: string
  userId: string
  name: string
  description?: string
  location?: {
    city: string
    country: string
    coords: { lat: number; lng: number }
  }
  contactPhone?: string
  images?: string[]
  performanceSpots?: PerformanceSpot[]
  rooms?: Room[]
  repName?: string
  user?: User
  availabilities?: Availability[]
}

export interface PerformanceSpot {
  name: string
  type: 'lounge' | 'resto' | 'pool' | 'ballroom'
  capacity: number
}

export interface Room {
  id: string
  name: string
  capacity: number
}

export interface Availability {
  id: string
  hotelId: string
  roomId: string
  dateFrom: string
  dateTo: string
  price?: number
}

export interface ArtistAvailability {
  id: string
  artistId: string
  dateFrom: string
  dateTo: string
}

export interface Booking {
  id: string
  hotelId: string
  artistId: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  creditsUsed: number
  createdAt: string
  hotel?: Hotel
  artist?: Artist
  ratings?: Rating[]
}

export interface Rating {
  id: string
  bookingId: string
  hotelId: string
  artistId: string
  stars: number
  textReview: string
  createdAt: string
  isVisibleToArtist: boolean
}

export interface Credit {
  id: string
  hotelId: string
  totalCredits: number
  usedCredits: number
}

export interface Transaction {
  id: string
  hotelId?: string
  artistId?: string
  type: 'CREDIT_PURCHASE' | 'MEMBERSHIP' | 'BOOKING_FEE' | 'REFUND'
  amount: number
  createdAt: string
}

export interface Referral {
  id: string
  inviterUserId: string
  inviteeUserId: string
  rewardPoints: number
  createdAt: string
  inviter?: User
  invitee?: User
}

export interface Notification {
  id: string
  userId: string
  type: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'RATING_RECEIVED' | 'MEMBERSHIP_EXPIRING' | 'REFERRAL_REWARD' | 'ADMIN_NOTIFICATION'
  payload: any
  read: boolean
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    message: string
    stack?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  role: 'ARTIST' | 'HOTEL'
  name: string
  email: string
  password: string
  locale?: string
}

export interface ArtistProfileData {
  bio: string
  discipline: string
  priceRange: string
  images?: string
  videos?: string
  mediaUrls?: string
}

export interface HotelProfileData {
  name: string
  description: string
  location: string
  contactPhone?: string
  images?: string
  performanceSpots?: string
  rooms?: string
  repName?: string
}

export interface BookingRequest {
  artistId: string
  startDate: string
  endDate: string
  specialRequests?: string
}

export interface RatingData {
  stars: number
  textReview: string
}

export interface CreditPurchase {
  amount: number
  credits: number
}

export interface AvailabilityData {
  dateFrom: string
  dateTo: string
}

export interface RoomAvailabilityData {
  roomId: string
  dateFrom: string
  dateTo: string
  price?: number
}

export interface SearchFilters {
  discipline?: string
  location?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}




