import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginCredentials, RegisterData } from '@/types'
import { authApi } from '@/utils/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(credentials)
          const { user, token } = response.data.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          console.log('🔄 Registering user...', { email: data.email, role: data.role })
          const response = await authApi.register(data)
          console.log('📥 Registration response:', response.data)
          
          const { user, token } = response.data.data
          console.log('✅ User registered successfully:', { userId: user.id, email: user.email, token: token ? '✓' : '✗' })
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })
          
          console.log('💾 Auth state updated - user is now authenticated')
        } catch (error: any) {
          console.error('❌ Registration failed:', error.response?.data || error.message)
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        // Only clear local state - never auto-logout
        // Logout must be explicitly triggered by user action in components
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      checkAuth: async () => {
        const { token, user } = get()
        
        // If we have a user in state, keep them logged in
        // Session persists until explicit logout
        if (user && token) {
          set({ isLoading: false, isAuthenticated: true })
          return
        }
        
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        // If we have a token but no user, try to fetch user
        // But don't clear auth on errors - keep session active
        set({ isLoading: true })
        try {
          const response = await authApi.getCurrentUser()
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          // Keep user logged in even on auth errors
          // Session persists until explicit logout
          // Only clear loading state, don't clear auth
          console.warn('Auth check failed, but keeping session active:', error)
          set({ isLoading: false })
          // Don't clear user/token - keep them logged in
        }
      },

      updateUser: (user: User) => {
        set({ user })
      }
    }),
    {
      name: 'travel-art-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
