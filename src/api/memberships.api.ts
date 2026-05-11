import { api } from './client'

function requireBusinessId(businessId: string) {
  const normalized = (businessId ?? '').trim()
  if (!normalized) {
    throw new Error('Business context is required. Please include businessId.')
  }
  return normalized
}

export interface MembershipPlan {
  id: string
  name: string
  description: string | null
  durationDays: number
  price: number
  currency: string
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  enrollmentFee: number
  trialDays: number
  taxEnabled: boolean
  taxRate: number | null
  taxInclusive: boolean
  visibility: 'public' | 'private'
  discountPrice: number | null
  planType: 'standard' | 'premium' | 'student' | 'couple' | 'corporate'
  includesPt: boolean
  ptSessionsCount: number
  includesDiet: boolean
  includesLocker: boolean
  includesSupplements: boolean
  inclusions: string[]
  maxFreezeDays: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface MemberSubscription {
  id: string
  gymMemberId: string
  membershipPlanId: string
  status: 'pending_payment' | 'active' | 'grace_period' | 'expired' | 'cancelled' | 'frozen'
  startDate: string
  expiresAt: string
  freezeExpiresAt: string | null
  amountPaid: number
  paymentMethod: string
  createdAt: string
}

export interface SubscribePayload {
  gymMemberId: string
  membershipPlanId: string
  paymentMethod: 'cash' | 'upi' | 'card' | 'razorpay'
  amountPaid: number
  branchId?: string
}

export const membershipsApi = {
  listPlans: (businessId: string) =>
    api.get<MembershipPlan[]>(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/plans`),

  showPlan: (businessId: string, planId: string) =>
    api.get<MembershipPlan>(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/plans/${planId}`),

  createPlan: (businessId: string, data: Partial<MembershipPlan>) =>
    api.post<MembershipPlan>(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/plans`, data),

  updatePlan: (businessId: string, planId: string, data: Partial<MembershipPlan>) =>
    api.put<MembershipPlan>(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/plans/${planId}`, data),

  deletePlan: (businessId: string, planId: string) =>
    api.del(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/plans/${planId}`),

  subscribe: (businessId: string, data: SubscribePayload) =>
    api.post<MemberSubscription>(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/subscribe`, data),

  freeze: (businessId: string, subscriptionId: string, data: { days: number; reason?: string }) =>
    api.post(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/${subscriptionId}/freeze`, data),

  unfreeze: (businessId: string, subscriptionId: string) =>
    api.post(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/${subscriptionId}/unfreeze`, {}),

  cancel: (businessId: string, subscriptionId: string, data: { reason?: string }) =>
    api.post(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/${subscriptionId}/cancel`, data),

  expiring: (businessId: string, days: number = 7) =>
    api.get(`/business-admin/businesses/${requireBusinessId(businessId)}/memberships/expiring?days=${days}`),

  memberHistory: (businessId: string, memberId: string) =>
    api.get<MemberSubscription[]>(`/business-admin/businesses/${requireBusinessId(businessId)}/members/${memberId}/subscriptions`),
}
