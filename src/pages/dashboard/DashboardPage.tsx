import { useDashboardSummary, useRevenueChart, useMemberGrowth } from '@/hooks/useAnalytics'
import { StatCard } from '@/components/charts/StatCard'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { MemberGrowthChart } from '@/components/charts/MemberGrowthChart'
import { ExpiringMembersList } from '@/components/members/ExpiringMembersList'
import { Users, TrendingUp, IndianRupee, UserCheck, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary()
  const { data: revenue } = useRevenueChart(6)
  const { data: growth } = useMemberGrowth(6)

  if (isLoading) return <DashboardSkeleton />

  const expiringCount = summary?.expiringThisWeek ?? 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
          Real-time overview of your gym's performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="animate-fade-in-up stagger-1">
          <StatCard
            title="Active Members"
            value={summary?.members.active ?? 0}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatCard
            title="Today's Check-ins"
            value={summary?.attendanceToday ?? 0}
            icon={<UserCheck className="h-5 w-5" />}
            color="green"
          />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatCard
            title="Revenue (Month)"
            value={`₹${(summary?.revenue.totalRupees ?? 0).toLocaleString('en-IN')}`}
            icon={<IndianRupee className="h-5 w-5" />}
            color="purple"
          />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <StatCard
            title="New Members"
            value={summary?.newMembersThisMonth ?? 0}
            icon={<TrendingUp className="h-5 w-5" />}
            color="amber"
          />
        </div>
        <div className="animate-fade-in-up stagger-5">
          <StatCard
            title="Expiring This Week"
            value={expiringCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            color={expiringCount > 0 ? 'red' : 'gray'}
            alert={expiringCount > 0}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-3"
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Revenue</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Last 6 months</p>
          </div>
          <RevenueChart data={revenue ?? []} />
        </div>

        <div
          className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-4"
        >
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Member Growth</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Last 6 months</p>
          </div>
          <MemberGrowthChart data={growth ?? []} />
        </div>
      </div>

      {/* Expiring Members */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Expiring Soon</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Memberships expiring within 7 days</p>
          </div>
          {expiringCount > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
            >
              {expiringCount} members
            </span>
          )}
        </div>
        <ExpiringMembersList />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="skeleton h-8 w-44 rounded-xl" />
        <div className="skeleton h-4 w-64 rounded-lg mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  )
}
