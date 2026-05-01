import { api } from './client'

export interface AuthUser {
  id: string
  fullName: string
  phone: string
  email?: string
  avatarUrl?: string
}

export interface GymContext {
  gymId: string
  role: string
  gymName: string
  branchId?: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
  gymContext: GymContext | null
}

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  requestOtp: (phone: string) =>
    api.post('/auth/otp/request', { phone }),

  verifyOtp: (data: { phone: string; otp: string }) =>
    api.post<AuthResponse>('/auth/otp/verify', data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  me: () => api.get<AuthUser>('/auth/me'),

  logout: () => api.post('/auth/logout', {}),
}
