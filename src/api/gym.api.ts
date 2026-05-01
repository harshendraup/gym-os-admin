import { api } from './client'

export interface GymProfile {
  id: string
  name: string
  slug: string
  gymCode: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  website?: string
  description?: string
  status: 'active' | 'inactive' | 'suspended'
  branding: {
    logoUrl?: string
    bannerUrl?: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  facilities: string[]
  timings: Record<string, { open: string; close: string }>
}

export interface GymBranch {
  id: string
  gymId: string
  name: string
  code: string
  address: string
  city: string
  state: string
  phone?: string
  isMain: boolean
  isActive: boolean
}

export const gymApi = {
  getProfile: (gymId: string) =>
    api.get<GymProfile>(`/gyms/${gymId}`),

  updateProfile: (gymId: string, data: Partial<GymProfile>) =>
    api.put<GymProfile>(`/gyms/${gymId}`, data),

  listBranches: (gymId: string) =>
    api.get<GymBranch[]>(`/gyms/${gymId}/branches`),

  createBranch: (gymId: string, data: Partial<GymBranch>) =>
    api.post<GymBranch>(`/gyms/${gymId}/branches`, data),

  updateBranch: (gymId: string, branchId: string, data: Partial<GymBranch>) =>
    api.put<GymBranch>(`/gyms/${gymId}/branches/${branchId}`, data),

  deleteBranch: (gymId: string, branchId: string) =>
    api.del(`/gyms/${gymId}/branches/${branchId}`),
}
