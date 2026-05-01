import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analytics.api'
import { useAuthStore } from '@/store/auth.store'

const analyticsKeys = {
  dashboard: (gymId: string) => ['analytics', 'dashboard', gymId] as const,
  revenue: (gymId: string, months: number) => ['analytics', 'revenue', gymId, months] as const,
  growth: (gymId: string, months: number) => ['analytics', 'growth', gymId, months] as const,
  heatmap: (gymId: string, year: number, month: number) =>
    ['analytics', 'heatmap', gymId, year, month] as const,
}

export function useDashboardSummary() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!
  return useQuery({
    queryKey: analyticsKeys.dashboard(gymId),
    queryFn: () => analyticsApi.dashboard(gymId),
    enabled: !!gymId,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}

export function useRevenueChart(months = 12) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!
  return useQuery({
    queryKey: analyticsKeys.revenue(gymId, months),
    queryFn: () => analyticsApi.revenueChart(gymId, months),
    enabled: !!gymId,
    staleTime: 5 * 60_000,
  })
}

export function useMemberGrowth(months = 12) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!
  return useQuery({
    queryKey: analyticsKeys.growth(gymId, months),
    queryFn: () => analyticsApi.memberGrowth(gymId, months),
    enabled: !!gymId,
    staleTime: 5 * 60_000,
  })
}

export function useAttendanceHeatmap(year: number, month: number) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!
  return useQuery({
    queryKey: analyticsKeys.heatmap(gymId, year, month),
    queryFn: () => analyticsApi.attendanceHeatmap(gymId, year, month),
    enabled: !!gymId,
  })
}
