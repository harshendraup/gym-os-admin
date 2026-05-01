import { useQuery } from '@tanstack/react-query'
import { Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/api/client'

const difficultyVariant = (d: string) => {
  if (d === 'beginner') return 'success' as const
  if (d === 'intermediate') return 'warning' as const
  return 'destructive' as const
}

export default function WorkoutsPage() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')

  const { data, isLoading } = useQuery({
    queryKey: ['workouts', gymId],
    queryFn: () => api.get(`/gyms/${gymId}/workouts`),
    enabled: !!gymId,
  })

  const plans = (data as any)?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Workout Plans" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Workout Plans</h2>
          <p className="text-sm text-muted-foreground">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Dumbbell className="h-10 w-10 mb-3" />
            <p className="text-base font-medium">No workout plans yet</p>
            <p className="text-sm mt-1">Trainers can create workout plans from the mobile app</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge variant={difficultyVariant(plan.difficulty)} className="capitalize">{plan.difficulty}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">{plan.description ?? 'No description'}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{plan.goal?.replace(/_/g, ' ')}</span>
                    <span>{plan.duration_weeks ? `${plan.duration_weeks} weeks` : 'Ongoing'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
