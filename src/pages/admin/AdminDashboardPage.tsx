import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, UserCog, Users, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { GrowthAreaChart } from '@/components/charts/GrowthAreaChart'
import { StatusDonutChart } from '@/components/charts/StatusDonutChart'
import { useRoles } from '@/hooks/useRoles'
import { useUsersByRole } from '@/hooks/useUsers'
import { useBranches } from '@/hooks/useBranches'
import { useAuthStore } from '@/store/auth.store'
import { businessRegistryApi } from '@/api/business-registry.api'
import { groupByMonth } from '@/lib/chart-utils'

export default function AdminDashboardPage() {
  const { subAdminRole, trainerRole, memberRole } = useRoles()
  const gymContext = useAuthStore((s) => s.gymContext)
  const { data: branches = [], isLoading: branchesLoading } = useBranches(gymContext?.businessId)
  const { data: subAdmins = [], isLoading: subAdminsLoading } = useUsersByRole(subAdminRole?.id)
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)
  const { data: members = [], isLoading: membersLoading } = useUsersByRole(memberRole?.id)

  const { data: business } = useQuery({
    queryKey: ['businesses', 'detail', gymContext?.businessId],
    queryFn: () => businessRegistryApi.get(Number(gymContext!.businessId)),
    enabled: !!gymContext?.businessId,
  })

  const stats = [
    { label: 'Branches', value: branches.length, isLoading: branchesLoading, icon: Building2 },
    { label: 'Sub-Admins', value: subAdmins.length, isLoading: subAdminsLoading, icon: UserCog },
    { label: 'Trainers', value: trainers.length, isLoading: false, icon: Dumbbell },
    { label: 'Members', value: members.length, isLoading: membersLoading, icon: Users },
  ]

  const roleData = [
    { name: 'Sub-Admins', value: subAdmins.length, color: '#A855F7' },
    { name: 'Trainers', value: trainers.length, color: '#F59E0B' },
    { name: 'Members', value: members.length, color: '#22C55E' },
  ]

  const growthData = useMemo(
    () => groupByMonth(members.map((m) => m.createdAt)),
    [members]
  )

  const statusData = useMemo(() => {
    const counts = { Active: 0, Inactive: 0, Frozen: 0 } as Record<string, number>
    for (const m of members) {
      counts[m.status] = (counts[m.status] ?? 0) + 1
    }
    return [
      { name: 'Active', value: counts.Active, color: '#22C55E' },
      { name: 'Inactive', value: counts.Inactive, color: '#94A3B8' },
      { name: 'Frozen', value: counts.Frozen, color: '#3B82F6' },
    ]
  }, [members])

  return (
    <div className="relative -m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden lg:-m-8 lg:h-[calc(100%+4rem)]">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/videos/gym-training.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-50/75" aria-hidden="true" />
      <div className="relative z-10 flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            {business?.businessLogo ? (
              <img
                src={business.businessLogo}
                alt={business.businessName}
                className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <p className="text-xs" style={{ color: '#64748B' }}>Business</p>
              <p className="text-lg font-bold text-slate-900">
                {business?.businessName ?? (gymContext?.businessId ? '—' : 'No business assigned')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#64748B' }}>{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{s.isLoading ? '—' : s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBarChart data={roleData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member Growth (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <GrowthAreaChart data={growthData} gradientId="adminGrowth" label="New Members" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDonutChart data={statusData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
