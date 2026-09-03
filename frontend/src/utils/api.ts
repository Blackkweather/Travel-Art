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

    // Response interceptor to handle auth errors
    // Keep users logged in until they explicitly logout
    // Only handle errors, don't auto-logout
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Don't automatically logout on 401 errors
        // Keep the session active - user must explicitly logout
        // Only log the error for debugging
        if (error.response?.status === 401) {
          console.warn('Authentication error (user remains logged in):', error.response?.data)
          // Don't call logout() - keep user logged in
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

  async delete<T = any>(url: string): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.delete(url)
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
    apiClient.post<{ user: User; token: string }>('/auth/register', data, {
      timeout: 45000,
    }),
  
  refresh: () =>
    apiClient.post<{ token: string }>('/auth/refresh'),
  
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
  
  createProfile: (data: any) =>
    apiClient.post('/artists', data),
  
  // The server exposes PUT /artists/me, not PUT /artists/:id. This previously
  // pointed at an endpoint that does not exist, so saving a profile 404d.
  // The id parameter is kept so existing callers do not need to change; the
  // server identifies the artist from the auth token.
  updateProfile: (_id: string | undefined, data: any) =>
    apiClient.put('/artists/me', data),

  setAvailability: (id: string, data: any) =>
    apiClient.post(`/artists/${id}/availability`, data),
}

// Hotels API
export const hotelsApi = {
  getAll: (params?: any) =>
    apiClient.get('/hotels', params),
  
  getById: (id: string) =>
    apiClient.get(`/hotels/${id}`),
  
  getByUser: (userId: string) =>
    apiClient.get(`/hotels/user/${userId}`),
  
  createProfile: (data: any) =>
    apiClient.post('/hotels', data),
  
  // Same as artists: the server exposes PUT /hotels/me, not PUT /hotels/:id.
  updateProfile: (_id: string | undefined, data: any) =>
    apiClient.put('/hotels/me', data),

  getMyProfile: () =>
    apiClient.get('/hotels/me'),
  
  addRoomAvailability: (id: string, data: any) =>
    apiClient.post(`/hotels/${id}/rooms`, data),

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
  getFavorites: (hotelId: string) => apiClient.get(`/hotels/${hotelId}/favorites`),
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
  
  getBookings: (params?: any, config?: any) =>
    apiClient.get('/admin/bookings', params, config),
  
  getLogs: (params?: any) =>
    apiClient.get('/admin/logs', params),
  
  getAllActivities: (params?: any) =>
    apiClient.get('/admin/activities', params),
  
  getReferrals: (params?: any) =>
    apiClient.get('/admin/referrals', params),
  
  exportData: async (type: string) => {
    // Uses axios directly rather than apiClient because it needs a blob
    // response, but it must resolve the base URL the same way - its own
    // fallback was http://localhost:8080/api, a port nothing in this project
    // listens on, so an export in development failed with a network error.
    const baseUrl = (import.meta as any).env?.VITE_API_URL || '/api'
    const response = await axios.get(`${baseUrl}/admin/export?type=${type}`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`
      }
    })
    return response
  },
}

// Common API
export const commonApi = {
  getReferrals: () =>
    apiClient.get('/referrals'),
  
  createReferral: (data: any) =>
    apiClient.post('/referrals', data),
  
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
  
  create: (data: any) =>
    apiClient.post('/trips', data),
  
  update: (id: string, data: any) =>
    apiClient.put(`/trips/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete(`/trips/${id}`),
}

// Bookings API
export const bookingsApi = {
  list: (params?: any) => apiClient.get('/bookings', params),
  getById: (id: string) => apiClient.get(`/bookings/${id}`),
  create: (data: { hotelId: string; artistId: string; startDate: string; endDate: string; creditsUsed: number; notes?: string }) =>
    apiClient.post('/bookings', data),
  updateStatus: (id: string, status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED') =>
    apiClient.patch(`/bookings/${id}/status`, { status }),
  rate: (data: { bookingId: string; hotelId: string; artistId: string; stars: number; textReview: string; isVisibleToArtist?: boolean }) =>
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
