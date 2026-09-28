import { getPaginated, get } from './client'
import type { ManagedUser } from './user-management.api'

export interface TrainerMemberFilters {
  page?: number
  perPage?: number
  search?: string
  status?: string
}

export const trainerMembersApi = {
  list: (filters: TrainerMemberFilters = {}) =>
    getPaginated<ManagedUser>('/trainer/members', filters as Record<string, unknown>),
  get: (memberId: string) => get<ManagedUser>(`/trainer/members/${memberId}`),
}