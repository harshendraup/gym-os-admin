import { api } from './client'

export interface AttendanceRecord {
  id: string
  gymMemberId: string
  memberName: string
  branchId: string
  checkInDate: string
  checkInTime: string
  checkInMethod: 'qr' | 'manual'
  notes?: string
}

export interface AttendanceHeatmapPoint {
  date: string
  count: number
}

export const attendanceApi = {
  today: (gymId: string, branchId?: string) =>
    api.get<AttendanceRecord[]>(`/gyms/${gymId}/attendance/today${branchId ? `?branchId=${branchId}` : ''}`),

  monthlyReport: (gymId: string, year: number, month: number) =>
    api.get(`/gyms/${gymId}/attendance/report?year=${year}&month=${month}`),

  memberHistory: (gymId: string, memberId: string, params?: { year?: number; month?: number }) =>
    api.get<AttendanceRecord[]>(`/gyms/${gymId}/members/${memberId}/attendance`, { params }),

  manualCheckIn: (gymId: string, data: { gymMemberId: string; branchId: string; notes?: string }) =>
    api.post<AttendanceRecord>(`/gyms/${gymId}/attendance/manual`, data),

  getBranchQr: (gymId: string, branchId: string) =>
    api.get<{ token: string; qrImageUrl: string }>(`/gyms/${gymId}/attendance/qr?branchId=${branchId}`),
}
