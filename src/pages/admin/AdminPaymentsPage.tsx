import { usePayments } from '@/hooks/usePayments'
import { Card, CardContent } from '@/components/ui/card'
import type { PaymentRecord } from '@/api/payments.api'

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 1001,
    businessId: 1,
    branchId: 1,
    userId: 21,
    membershipId: 1,
    collectedBy: null,
    purpose: 'membership_renewal',
    invoiceNumber: 'INV-1001',
    amount: '4500',
    taxAmount: '0',
    discountAmount: '0',
    totalAmount: '4500',
    currency: 'INR',
    paymentMethod: 'upi',
    gatewayOrderId: null,
    gatewayPaymentId: null,
    status: 'success',
    failureReason: null,
    refundStatus: 'none',
    refundedAmount: '0',
    refundedAt: null,
    paidOn: '2026-09-10T09:30:00.000Z',
    notes: 'Demo payment',
    createdAt: '2026-09-10T09:30:00.000Z',
    updatedAt: '2026-09-10T09:30:00.000Z',
  },
  {
    id: 1002,
    businessId: 1,
    branchId: 1,
    userId: 20,
    membershipId: 2,
    collectedBy: null,
    purpose: 'membership_new',
    invoiceNumber: 'INV-1002',
    amount: '3000',
    taxAmount: '0',
    discountAmount: '0',
    totalAmount: '3000',
    currency: 'INR',
    paymentMethod: 'cash',
    gatewayOrderId: null,
    gatewayPaymentId: null,
    status: 'success',
    failureReason: null,
    refundStatus: 'none',
    refundedAmount: '0',
    refundedAt: null,
    paidOn: '2026-09-09T14:15:00.000Z',
    notes: 'Demo payment',
    createdAt: '2026-09-09T14:15:00.000Z',
    updatedAt: '2026-09-09T14:15:00.000Z',
  },
]

export default function AdminPaymentsPage() {
  const { data: payments = [], isLoading, isError, refetch } = usePayments()
  const showingMockPayments = isError || payments.length === 0
  const displayedPayments = showingMockPayments ? MOCK_PAYMENTS : payments

  return (
    <div className="relative -m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden lg:-m-8 lg:h-[calc(100%+4rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(248,250,252,0.78), rgba(248,250,252,0.86)), url('/images/payments-background.jpg'), url('/images/hero-kitchen-scan.webp')" }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 overflow-auto p-6">
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
            <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
              Every payment collected across your business's branches.
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="p-6 text-sm text-slate-500">Loading payments…</p>
              ) : (
                <>
                  {showingMockPayments && (
                    <div className="flex items-center justify-between gap-4 border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      <span>Showing sample payments until live payment data is available.</span>
                      <button className="shrink-0 font-semibold underline" onClick={() => refetch()}>Retry</button>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-slate-500">
                        <th className="p-3">Date</th>
                        <th className="p-3">Member</th>
                        <th className="p-3">Purpose</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPayments.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="p-3">#{p.userId}</td>
                          <td className="p-3 capitalize">{p.purpose.replace('_', ' ')}</td>
                          <td className="p-3 capitalize">{p.paymentMethod}</td>
                          <td className="p-3">{p.currency} {p.totalAmount}</td>
                          <td className="p-3 capitalize">{p.status.replace('_', ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
