import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginCredentials, RegisterData } from '@/types'
import { authApi } from '@/utils/api'

/** Why the session ended, shown once on the sign-in page. */
export type SessionEndReason = 'expired' | 'revoked' | 'inactive' | null

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  sessionEndReason: SessionEndReason
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  /** The server refused the session: clear it and remember why. */
  endSession: (reason: SessionEndReason) => void
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
      sessionEndReason: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(credentials)
          const { user, token } = response.data.data
          set({ user, token, isAuthenticated: true, isLoading: false, sessionEndReason: null })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          // No token comes back: the account is pending until confirmed and admitted.
          await authApi.register(data)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, sessionEndReason: null })
      },

      endSession: (reason) => {
        set({ user: null, token: null, isAuthenticated: false, sessionEndReason: reason })
      },

      /**
       * Ask the server who we are, every time the app starts.
       *
       * This used to trust whatever was in storage and never let go: a token
       * that had expired, been revoked or belonged to a suspended account kept
       * the dashboard on screen while every request behind it failed. Now a
       * refusal signs the user out (the API client does it on any 401), and
       * only a network failure keeps the stored session, so being offline for
       * a moment does not log anyone out.
       */
      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null })
          return
        }
        set({ isLoading: true })
        try {
          const response = await authApi.getCurrentUser()
          set({ user: response.data.data.user, isAuthenticated: true, isLoading: false })
        } catch {
          // A 401 has already ended the session in the API client.
          set({ isLoading: false })
        }
      },

      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'travel-art-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
