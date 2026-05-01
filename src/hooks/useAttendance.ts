import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/api/attendance.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from './use-toast'

const keys = {
  today: (gymId: string, branchId?: string) => ['attendance', 'today', gymId, branchId] as const,
  report: (gymId: string, year: number, month: number) => ['attendance', 'report', gymId, year, month] as const,
  qr: (gymId: string, branchId: string) => ['attendance', 'qr', gymId, branchId] as const,
}

export function useTodayAttendance(branchId?: string) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  return useQuery({
    queryKey: keys.today(gymId, branchId),
    queryFn: () => attendanceApi.today(gymId, branchId),
    enabled: !!gymId,
    refetchInterval: 60_000,
  })
}

export function useMonthlyReport(year: number, month: number) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  return useQuery({
    queryKey: keys.report(gymId, year, month),
    queryFn: () => attendanceApi.monthlyReport(gymId, year, month),
    enabled: !!gymId,
  })
}

export function useBranchQr(branchId: string) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  return useQuery({
    queryKey: keys.qr(gymId, branchId),
    queryFn: () => attendanceApi.getBranchQr(gymId, branchId),
    enabled: !!gymId && !!branchId,
    staleTime: Infinity,
  })
}

export function useManualCheckIn() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: { gymMemberId: string; branchId: string; notes?: string }) =>
      attendanceApi.manualCheckIn(gymId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', 'today', gymId] })
      toast({ title: 'Check-in recorded' })
    },
    onError: () => toast({ title: 'Check-in failed', variant: 'destructive' }),
  })
}
