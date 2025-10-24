import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { ApiResponse, LoginCredentials, RegisterData, User } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:4000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
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

  async get<T>(url: string): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.get(url)
  }

  async post<T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.post(url, data)
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.put(url, data)
  }

  async delete<T>(url: string): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.delete(url)
  }

  async patch<T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
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
}

// Artists API
export const artistsApi = {
  getAll: (params?: any) =>
    apiClient.get('/artists', { params }),
  
  getById: (id: string) =>
    apiClient.get(`/artists/${id}`),
  
  createProfile: (data: any) =>
    apiClient.post('/artists', data),
  
  updateProfile: (data: any) =>
    apiClient.put('/artists', data),
  
  setAvailability: (id: string, data: any) =>
    apiClient.post(`/artists/${id}/availability`, data),
}

// Hotels API
export const hotelsApi = {
  getAll: (params?: any) =>
    apiClient.get('/hotels', { params }),
  
  getById: (id: string) =>
    apiClient.get(`/hotels/${id}`),
  
  createProfile: (data: any) =>
    apiClient.post('/hotels', data),
  
  updateProfile: (data: any) =>
    apiClient.put('/hotels', data),
  
  addRoomAvailability: (id: string, data: any) =>
    apiClient.post(`/hotels/${id}/rooms`, data),
  
  purchaseCredits: (id: string, data: any) =>
    apiClient.post(`/hotels/${id}/credits/purchase`, data),
  
  browseArtists: (id: string, params?: any) =>
    apiClient.get(`/hotels/${id}/artists`, { params }),
  
  requestBooking: (id: string, data: any) =>
    apiClient.post(`/hotels/${id}/bookings`, data),
  
  confirmBooking: (id: string, bookingId: string) =>
    apiClient.post(`/hotels/${id}/bookings/${bookingId}/confirm`),
  
  rateArtist: (id: string, bookingId: string, data: any) =>
    apiClient.post(`/hotels/${id}/bookings/${bookingId}/rate`, data),
}

// Admin API
export const adminApi = {
  getDashboard: () =>
    apiClient.get('/admin/dashboard'),
  
  getUsers: (params?: any) =>
    apiClient.get('/admin/users', { params }),
  
  suspendUser: (id: string, data: any) =>
    apiClient.post(`/admin/users/${id}/suspend`, data),
  
  activateUser: (id: string) =>
    apiClient.post(`/admin/users/${id}/activate`),
  
  getBookings: (params?: any) =>
    apiClient.get('/admin/bookings', { params }),
  
  exportData: (type: string) =>
    apiClient.get(`/admin/export?type=${type}`, { responseType: 'blob' }),
}

// Common API
export const commonApi = {
  createReferral: (data: any) =>
    apiClient.post('/referrals', data),
  
  getTopArtists: (params?: any) =>
    apiClient.get('/top?type=artists', { params }),
  
  getTopHotels: (params?: any) =>
    apiClient.get('/top?type=hotels', { params }),
  
  getStats: () =>
    apiClient.get('/stats'),
}
