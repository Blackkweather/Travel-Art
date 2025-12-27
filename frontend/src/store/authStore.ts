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
  syncClerkUser: (clerkUser: any) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        // This method is kept for backward compatibility
        // But actual login now happens via Clerk in LoginPage component
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
      
      syncClerkUser: async (clerkUser: any) => {
        try {
          // Get Clerk session token
          const { useAuth } = await import('@clerk/clerk-react')
          // We need to get the token from Clerk's getToken method
          // For now, we'll store a placeholder and get the actual token when making requests
          
          // Sync Clerk user data with our backend
          const response = await fetch('/api/auth/clerk/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            const user = result.data?.user || result.user
            
            // Store Clerk user ID as token placeholder - actual token will be retrieved per request
            set({
              user,
              token: clerkUser.id, // Store Clerk ID temporarily
              isAuthenticated: true
            })
          } else {
            // Fallback to existing API
            const apiResponse = await authApi.getCurrentUser()
            set({
              user: apiResponse.data.data.user,
              isAuthenticated: true
            })
          }
        } catch (error) {
          console.error('Failed to sync Clerk user:', error)
          // Try to get user from existing API as fallback
          try {
            const response = await authApi.getCurrentUser()
            set({
              user: response.data.data.user,
              isAuthenticated: true
            })
          } catch (fallbackError) {
            console.error('Fallback sync also failed:', fallbackError)
          }
        }
      },

      logout: async () => {
        // Sign out from Clerk if available
        try {
          const { useClerk } = await import('@clerk/clerk-react')
          // Note: We can't use hooks here, so we'll handle it in components
          // The logout will be handled by Clerk's signOut in the component
        } catch (error) {
          // Clerk not available, just clear local state
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        set({ isLoading: true })
        try {
          const response = await authApi.getCurrentUser()
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          // Token invalid or expired - clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
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
