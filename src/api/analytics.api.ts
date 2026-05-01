import { get } from './client'

export interface DashboardSummary {
  members: {
    active: number
    expired: number
    frozen: number
    total: number
  }
  revenue: {
    totalPaise: number
    totalRupees: number
    transactionCount: number
  }
  attendanceToday: number
  expiringThisWeek: number
  newMembersThisMonth: number
}

export interface RevenueChartPoint {
  month: string
  revenue: number
  count: number
}

export interface MemberGrowthPoint {
  month: string
  newMembers: number
}

export interface AttendanceHeatmapPoint {
  checkInDate: string
  count: number
}

export const analyticsApi = {
  dashboard: (gymId: string) =>
    get<DashboardSummary>(`/gyms/${gymId}/analytics/dashboard`),

  revenueChart: (gymId: string, months?: number) =>
    get<RevenueChartPoint[]>(`/gyms/${gymId}/analytics/revenue`, { months }),

  memberGrowth: (gymId: string, months?: number) =>
    get<MemberGrowthPoint[]>(`/gyms/${gymId}/analytics/members`, { months }),

  attendanceHeatmap: (gymId: string, year: number, month: number) =>
    get<AttendanceHeatmapPoint[]>(`/gyms/${gymId}/analytics/attendance`, { year, month }),
}
