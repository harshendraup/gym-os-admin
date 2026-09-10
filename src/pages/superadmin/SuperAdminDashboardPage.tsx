import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, ShieldCheck, UserCog, Users, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { GrowthAreaChart } from '@/components/charts/GrowthAreaChart'
import { StatusDonutChart } from '@/components/charts/StatusDonutChart'
import { businessRegistryApi } from '@/api/business-registry.api'
import { useRoles } from '@/hooks/useRoles'
import { useUsersByRole } from '@/hooks/useUsers'
import { groupByMonth } from '@/lib/chart-utils'
import { getRandomPageBackground } from '@/data/pageBackgrounds'

export default function SuperAdminDashboardPage() {
  const [backgroundImage] = useState(getRandomPageBackground)
  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => businessRegistryApi.list(),
  })
  const { adminRole, subAdminRole, trainerRole, memberRole } = useRoles()
  const { data: admins = [], isLoading: adminsLoading } = useUsersByRole(adminRole?.id)
  const { data: subAdmins = [], isLoading: subAdminsLoading } = useUsersByRole(subAdminRole?.id)
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)
  const { data: members = [], isLoading: membersLoading } = useUsersByRole(memberRole?.id)

  const stats = [
    { label: 'Businesses', value: businesses.length, isLoading: businessesLoading, icon: Building2 },
    { label: 'Admins', value: admins.length, isLoading: adminsLoading, icon: ShieldCheck },
    { label: 'Sub-Admins', value: subAdmins.length, isLoading: subAdminsLoading, icon: UserCog },
    { label: 'Trainers', value: trainers.length, isLoading: false, icon: Dumbbell },
    { label: 'Members', value: members.length, isLoading: membersLoading, icon: Users },
  ]

  const roleData = [
    { name: 'Admins', value: admins.length, color: '#3B82F6' },
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
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(248,250,252,0.78), rgba(248,250,252,0.86)), url('${backgroundImage}')` }}
        aria-hidden="true"
      />
      {/* <Header title="Dashboard" /> */}
      <div className="relative z-10 flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <CardTitle className="text-base">Platform Roles</CardTitle>
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
              <GrowthAreaChart data={growthData} gradientId="superadminGrowth" label="New Members" />
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
