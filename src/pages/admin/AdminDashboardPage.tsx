import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, UserCog, Users, Dumbbell, Instagram, MessageCircle, ArrowUpRight, Megaphone } from 'lucide-react'
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
import { siteContact } from '@/data/siteContent'

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

  const instagramLink = siteContact.socials.find((social) => social.label === 'Instagram')?.href ?? '#'
  const whatsappLink = `${siteContact.whatsappHref}?text=${encodeURIComponent(`Hi, I would like to know more about ${business?.businessName ?? 'your gym'} membership.`)}`

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

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white shadow-sm">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">Marketing shortcuts</h3>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Ready to use</span>
                  </div>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Keep your gym visible between visits with a social post and a direct member follow-up.
                  </p>
                </div>
              </div>
              <span className="hidden text-right text-[11px] text-slate-400 sm:block">Two channels · one quick follow-up</span>
            </div>
            <div className="grid gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
              <a href={instagramLink} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-fuchsia-300 hover:bg-fuchsia-50/50">
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-600"><Instagram className="h-4 w-4" /></span>
                  <span><span className="block text-sm font-medium text-slate-800">Share on Instagram</span><span className="block text-xs text-slate-500">Showcase today’s training floor</span></span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fuchsia-600" />
              </a>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50">
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><MessageCircle className="h-4 w-4" /></span>
                  <span><span className="block text-sm font-medium text-slate-800">Follow up on WhatsApp</span><span className="block text-xs text-slate-500">Start a membership conversation</span></span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
