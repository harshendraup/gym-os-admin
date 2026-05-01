import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GymBranding {
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

interface GymStore {
  gymId: string | null
  branding: GymBranding | null
  features: Record<string, boolean>

  setGym: (gymId: string, branding: GymBranding, features?: Record<string, boolean>) => void
  clearGym: () => void
  hasFeature: (feature: string) => boolean
}

export const useGymStore = create<GymStore>()(
  persist(
    (set, get) => ({
      gymId: null,
      branding: null,
      features: {},

      setGym: (gymId, branding, features = {}) =>
        set({ gymId, branding, features }),

      clearGym: () =>
        set({ gymId: null, branding: null, features: {} }),

      hasFeature: (feature: string) =>
        get().features[feature] ?? false,
    }),
    { name: 'gymos-gym' }
  )
)
