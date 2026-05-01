import { useQuery } from '@tanstack/react-query'
import { Salad } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/api/client'

export default function DietPlansPage() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')

  const { data, isLoading } = useQuery({
    queryKey: ['diet-plans', gymId],
    queryFn: () => api.get(`/gyms/${gymId}/diet`),
    enabled: !!gymId,
  })

  const plans = (data as any)?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Diet Plans" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Diet Plans</h2>
          <p className="text-sm text-muted-foreground">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Salad className="h-10 w-10 mb-3" />
            <p className="text-base font-medium">No diet plans yet</p>
            <p className="text-sm mt-1">Trainers can create diet plans from the mobile app</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge variant="info" className="capitalize">{plan.goal?.replace(/_/g, ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">{plan.description ?? 'No description'}</p>
                  {plan.daily_calories && (
                    <p className="text-xs font-medium">{plan.daily_calories} kcal/day</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
