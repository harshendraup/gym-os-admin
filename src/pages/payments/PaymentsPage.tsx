import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import { paymentsApi } from '@/api/payments.api'
import { formatCurrency } from '@/lib/utils'

export default function PaymentsPage() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')

  const { data: txData, isLoading } = useQuery({
    queryKey: ['payments', 'transactions', gymId],
    queryFn: () => paymentsApi.listTransactions(gymId, { limit: 50 }),
    enabled: !!gymId,
  })

  const transactions = (txData as any)?.data ?? []

  const statusVariant = (status: string) => {
    if (status === 'success') return 'success' as const
    if (status === 'failed') return 'destructive' as const
    return 'secondary' as const
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Payments" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-sm text-muted-foreground">Recent payment history</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-0 divide-y">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-40 rounded bg-muted" />
                      <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                    <div className="h-5 w-20 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="divide-y">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm">{tx.member_name ?? 'Member'}</p>
                      <p className="text-xs text-muted-foreground">{tx.purpose} · {new Date(tx.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCurrency(tx.amount / 100)}</span>
                      <Badge variant={statusVariant(tx.status)} className="capitalize">{tx.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
