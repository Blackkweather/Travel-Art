import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { ApiResponse, LoginCredentials, RegisterData, User } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    // In production, use relative path since backend serves frontend
    // In development, use Vite proxy (/api) which proxies to localhost:4000
    // '/api' either way: in production the backend serves the built frontend
    // from the same origin, and in development Vite proxies /api to
    // localhost:4000. The isProduction ternary that used to be here chose
    // '/api' in both branches.
    const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api'


    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Get auth token from store
        const token = useAuthStore.getState().token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // For FormData, let the browser set Content-Type automatically (with boundary)
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    /* A 401 means the server no longer accepts this session - expired,
       revoked by a password change or "sign out everywhere", or the account
       was suspended. The app used to ignore it and keep the dashboard on
       screen while every request failed. Now the session ends, and the
       sign-in page says why. Sign-in itself answers 401 for a wrong password,
       which is not a session ending. */
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status
        const url = String(error.config?.url || '')
        const store = useAuthStore.getState()
        if (status === 401 && store.token && !url.includes('/auth/login')) {
          const code = error.response?.data?.error?.code
          store.endSession(code === 'SESSION_REVOKED' ? 'revoked' : code === 'ACCOUNT_INACTIVE' ? 'inactive' : 'expired')
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * `config` exists for the few calls that legitimately take longer than the
   * default ten seconds - the admin aggregates, which read several hundred
   * rows from a serverless database and were timing out on a cold connection.
   */
  async get<T = any>(
    url: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.get(url, { params, ...config })
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.post(url, data, config)
  }

  async put<T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.put(url, data)
  }

  /* `config` carries the rare DELETE that needs a body. Account erasure is
     one: it takes the password and a typed confirmation, and neither belongs
     in a query string where it would land in server logs. */
  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.delete(url, config)
  }

  async patch<T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.patch(url, data)
  }
}

export const apiClient = new ApiClient()

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{ user: User; token: string }>('/auth/login', credentials),

  register: (data: RegisterData) =>
    apiClient.post<{ user: User }>('/auth/register', data, {
      timeout: 45000,
    }),

  /** Live checks for the registration form: which of these fields are taken or invalid. */
  checkAvailability: (data: { email?: string; phone?: string; country?: string; stageName?: string; hotelName?: string; city?: string }) =>
    apiClient.post<{ fields: Record<string, string>; suggestion?: string }>('/auth/check-availability', data),

  resendVerification: (email: string) =>
    apiClient.post('/auth/resend-verification', { email }),

  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),

  logoutAll: () =>
    apiClient.post('/auth/logout-all'),

  getCurrentUser: () =>
    apiClient.get<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post('/auth/reset-password', data),
}

// Artists API
export const artistsApi = {
  getAll: (params?: any) =>
    apiClient.get('/artists', params),

  getById: (id: string) =>
    apiClient.get(`/artists/${id}`),

  getMyProfile: () =>
    apiClient.get('/artists/me'),

  // The server identifies the artist from the session; the id is ignored.
  updateProfile: (_id: string | undefined, data: any) =>
    apiClient.put('/artists/me', data),

  /** Add a performance video by link (YouTube, Vimeo or Instagram). */
  addVideo: (url: string, title?: string) =>
    apiClient.post('/artists/me/videos', { url, title }),

  /** Remove one of my photos or videos, by media id. */
  removeMedia: (mediaId: string) =>
    apiClient.delete(`/artists/me/media/${mediaId}`),

  reorderMedia: (ids: string[]) =>
    apiClient.put('/artists/me/media/order', { ids }),

  /** My personal code, to write in a video description to prove the channel is mine. */
  getVerificationCode: () =>
    apiClient.get<{ code: string }>('/artists/me/verification'),

  /** Look for my code in that video's description now. */
  verifyVideo: (mediaId: string) =>
    apiClient.post(`/artists/me/videos/${mediaId}/verify`, undefined, { timeout: 30000 }),

  setAvailability: (id: string, data: any) =>
    apiClient.post(`/artists/${id}/availability`, data),

  removeAvailability: (id: string, availabilityId: string) =>
    apiClient.delete(`/artists/${id}/availability/${availabilityId}`),
}

// Privacy / data-subject rights
export const privacyApi = {
  setConsent: (kind: 'TERMS' | 'PRIVACY' | 'COOKIES_ANALYTICS', granted: boolean) =>
    apiClient.post('/privacy/consent', { kind, granted }),

  getConsent: () => apiClient.get('/privacy/consent'),

  // Returns the whole record as a file, so it bypasses the JSON client.
  exportUrl: () => '/api/privacy/export',

  deleteAccount: (password: string) =>
    apiClient.delete('/privacy/account', { data: { confirm: 'SUPPRIMER', password } }),
}

// Hotels API
export const hotelsApi = {
  getAll: (params?: any) =>
    apiClient.get('/hotels', params),

  getById: (id: string) =>
    apiClient.get(`/hotels/${id}`),

  // The server identifies the hotel from the session; the id is ignored.
  updateProfile: (_id: string | undefined, data: any) =>
    apiClient.put('/hotels/me', data),

  /** The signed-in hotel's own profile, credits and programme included. */
  getMyProfile: (config?: any) =>
    apiClient.get('/hotels/me', undefined, config),

  removeMedia: (mediaId: string) =>
    apiClient.delete(`/hotels/me/media/${mediaId}`),

  // Browse artists (service is artists, not hotels)
  browseArtists: (_hotelId: string, params?: any) =>
    apiClient.get(`/artists`, params),

  getCredits: (id: string) =>
    apiClient.get(`/hotels/${id}/credits`),

  // Credits purchase moved to payments service (see paymentsApi)

  // These used to swallow every failure and resolve as though the call had
  // succeeded — getFavorites returned an empty list, the writes returned
  // { success: true }. HotelArtists already handles rejection properly (it
  // falls back to localStorage on read and reverts the star on write), and
  // that handling could never run while the errors were being masked.
  getFavorites: (hotelId: string, config?: any) => apiClient.get(`/hotels/${hotelId}/favorites`, undefined, config),
  addFavorite: (hotelId: string, artistId: string) => apiClient.post(`/hotels/${hotelId}/favorites`, { artistId }),
  removeFavorite: (hotelId: string, artistId: string) => apiClient.delete(`/hotels/${hotelId}/favorites/${artistId}`),
}

// Admin API
export const adminApi = {
  getDashboard: (config?: any) =>
    apiClient.get('/admin/dashboard', undefined, config),

  getUsers: (params?: any, config?: any) =>
    apiClient.get('/admin/users', params, config),

  suspendUser: (id: string, data: any) =>
    apiClient.post(`/admin/users/${id}/suspend`, data),

  activateUser: (id: string) =>
    apiClient.post(`/admin/users/${id}/activate`),

  getAdmissions: (status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING') =>
    apiClient.get('/admin/admissions', { status }),

  approve: (id: string) =>
    apiClient.post(`/admin/admissions/${id}/approve`),

  reject: (id: string, reason?: string) =>
    apiClient.post(`/admin/admissions/${id}/reject`, { reason }),

  resendVerification: (id: string) =>
    apiClient.post(`/admin/admissions/${id}/resend-verification`),

  getBookings: (params?: any, config?: any) =>
    apiClient.get('/admin/bookings', params, config),

  getLogs: (params?: any) =>
    apiClient.get('/admin/logs', params),

  getAllActivities: (params?: any, config?: any) =>
    apiClient.get('/admin/activities', params, config),

  getReferrals: (params?: any) =>
    apiClient.get('/admin/referrals', params),

  /** Rule on a video's ownership by hand. */
  setVideoVerification: (mediaId: string, status: 'VERIFIED' | 'REJECTED' | 'UNVERIFIED', note?: string) =>
    apiClient.post(`/admin/media/${mediaId}/verification`, { status, note }),

  /**
   * Downloads an admin export and saves it under the name the server chose.
   *
   * `format` is 'csv' or 'xlsx'. The filename comes from Content-Disposition
   * rather than being rebuilt here: the server already stamps the date and
   * knows the extension, and two places inventing the same name is how an
   * .xlsx ends up saved as .csv and refusing to open.
   */
  exportData: async (
    type: 'bookings' | 'users' | 'logs',
    format: 'csv' | 'xlsx' = 'csv'
  ) => {
    // Uses axios directly rather than apiClient because it needs a blob
    // response, but it must resolve the base URL the same way - its own
    // fallback was http://localhost:8080/api, a port nothing in this project
    // listens on, so an export in development failed with a network error.
    const baseUrl = (import.meta as any).env?.VITE_API_URL || '/api'
    const response = await axios.get(
      `${baseUrl}/admin/export?type=${type}&format=${format}`,
      {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        }
      }
    )

    const disposition = String(response.headers['content-disposition'] || '')
    const match = disposition.match(/filename="?([^";]+)"?/i)
    const filename = match ? match[1] : `travel-art-${type}.${format}`

    return { response, filename }
  },
}

// Common API
/**
 * What happened to your residencies. Polled by the bell in the header, so it
 * returns the unread count alongside the rows and the bell needs one request
 * rather than two.
 */
export const notificationsApi = {
  list: () => apiClient.get('/notifications'),

  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  readAll: () => apiClient.post('/notifications/read-all'),
}

export const commonApi = {
  getReferrals: () =>
    apiClient.get('/referrals'),

  /** Email someone an invitation carrying my referral link. */
  inviteReferral: (data: { inviteeEmail: string; inviteeName: string }) =>
    apiClient.post('/referrals/invite', data),

  getTopArtists: (params?: any) =>
    apiClient.get('/top?type=artists', params),

  // 40 rather than the endpoint's default of 10: the resort network is 35
  // properties and this page exists to show them.
  getTopHotels: (params?: any) =>
    apiClient.get('/top?type=hotels&limit=40', params),

  getStats: () =>
    apiClient.get('/stats'),

  getTestimonials: (params?: any) =>
    apiClient.get('/testimonials', params),
}

// Trips API
export const tripsApi = {
  getAll: (params?: any) =>
    apiClient.get('/trips', params),

  getById: (id: string) =>
    apiClient.get(`/trips/${id}`),
}

/** A file the API returns, fetched with the session, with the name it chose. */
async function downloadFile(path: string, fallbackName: string) {
  const baseUrl = (import.meta as any).env?.VITE_API_URL || '/api'
  const response = await axios.get(`${baseUrl}${path}`, {
    responseType: 'blob',
    timeout: 30000,
    headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
  })
  const disposition = String(response.headers['content-disposition'] || '')
  const match = disposition.match(/filename="?([^";]+)"?/i)
  const url = URL.createObjectURL(response.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = match ? match[1] : fallbackName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// The tripartite convention of a booking
export const conventionsApi = {
  get: (bookingId: string) => apiClient.get(`/bookings/${bookingId}/convention`),
  sign: (bookingId: string, data: Record<string, unknown>) =>
    apiClient.post(`/bookings/${bookingId}/convention/sign`, data, { timeout: 45000 }),
  downloadPdf: (bookingId: string) => downloadFile(`/bookings/${bookingId}/convention.pdf`, 'convention.pdf'),
}

// What a cancellation after signature left owing (article 14)
export const claimsApi = {
  list: (params?: { open?: '1' }) => apiClient.get('/claims', params),
  payFee: (claimId: string) => apiClient.post(`/claims/${claimId}/fee/checkout`),
  settleFee: (claimId: string, status: 'PAID' | 'WAIVED', note?: string) =>
    apiClient.post(`/claims/${claimId}/fee/settle`, { status, note }),
  submitTransport: (claimId: string, form: FormData) =>
    apiClient.post(`/claims/${claimId}/transport`, form, { timeout: 60000 }),
  settleTransport: (claimId: string, status: 'PAID' | 'REJECTED', note?: string) =>
    apiClient.post(`/claims/${claimId}/transport/settle`, { status, note }),
}

// Bookings API
export const bookingsApi = {
  list: (params?: any, config?: any) => apiClient.get('/bookings', params, config),
  getById: (id: string) => apiClient.get(`/bookings/${id}`),
  /** A residency request with the convention's terms (see bookingCreateSchema in @shared/validation). */
  create: (data: Record<string, unknown> & { hotelId: string; artistId: string; startDate: string; endDate: string }) =>
    apiClient.post('/bookings', data),
  updateStatus: (id: string, status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED', reason?: string) =>
    apiClient.patch(`/bookings/${id}/status`, { status, reason }),
  // The hotel and the artist are read from the booking by the server.
  rate: (data: { bookingId: string; stars: number; textReview: string; isVisibleToArtist?: boolean }) =>
    apiClient.post('/bookings/ratings', data),
}

// Payments API
export const paymentsApi = {
  getPackages: () => apiClient.get('/payments/packages'),
  purchaseCredits: (hotelId: string, packageId: string, paymentMethod: string) =>
    apiClient.post('/payments/credits/purchase', { hotelId, packageId, paymentMethod }),
  // Tiers match the MembershipTier enum in the Prisma schema. This previously
  // offered 'ENTERPRISE', which the schema has never had.
  membership: (artistId: string, membershipType: 'ARTIST' | 'PROFESSIONAL', paymentMethod: string) =>
    apiClient.post('/payments/membership', { artistId, membershipType, paymentMethod }),
  transactions: (params?: any, config?: any) =>
    apiClient.get('/payments/transactions', params, config),
}
