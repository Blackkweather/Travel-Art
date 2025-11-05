// Shared types across all microservices

export interface User {
  id: string;
  role: 'ARTIST' | 'HOTEL' | 'ADMIN';
  email: string;
  name: string;
  phone?: string;
  country?: string;
  language: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Artist {
  id: string;
  userId: string;
  bio?: string;
  discipline: string;
  priceRange: string;
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'PENDING';
  membershipRenewal?: Date;
  images?: string;
  videos?: string;
  mediaUrls?: string;
  referralCode: string;
  loyaltyPoints: number;
}

export interface Hotel {
  id: string;
  userId: string;
  name: string;
  description?: string;
  location: string;
  contactPhone?: string;
  images?: string;
  performanceSpots?: string;
  rooms?: string;
  repName?: string;
}

export interface Booking {
  id: string;
  hotelId: string;
  artistId: string;
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  creditsUsed: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  hotelId?: string;
  artistId?: string;
  type: 'CREDIT_PURCHASE' | 'MEMBERSHIP' | 'BOOKING_FEE' | 'REFUND';
  amount: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'RATING_RECEIVED' | 
        'MEMBERSHIP_EXPIRING' | 'REFERRAL_REWARD' | 'ADMIN_NOTIFICATION';
  payload: string;
  read: boolean;
  createdAt: Date;
}

export interface Credit {
  id: string;
  hotelId: string;
  totalCredits: number;
  usedCredits: number;
}

export interface Rating {
  id: string;
  bookingId: string;
  hotelId: string;
  artistId: string;
  stars: number;
  textReview: string;
  createdAt: Date;
  isVisibleToArtist: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Service-to-Service Communication
export interface ServiceRequest {
  serviceName: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ARTIST' | 'HOTEL' | 'ADMIN';
}

// Event types for inter-service communication
export interface ServiceEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
}

export interface BookingCreatedEvent extends ServiceEvent {
  type: 'BOOKING_CREATED';
  payload: {
    bookingId: string;
    hotelId: string;
    artistId: string;
    startDate: Date;
    endDate: Date;
  };
}

export interface PaymentProcessedEvent extends ServiceEvent {
  type: 'PAYMENT_PROCESSED';
  payload: {
    transactionId: string;
    userId: string;
    amount: number;
    type: string;
  };
}














