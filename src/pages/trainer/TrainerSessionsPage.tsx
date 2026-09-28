import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { useTrainerMembers } from '@/hooks/useTrainerMembers'
import { useTrainerSessions, useUpdateTrainerSession } from '@/hooks/useTrainerSessions'
import type { TrainerSessionRecord, TrainerSessionStatus } from '@/api/trainer-sessions.api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statuses: TrainerSessionStatus[] = ['scheduled', 'completed', 'cancelled']

export default function TrainerSessionsPage() {
  const members = useTrainerMembers({ page: 1, perPage: 100 })
  const sessions = useTrainerSessions()
  const update = useUpdateTrainerSession()
  const memberName = (id: number) => members.data?.data.find((member) => String(member.id) === String(id))?.fullName ?? `#${id}`
  const columns: ColumnDef<TrainerSessionRecord>[] = [
    { header: 'Time', cell: ({ row }) => <div><div className="font-medium">{new Date(row.original.startsAt).toLocaleDateString('en-IN')}</div><div className="text-xs text-muted-foreground">{new Date(row.original.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(row.original.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div> },
    { header: 'Member', cell: ({ row }) => memberName(row.original.memberId) },
    { header: 'Type', cell: ({ row }) => row.original.sessionType },
    { header: 'Status', cell: ({ row }) => <Select value={row.original.status} onValueChange={(status) => update.mutate({ id: row.original.id, data: { status: status as TrainerSessionStatus } })}><SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select> },
    { header: 'Notes', cell: ({ row }) => <span className="max-w-xs truncate text-sm text-muted-foreground">{row.original.notes ?? '—'}</span> },
  ]
  return <EntityListPage title="PT Schedule" description="Sessions for your assigned members." columns={columns} data={sessions.data ?? []} isLoading={sessions.isLoading} isError={sessions.isError} onRetry={() => void sessions.refetch()} emptyMessage="No sessions scheduled." />
}