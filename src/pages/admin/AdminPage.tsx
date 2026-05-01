import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { api } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

function PlatformStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'platform'],
    queryFn: () => api.get('/admin/analytics/platform'),
  })

  const stats = (data as any) ?? {}

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[
        { label: 'Total Gyms', value: stats.totalGyms },
        { label: 'Active Gyms', value: stats.activeGyms },
        { label: 'Total Members', value: stats.totalMembers?.toLocaleString() },
        { label: 'MRR', value: formatCurrency(stats.mrr ?? 0) },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value ?? '—'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function GymsTable() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'gyms'],
    queryFn: () => api.get('/admin/gyms?limit=20'),
  })

  const verify = useMutation({
    mutationFn: (gymId: string) => api.put(`/admin/gyms/${gymId}/verify`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'gyms'] }); toast({ title: 'Gym verified' }) },
  })

  const updateStatus = useMutation({
    mutationFn: ({ gymId, status }: { gymId: string; status: string }) =>
      api.put(`/admin/gyms/${gymId}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'gyms'] }); toast({ title: 'Status updated' }) },
  })

  const gyms = (data as any)?.data ?? []

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Gyms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {gyms.map((gym: any) => (
            <div key={gym.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{gym.name}</p>
                <p className="text-xs text-muted-foreground">{gym.city}, {gym.state} · {gym.gym_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={gym.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                  {gym.status}
                </Badge>
                {!gym.is_verified && (
                  <Button size="sm" variant="outline" onClick={() => verify.mutate(gym.id)}>Verify</Button>
                )}
                {gym.status === 'active' ? (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ gymId: gym.id, status: 'suspended' })}>
                    Suspend
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ gymId: gym.id, status: 'active' })}>
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Super Admin" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <PlatformStats />
        <GymsTable />
      </div>
    </div>
  )
}
