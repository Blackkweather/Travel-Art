export interface User {
  id: string
  role: 'ARTIST' | 'HOTEL' | 'ADMIN'
  email: string
  name: string
  phone?: string | null
  country?: string | null
  language: string
  createdAt: string
  isActive: boolean
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  emailVerified?: boolean
  artist?: Partial<Artist> | null
  hotel?: Partial<Hotel> | null
}

/** A photo or video, as the API returns it. */
export interface MediaItem {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  provider: 'UPLOAD' | 'LINK' | 'YOUTUBE' | 'VIMEO' | 'INSTAGRAM'
  url: string
  externalId: string | null
  title: string | null
  /** Where to point an iframe, for providers that can be embedded. */
  embedUrl: string | null
  /** Videos: shown to belong to the artist (code in the description, same channel, or a reviewer). */
  verification?: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED'
  verificationMethod?: string | null
  /** Videos: the channel the provider reports. */
  channel?: string | null
}

export interface Artist {
  id: string
  userId: string
  stageName?: string | null
  bio?: string | null
  discipline: string
  mainCategory?: string | null
  secondaryCategory?: string | null
  categoryType?: string | null
  specificCategory?: string | null
  tributeTo?: string | null
  audienceTypes?: string[]
  languages?: string[]
  otherLanguages?: string | null
  profilePicture?: string | null
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'PENDING'
  images?: string[]
  videos?: string[]
  media?: MediaItem[]
  user?: { name: string; country?: string | null; id?: string; email?: string; phone?: string | null }
  availability?: ArtistAvailability[]
  ratingBadge?: string | null
  averageRating?: number | null
  avgRating?: number | null
  ratingCount?: number
  bookingCount?: number
  /** Shown to hotels and admins only. */
  bookingCreditCost?: number
  // Own profile only
  phone?: string | null
  birthDate?: string | null
  referralCode?: string
  loyaltyPoints?: number
  priceRange?: string
  membershipTier?: 'ARTIST' | 'PROFESSIONAL' | null
  totalRatings?: number
}

export interface PerformanceSpot {
  id?: string
  name: string
  type?: string | null
  setting?: 'INDOOR' | 'OUTDOOR' | null
  capacity?: number | null
  description?: string | null
  hours?: string | null
  noiseLevel?: string | null
  media?: string[]
}

export interface HotelProgramme {
  audiences: string[]
  styles: string[]
  eventTypes: string[]
  appreciated?: string | null
  disliked?: string | null
  hasStage: boolean
  stageDimensions?: string | null
  hasSound: boolean
  soundDetails?: string | null
  lighting?: string | null
  hasScreens: boolean
  hasCrew: boolean
  collaborationTypes: string[]
  conditions?: string | null
  durationType?: string | null
  residenceDuration?: string | null
  openDates?: string | null
  offersLodging: boolean
  offersMeals: boolean
  offersTransport: boolean
  facilities?: string | null
  freedomLevel?: string | null
  expectations: string[]
  possibilities: string[]
  otherDetails?: string | null
  artistTypesNeeded?: string | null
  flowDescription?: string | null
  perWeek?: number | null
  perMonth?: number | null
  responseDelay?: string | null
  validationProcess?: string | null
  decisionMaker?: string | null
}

export interface Hotel {
  id: string
  userId: string
  name: string
  description?: string | null
  city: string
  country: string
  address?: string | null
  location?: {
    city: string
    country: string
    coords: { lat: number; lng: number } | null
  }
  latitude?: number | null
  longitude?: number | null
  hotelType?: string | null
  roomCount?: number | null
  website?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  youtubeUrl?: string | null
  profilePicture?: string | null
  images?: string[]
  media?: MediaItem[]
  performanceSpots?: PerformanceSpot[]
  user?: { name: string; country?: string | null; id?: string; email?: string }
  availabilities?: Availability[]
  averageRating?: number | null
  ratingCount?: number
  bookingCount?: number
  // Own profile only
  contactPhone?: string | null
  repName?: string | null
  responsibleName?: string | null
  responsiblePhone?: string | null
  responsibleEmail?: string | null
  availableCredits?: number
  totalCredits?: number
  usedCredits?: number
  programme?: HotelProgramme | null
}

export interface Availability {
  id: string
  hotelId?: string
  roomId: string
  dateFrom: string
  dateTo: string
  price?: number
}

export interface ArtistAvailability {
  id: string
  artistId?: string
  dateFrom: string
  dateTo: string
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
export type BoardType = 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD' | 'ALL_INCLUSIVE'
export type TransportTerms = 'HOTEL_PAYS' | 'ARTIST_PAYS' | 'SHARED' | 'NOT_NEEDED'

/** What the exchange convention fills in for this residency. */
export interface BookingConvention {
  companionName: string | null
  boardType: BoardType | null
  transportTerms: TransportTerms | null
  transportNotes: string | null
  performanceDescription: string | null
  performanceSchedule: string | null
  stayValue: number | null
  performanceValue: number | null
  currency: string
  roomType?: string | null
  includedServices?: string | null
  performanceLocation?: string | null
  performanceDuration?: string | null
  technicalConditions?: string | null
  socialContent?: string | null
}

export type ConventionParty = 'HOTEL' | 'PARTICIPANT' | 'COORDINATOR'

/** Who has signed the convention, and when it became final. */
export interface BookingSigning {
  finalizedAt: string | null
  signedBy: { party: ConventionParty; signedAt: string }[]
}

/** What a hotel's cancellation after signature left owing (article 14). */
export interface BookingClaim {
  id: string
  fee: { amount: number; status: 'DUE' | 'PAID' | 'WAIVED'; dueAt: string }
  transport: {
    eligible: boolean
    status: 'SUBMITTED' | 'PAID' | 'REJECTED' | null
    amount: number | null
    proofs: string[]
    dueAt: string | null
    settleNote: string | null
  }
}

/** One block of the convention document, as the API builds it. */
export type ConventionBlock =
  | { kind: 'title' | 'subtitle' | 'heading' | 'subheading'; text: string }
  | { kind: 'paragraph'; text: string; strong?: boolean }
  | { kind: 'field'; label: string; value: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'rule' }
  | { kind: 'signature'; party: ConventionParty; label: string; lines: string[]; signedAt: string | null }

export interface ConventionView {
  reference: string
  termsHash: string
  blocks: ConventionBlock[]
  status: 'TO_SIGN' | 'SIGNED' | 'UNAVAILABLE'
  finalizedAt: string | null
  signatures: { party: ConventionParty; signerName: string; signedAt: string }[]
  party: 'HOTEL' | 'PARTICIPANT' | null
  canSign: boolean
  prefill: Record<string, string> | null
}

/** A cancellation claim as the claims list returns it. */
export interface CancellationClaim {
  id: string
  bookingId: string
  fee: { amount: number; status: 'DUE' | 'PAID' | 'WAIVED'; dueAt: string; overdue: boolean; settledAt: string | null; note: string | null }
  transport: {
    eligible: boolean
    status: 'SUBMITTED' | 'PAID' | 'REJECTED' | null
    amount: number | null
    note: string | null
    proofs: string[]
    submittedAt: string | null
    dueAt: string | null
    overdue: boolean
    settledAt: string | null
    settleNote: string | null
  }
  booking: {
    id: string
    startDate: string
    endDate: string
    cancelledAt: string | null
    cancellationReason: string | null
    hotel: { id: string; name: string }
    artist: { id: string; stageName: string | null; name: string }
  }
  createdAt: string
}

export interface PartyContact {
  email: string | null
  phone: string | null
  name?: string | null
}

export interface Booking {
  id: string
  hotelId: string
  artistId: string
  startDate: string
  endDate: string
  status: BookingStatus
  /** What the booking cost the hotel in credits, frozen when it was created. */
  creditCost?: number
  notes?: string | null
  createdAt: string
  convention?: BookingConvention
  signing?: BookingSigning
  claim?: BookingClaim | null
  respondedAt?: string | null
  cancelledAt?: string | null
  cancelledByRole?: 'ARTIST' | 'HOTEL' | 'ADMIN' | null
  cancellationReason?: string | null
  hotel?: {
    id: string
    name: string
    city?: string
    country?: string
    location?: Hotel['location']
    profilePicture?: string | null
    user?: { id: string; name: string }
    /** Present once the residency is confirmed. */
    contact?: PartyContact | null
  }
  artist?: {
    id: string
    stageName?: string | null
    discipline?: string
    profilePicture?: string | null
    user?: { id: string; name: string }
    contact?: PartyContact | null
    phone?: string | null
  }
  ratings?: Rating[]
}

export interface Rating {
  id: string
  bookingId?: string
  hotelId?: string
  artistId?: string
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

/** A payment the account made through Stripe. */
export interface Transaction {
  id: string
  type: 'CREDIT_PURCHASE' | 'MEMBERSHIP' | 'REFUND'
  amount: number
  currency?: string
  status?: string
  description?: string | null
  createdAt: string
}

export interface Referral {
  id: string
  name: string
  discipline: string | null
  joinedDate: string
  status: 'active' | 'pending'
  creditsEarned: number
  image: string | null
}

export interface Notification {
  id: string
  userId?: string
  type: string
  payload: any
  read: boolean
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: {
    message: string
    /** Per-field messages, keyed by form field name. */
    fields?: Record<string, string>
    /** A machine-readable reason, e.g. EMAIL_NOT_VERIFIED. */
    code?: string
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

/** Registration payloads are typed by the shared schemas in @shared/validation. */
export type RegisterData = Record<string, unknown> & { role: 'ARTIST' | 'HOTEL' }

export interface AvailabilityData {
  dateFrom: string
  dateTo: string
}

export interface SearchFilters {
  discipline?: string
  category?: string
  search?: string
  location?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}
