import { api } from './client'

export interface MembershipPlan {
  id: string
  name: string
  durationMonths: number
  price: number
  category: 'basic' | 'standard' | 'premium'
  includesPt: boolean
  ptSessionsIncluded: number
  freezeDaysAllowed: number
  offerPrice: number | null
  offerEndsAt: string | null
  isActive: boolean
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
  listPlans: (gymId: string) =>
    api.get<MembershipPlan[]>(`/gyms/${gymId}/memberships/plans`),

  createPlan: (gymId: string, data: Partial<MembershipPlan>) =>
    api.post<MembershipPlan>(`/gyms/${gymId}/memberships/plans`, data),

  updatePlan: (gymId: string, planId: string, data: Partial<MembershipPlan>) =>
    api.put<MembershipPlan>(`/gyms/${gymId}/memberships/plans/${planId}`, data),

  deletePlan: (gymId: string, planId: string) =>
    api.del(`/gyms/${gymId}/memberships/plans/${planId}`),

  subscribe: (gymId: string, data: SubscribePayload) =>
    api.post<MemberSubscription>(`/gyms/${gymId}/memberships/subscribe`, data),

  freeze: (gymId: string, subscriptionId: string, data: { days: number; reason?: string }) =>
    api.post(`/gyms/${gymId}/memberships/${subscriptionId}/freeze`, data),

  unfreeze: (gymId: string, subscriptionId: string) =>
    api.post(`/gyms/${gymId}/memberships/${subscriptionId}/unfreeze`, {}),

  cancel: (gymId: string, subscriptionId: string, data: { reason?: string }) =>
    api.post(`/gyms/${gymId}/memberships/${subscriptionId}/cancel`, data),

  expiring: (gymId: string, days: number = 7) =>
    api.get(`/gyms/${gymId}/memberships/expiring?days=${days}`),

  memberHistory: (gymId: string, memberId: string) =>
    api.get<MemberSubscription[]>(`/gyms/${gymId}/members/${memberId}/subscriptions`),
}
