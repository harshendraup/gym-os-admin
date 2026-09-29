import { get, post, put, del } from './client'

/**
 * The real `/users` resource (gym-os-api). Every person in the system —
 * admin, sub-admin, member — is a row here, differentiated by `roleId` and
 * scoped by `businessId`. The backend enforces who may create/see/edit whom;
 * this client just calls it.
 */
export interface ManagedUser {
  id: string
  memberCode: string | null
  firstName: string
  lastName: string | null
  fullName: string | null
  email: string | null
  mobile: string | null
  alternateMobile: string | null
  age: number | null
  gender: string | null
  dateOfBirth: string | null
  photo: string | null
  businessId: number | null
  branchId: number | null
  roleId: number | null
  trainerId: number | null
  membershipId: number | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  pincode: string | null
  emergencyContactName: string | null
  emergencyContactRelationship: string | null
  emergencyContactNumber: string | null
  bloodGroup: string | null
  joiningDate: string | null
  status: string
  metaUser: { trainerNotes?: string } & Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface ManagedUserPayload {
  firstName: string
  lastName?: string
  email?: string
  password?: string
  mobile?: string
  alternateMobile?: string
  gender?: string
  dateOfBirth?: string
  age?: number
  businessId?: number
  branchId?: number
  roleId?: number
  trainerId?: number
  membershipId?: number
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  emergencyContactName?: string
  emergencyContactRelationship?: string
  emergencyContactNumber?: string
  bloodGroup?: string
  joiningDate?: string
  status?: string
  metaUser?: Record<string, unknown>
}

export const userManagementApi = {
  list: () => get<ManagedUser[]>('/users'),

  create: (data: ManagedUserPayload) => post<ManagedUser>('/users', data),

  update: (id: string, data: Partial<ManagedUserPayload>) =>
    put<ManagedUser>(`/users/${id}`, data),

  delete: (id: string) => del<void>(`/users/${id}`),
}
