import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  profilePhotoUrl: string | null
}

interface GymContext {
  gymId: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  gymContext: GymContext | null
  isAuthenticated: boolean

  setAuth: (user: User, accessToken: string, refreshToken: string, gymContext: GymContext | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setGymContext: (context: GymContext) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      gymContext: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken, gymContext) =>
        set({ user, accessToken, refreshToken, gymContext, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setGymContext: (gymContext) =>
        set({ gymContext }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          gymContext: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'gymos-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        gymContext: state.gymContext,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Convenience selectors
export const selectGymId = (state: AuthState) => state.gymContext?.gymId
export const selectRole = (state: AuthState) => state.gymContext?.role
export const selectIsOwner = (state: AuthState) => state.gymContext?.role === 'gym_owner'
export const selectIsStaff = (state: AuthState) =>
  ['gym_owner', 'staff'].includes(state.gymContext?.role ?? '')
export const selectIsSuperAdmin = (state: AuthState) => state.gymContext?.role === 'super_admin'
