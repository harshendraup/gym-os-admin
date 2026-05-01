import { get, post, put, del, getPaginated } from './client'

export interface Member {
  id: string
  memberCode: string
  status: 'active' | 'expired' | 'frozen' | 'pending' | 'cancelled'
  joinedAt: string
  user: {
    id: string
    fullName: string
    phone: string | null
    email: string | null
    profilePhotoUrl: string | null
    gender: string | null
    dateOfBirth: string | null
  }
  activeSubscription?: {
    id: string
    status: string
    startsAt: string
    expiresAt: string
    daysRemaining: number
    membershipPlan: { name: string; durationDays: number }
  }
  assignedTrainer?: { id: string; user: { fullName: string } }
  branch?: { id: string; name: string }
}

export interface MemberFilters {
  status?: string
  branchId?: string
  trainerId?: string
  search?: string
  page?: number
  perPage?: number
}

export const membersApi = {
  list: (gymId: string, filters: MemberFilters = {}) =>
    getPaginated<Member>(`/gyms/${gymId}/members`, filters as Record<string, unknown>),

  get: (gymId: string, id: string) => get<Member>(`/gyms/${gymId}/members/${id}`),

  create: (gymId: string, data: Record<string, unknown>) =>
    post<Member>(`/gyms/${gymId}/members`, data),

  update: (gymId: string, id: string, data: Record<string, unknown>) =>
    put<Member>(`/gyms/${gymId}/members/${id}`, data),

  delete: (gymId: string, id: string) =>
    del<{ message: string }>(`/gyms/${gymId}/members/${id}`),

  stats: (gymId: string, id: string) =>
    get<MemberStats>(`/gyms/${gymId}/members/${id}/stats`),

  attendance: (gymId: string, id: string, params?: { month?: number; year?: number }) =>
    get<AttendanceEntry[]>(`/gyms/${gymId}/members/${id}/attendance`, params as Record<string, unknown>),
}

export interface MemberStats {
  totalAttendance: number
  attendanceThisMonth: number
  streakDays: number
  workoutsCompleted: number
  ptSessionsUsed: number
  ptSessionsRemaining: number
}

export interface AttendanceEntry {
  id: string
  checkInDate: string
  checkedInAt: string
  checkInMode: string
}
