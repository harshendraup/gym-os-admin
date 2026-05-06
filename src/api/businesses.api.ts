import { get, post, put, del, getPaginated } from './client'
import type { Member } from './members.api'

export type BusinessType = 'independent' | 'chain' | 'franchise'
export type BusinessStatus = 'pending' | 'active' | 'suspended'

export interface Business {
  id: string
  name: string
  slug: string
  businessKey?: string | null
  legalName?: string | null
  registrationNumber?: string | null
  type: BusinessType
  email: string
  phone: string
  website?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  pincode: string
  country: string
  logoUrl?: string | null
  status: BusinessStatus
  createdAt: string
  updatedAt: string
}

export interface BusinessFilters {
  status?: string
  type?: string
  search?: string
  page?: number
  perPage?: number
}

export interface BusinessPayload {
  name: string
  businessKey: string
  legalName?: string
  registrationNumber?: string
  type: BusinessType
  email: string
  phone: string
  website?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  country: string
  logoUrl?: string
}

export const businessesApi = {
  list: (filters: BusinessFilters = {}) =>
    getPaginated<Business>('/admin/businesses', filters as Record<string, unknown>),

  get: (id: string) =>
    get<Business>(`/admin/businesses/${id}`),

  create: (data: BusinessPayload) =>
    post<Business>('/admin/businesses', data),

  update: (id: string, data: Partial<BusinessPayload>) =>
    put<Business>(`/admin/businesses/${id}`, data),

  updateStatus: (id: string, status: BusinessStatus) =>
    put<Business>(`/admin/businesses/${id}/status`, { status }),

  delete: (id: string) =>
    del<{ message: string }>(`/admin/businesses/${id}`),

  members: (id: string, filters: { search?: string; status?: string; page?: number } = {}) =>
    getPaginated<Member>(`/admin/businesses/${id}/members`, filters as Record<string, unknown>),
}
