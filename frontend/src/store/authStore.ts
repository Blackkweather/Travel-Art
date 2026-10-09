import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
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

/**
 * One session per tab.
 *
 * The session used to live in localStorage alone, which every tab of the
 * browser shares: sign in as the hotel in one tab and as an artist in
 * another, and the first tab silently became the artist on its next refresh
 * - two people's accounts taking turns in the same window.
 *
 * Each tab now keeps its own copy in sessionStorage and reads it first. The
 * latest sign-in is also written to localStorage, so a tab opened afterwards
 * (a link opened in a new tab, the site typed again) starts signed in as it.
 */
const tabStorage: StateStorage = {
  getItem: (name) => {
    try {
      return sessionStorage.getItem(name) ?? localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      sessionStorage.setItem(name, value)
      localStorage.setItem(name, value)
    } catch {
      // Storage refused (private mode, quota): the session lasts for the page.
    }
  },
  removeItem: (name) => {
    try {
      sessionStorage.removeItem(name)
      localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
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
      storage: createJSONStorage(() => tabStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
