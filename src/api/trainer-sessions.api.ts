import { get, post, patch } from './client'

export type TrainerSessionStatus = 'scheduled' | 'completed' | 'cancelled'

export interface TrainerSessionRecord {
  id: number
  businessId: number
  branchId: number
  trainerId: number
  memberId: number
  startsAt: string
  endsAt: string
  sessionType: string
  status: TrainerSessionStatus
  notes: string | null
}

export const trainerSessionsApi = {
  list: () => get<TrainerSessionRecord[]>('/trainer/sessions'),
  create: (data: { memberId: number; startsAt: string; endsAt: string; sessionType?: string; notes?: string }) => post<TrainerSessionRecord>('/trainer/sessions', data),
  update: (id: number, data: Partial<Pick<TrainerSessionRecord, 'startsAt' | 'endsAt' | 'sessionType' | 'status' | 'notes'>>) => patch<TrainerSessionRecord>(`/trainer/sessions/${id}`, data),
}