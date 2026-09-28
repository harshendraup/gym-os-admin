import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Mail, Phone, Search, UserRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { useTrainerMembers } from '@/hooks/useTrainerMembers'
import type { ManagedUser } from '@/api/user-management.api'

const columnsFor = (onView: (member: ManagedUser) => void): ColumnDef<ManagedUser>[] => [
  {
    header: 'Member',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{row.original.fullName ?? row.original.firstName}</p>
          <p className="text-xs text-slate-500">ID: {row.original.memberCode ?? row.original.id}</p>
        </div>
      </div>
    ),
  },
  {
    header: 'Contact',
    cell: ({ row }) => (
      <div className="space-y-1 text-sm text-slate-600">
        <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{row.original.email ?? '—'}</div>
        <div className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3" />{row.original.mobile ?? '—'}</div>
      </div>
    ),
  },
  { header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'Active' ? 'success' : 'secondary'}>{row.original.status}</Badge> },
  { header: 'Branch', cell: ({ row }) => <span className="text-sm text-slate-600">#{row.original.branchId ?? '—'}</span> },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <button className="inline-flex items-center gap-1.5 text-sm font-medium text-primary" onClick={() => onView(row.original)}><Eye className="h-4 w-4" /> View</button>,
  },
]

export default function TrainerMembersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const filters = useMemo(() => ({ page, perPage: 20, search: search || undefined, status: status || undefined }), [page, search, status])
  const members = useTrainerMembers(filters)
  const meta = members.data?.meta

  return (
    <EntityListPage
      title="My Members"
      description="Members assigned to your coaching roster."
      columns={columnsFor((member) => navigate(`/trainer/members/${member.id}`))}
      data={members.data?.data}
      isLoading={members.isLoading}
      isError={members.isError}
      onRetry={() => void members.refetch()}
      emptyMessage="No assigned members found."
      toolbar={(
        <>
          <div className="relative min-w-[260px] flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setPage(1); setSearch(searchInput.trim()) } }} placeholder="Search assigned members" className="pl-9" />
          </div>
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Frozen">Frozen</option>
          </select>
        </>
      )}
      pagination={meta && { page: meta.page, pageCount: meta.lastPage, onPageChange: setPage }}
    />
  )
}