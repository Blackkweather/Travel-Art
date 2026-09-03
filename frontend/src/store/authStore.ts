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
          
          /* Registration deliberately returns no token: the account is
             PENDING until an administrator admits it, so there is no session
             to establish. Setting isAuthenticated here would leave the app
             believing it is signed in while every authenticated call is
             refused - which is exactly what it used to do. */
          set({ isLoading: false })
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
        // Use a timeout to prevent blocking for too long
        set({ isLoading: true })
        try {
          // Add timeout to prevent blocking
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth check timeout')), 3000)
          )
          
          const response = await Promise.race([
            authApi.getCurrentUser(),
            timeoutPromise
          ]) as any
          
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error: any) {
          // Keep user logged in even on auth errors or timeout
          // Session persists until explicit logout
          // Only clear loading state, don't clear auth
          if (!error.message?.includes('timeout')) {
            console.warn('Auth check failed, but keeping session active:', error)
          }
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
