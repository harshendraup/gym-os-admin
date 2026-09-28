import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { attendanceLogsApi, type AttendanceLogRecord } from '@/api/attendance-logs.api'
import { useTrainerMembers } from '@/hooks/useTrainerMembers'

export default function TrainerAttendancePage() {
  const members = useTrainerMembers({ page: 1, perPage: 100 })
  const logs = useQuery({ queryKey: ['trainer-attendance'], queryFn: attendanceLogsApi.list, staleTime: 30_000 })
  const memberName = (id: number) => members.data?.data.find((member) => String(member.id) === String(id))?.fullName ?? `#${id}`
  const columns: ColumnDef<AttendanceLogRecord>[] = [
    { header: 'Member', cell: ({ row }) => <span className="font-medium">{memberName(row.original.memberId)}</span> },
    { header: 'Date', cell: ({ row }) => new Date(row.original.checkInAt).toLocaleDateString('en-IN') },
    { header: 'Time', cell: ({ row }) => new Date(row.original.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { header: 'Method', cell: ({ row }) => <Badge variant="secondary">{row.original.method}</Badge> },
  ]

  return <EntityListPage title="Attendance" description="Attendance records for your assigned members." columns={columns} data={logs.data} isLoading={logs.isLoading || members.isLoading} isError={logs.isError || members.isError} onRetry={() => { void logs.refetch(); void members.refetch() }} emptyMessage="No attendance records for your members." />
}