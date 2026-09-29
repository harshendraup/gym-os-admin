import { api } from './client'

export interface AuthUser {
  id: string
  memberCode: string | null
  firstName: string
  lastName: string | null
  fullName: string | null
  email: string | null
  mobile: string | null
  alternateMobile: string | null
  emergencyContactName: string | null
  emergencyContactRelationship: string | null
  emergencyContactNumber: string | null
  photo: unknown | null
  businessId: number | null
  branchId: number | null
  roleId: number | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface AuthRole {
  id: number
  businessId: number | null
  branchId: number | null
  role: string
  roleName: string
  status: string
}

export interface AuthToken {
  type: string
  name: string | null
  token: string
  abilities: string[]
  expiresAt: string | null
}

export interface AuthResponse {
  user: AuthUser
  role: AuthRole | null
  token: AuthToken
}

export interface MeResponse {
  user: AuthUser
  role: AuthRole | null
}

export const authApi = {
  register: (data: { firstName: string; lastName?: string; email: string; password: string; mobile?: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () => api.get<MeResponse>('/auth/me'),

  logout: () => api.post('/auth/logout', {}),

  // Not backed by the API yet — kept for the OTP page stub.
  requestOtp: (phone: string) => api.post('/auth/otp/request', { phone }),
  verifyOtp: (data: { phone: string; otp: string }) => api.post<AuthResponse>('/auth/otp/verify', data),
}
