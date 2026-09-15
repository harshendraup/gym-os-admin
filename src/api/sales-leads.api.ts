import { del, get, post, put } from './client'

export type SalesLeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Visit Booked' | 'Won' | 'Lost'
export type SalesLeadSource = 'Instagram' | 'WhatsApp' | 'Website' | 'Referral' | 'Walk-in' | 'Other'

export interface SalesLeadRecord {
  id: number
  businessId: number
  branchId: number | null
  assignedTo: number | null
  name: string
  phone: string
  email: string | null
  source: SalesLeadSource
  status: SalesLeadStatus
  interest: string | null
  goal: string | null
  nextFollowUpAt: string | null
  lostReason: string | null
  convertedMemberId: number | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface SalesLeadPayload {
  branchId?: number
  assignedTo?: number
  name: string
  phone: string
  email?: string
  source?: SalesLeadSource
  status?: SalesLeadStatus
  interest?: string
  goal?: string
  nextFollowUpAt?: string
  lostReason?: string
  convertedMemberId?: number
  notes?: string
}

export const salesLeadsApi = {
  list: () => get<SalesLeadRecord[]>('/sales-leads'),
  get: (id: number) => get<SalesLeadRecord>(`/sales-leads/${id}`),
  create: (data: SalesLeadPayload) => post<SalesLeadRecord>('/sales-leads', data),
  update: (id: number, data: Partial<SalesLeadPayload>) => put<SalesLeadRecord>(`/sales-leads/${id}`, data),
  delete: (id: number) => del<void>(`/sales-leads/${id}`),
}
