import { get, patch } from './client'
import type { AuthRole, AuthUser } from './auth.api'

export interface TrainerProfileResponse {
  user: AuthUser
  role: AuthRole | null
}

export const trainerAuthApi = {
  me: () => get<TrainerProfileResponse>('/trainer-auth/me'),
  updateMe: (data: Record<string, unknown>) =>
    patch<TrainerProfileResponse>('/trainer-auth/me', data),
}