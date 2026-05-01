import { api, getPaginated } from './client'

export interface PaymentTransaction {
  id: string
  orderId: string
  gymId: string
  gymMemberId: string
  amount: number
  currency: string
  status: 'success' | 'failed' | 'refunded'
  gateway: string
  gatewayTransactionId: string
  purpose: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  gymMemberId: string
  memberName: string
  amount: number
  status: 'draft' | 'issued' | 'paid' | 'void'
  issuedAt: string
  lineItems: Array<{ description: string; amount: number }>
}

export const paymentsApi = {
  listTransactions: (gymId: string, params?: { page?: number; limit?: number; memberId?: string }) =>
    getPaginated<PaymentTransaction>(`/gyms/${gymId}/payments/transactions`, params),

  listInvoices: (gymId: string, params?: { page?: number; limit?: number }) =>
    getPaginated<Invoice>(`/gyms/${gymId}/payments/invoices`, params),

  recordOffline: (gymId: string, data: { gymMemberId: string; membershipPlanId: string; amountPaid: number; paymentMethod: string; notes?: string }) =>
    api.post(`/gyms/${gymId}/payments/offline`, data),

  createOrder: (gymId: string, data: { gymMemberId: string; membershipPlanId: string }) =>
    api.post<{ orderId: string; razorpayOrderId: string; amount: number }>(`/gyms/${gymId}/payments/order`, data),
}
