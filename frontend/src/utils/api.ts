import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { ApiResponse, LoginCredentials, RegisterData, User } from '@/types'
import { getClerkToken } from './clerkToken'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    // In production, use relative path since backend serves frontend
    // In development, use Vite proxy (/api) which proxies to localhost:4000
    const isProduction = (import.meta as any).env?.MODE === 'production'
    const apiUrl = (import.meta as any).env?.VITE_API_URL || (isProduction ? '/api' : '/api')
    
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
        // Try to get Clerk session token first
        const clerkToken = await getClerkToken()
        if (clerkToken) {
          config.headers.Authorization = `Bearer ${clerkToken}`
        } else {
          // Fallback to auth store token (for backward compatibility)
          const token = useAuthStore.getState().token
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout()
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T = any>(url: string, params?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.get(url, { params })
  }

  async post<T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.post(url, data)
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
    apiClient.post<{ user: User; token: string }>('/auth/register', data),
  
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
  
  updateProfile: (id: string, data: any) =>
    apiClient.put(`/artists/${id}`, data),
  
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
  
  updateProfile: (id: string, data: any) =>
    apiClient.put(`/hotels/${id}`, data),
  
  addRoomAvailability: (id: string, data: any) =>
    apiClient.post(`/hotels/${id}/rooms`, data),

  // Browse artists (service is artists, not hotels)
  browseArtists: (_hotelId: string, params?: any) =>
    apiClient.get(`/artists`, params),
  
  getCredits: (id: string) =>
    apiClient.get(`/hotels/${id}/credits`),
  
  // Credits purchase moved to payments service (see paymentsApi)
  
  getFavorites: (hotelId: string) => apiClient.get(`/hotels/${hotelId}/favorites`).catch(() => ({ data: { data: [] } })),
  addFavorite: (hotelId: string, artistId: string) => apiClient.post(`/hotels/${hotelId}/favorites`, { artistId }).catch(() => ({ data: { success: true } })),
  removeFavorite: (hotelId: string, artistId: string) => apiClient.delete(`/hotels/${hotelId}/favorites/${artistId}`).catch(() => ({ data: { success: true } })),
}

// Admin API
export const adminApi = {
  getDashboard: () =>
    apiClient.get('/admin/dashboard'),
  
  getUsers: (params?: any) =>
    apiClient.get('/admin/users', params),
  
  suspendUser: (id: string, data: any) =>
    apiClient.post(`/admin/users/${id}/suspend`, data),
  
  activateUser: (id: string) =>
    apiClient.post(`/admin/users/${id}/activate`),
  
  getBookings: (params?: any) =>
    apiClient.get('/admin/bookings', params),
  
  exportData: async (type: string) => {
    const response = await axios.get(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api'}/admin/export?type=${type}`, {
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
  
  getTopHotels: (params?: any) =>
    apiClient.get('/top?type=hotels', params),
  
  getStats: () =>
    apiClient.get('/stats'),
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
  membership: (artistId: string, membershipType: 'PROFESSIONAL' | 'ENTERPRISE', paymentMethod: string) =>
    apiClient.post('/payments/membership', { artistId, membershipType, paymentMethod }),
  transactions: (params?: any) => apiClient.get('/payments/transactions', params),
  refund: (transactionId: string) => apiClient.post(`/payments/refund/${transactionId}`),
}
