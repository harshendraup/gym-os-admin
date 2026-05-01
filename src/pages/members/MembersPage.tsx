import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers } from '@/hooks/useMembers'
import DataTable from '@/components/data-table/DataTable'
import { type ColumnDef } from '@tanstack/react-table'
import type { Member } from '@/api/members.api'
import { AddMemberDialog } from './AddMemberDialog'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/useDebounce'

const columns: ColumnDef<Member>[] = [
  {
    id: 'member',
    header: 'Member',
    cell: ({ row }) => {
      const m = row.original
      return (
        <Link to={`/members/${m.id}`} className="flex items-center gap-3 group">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={m.user.profilePhotoUrl ?? undefined} />
            <AvatarFallback
              className="text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
            >
              {m.user.fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors duration-150">
              {m.user.fullName}
            </p>
            <p className="text-xs font-mono" style={{ color: '#64748B' }}>{m.memberCode}</p>
          </div>
        </Link>
      )
    },
  },
  {
    header: 'Contact',
    cell: ({ row }) => {
      const u = row.original.user
      return (
        <div className="text-sm space-y-0.5">
          <p className="text-white">{u.phone ?? '—'}</p>
          <p style={{ color: '#64748B' }}>{u.email ?? '—'}</p>
        </div>
      )
    },
  },
  {
    header: 'Status',
    cell: ({ row }) => <MemberStatusBadge status={row.original.status} />,
  },
  {
    header: 'Plan',
    cell: ({ row }) => {
      const sub = row.original.activeSubscription
      return sub ? (
        <div className="text-sm space-y-0.5">
          <p className="font-medium text-white">{sub.membershipPlan.name}</p>
          <p style={{ color: '#64748B' }}>
            Expires {format(new Date(sub.expiresAt), 'dd MMM yyyy')}
          </p>
        </div>
      ) : (
        <span className="text-sm" style={{ color: '#475569' }}>No active plan</span>
      )
    },
  },
  {
    header: 'Joined',
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: '#94A3B8' }}>
        {format(new Date(row.original.joinedAt), 'dd MMM yyyy')}
      </span>
    ),
  },
]

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useMembers({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
    perPage: 20,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Businesses</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
            {data?.meta?.total ?? 0} total members
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-white transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <Search
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: '#475569' }}
          />
          <input
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-600"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#FFFFFF',
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(59,130,246,0.5)'
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255,255,255,0.08)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: status ? '#FFFFFF' : '#64748B',
          }}
          onFocus={(e) => {
            e.target.style.border = '1px solid rgba(59,130,246,0.5)'
          }}
          onBlur={(e) => {
            e.target.style.border = '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <option value="" style={{ background: '#1E293B' }}>All Status</option>
          <option value="active" style={{ background: '#1E293B' }}>Active</option>
          <option value="expired" style={{ background: '#1E293B' }}>Expired</option>
          <option value="frozen" style={{ background: '#1E293B' }}>Frozen</option>
          <option value="pending" style={{ background: '#1E293B' }}>Pending</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pagination={{
          page,
          pageCount: data?.meta?.lastPage ?? 1,
          onPageChange: setPage,
        }}
      />

      <AddMemberDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
