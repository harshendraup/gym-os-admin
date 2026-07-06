import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useMembers } from '@/hooks/useMembers'
import { businessesApi } from '@/api/businesses.api'
import DataTable from '@/components/data-table/DataTable'
import { type ColumnDef } from '@tanstack/react-table'
import type { Member } from '@/api/members.api'
import { AddMemberDialog } from './AddMemberDialog'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/store/auth.store'

// ─── Columns ─────────────────────────────────────────────────────────────────

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
            <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors duration-150">
              {m.user.fullName}
            </p>
            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{m.memberCode}</p>
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
          <p className="text-slate-700">{u.phone ?? '—'}</p>
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
          <p className="font-medium text-slate-900">{sub.membershipPlan.name}</p>
          <p style={{ color: '#64748B' }}>
            Expires {format(new Date(sub.expiresAt), 'dd MMM yyyy')}
          </p>
        </div>
      ) : (
        <span className="text-sm" style={{ color: '#94a3b8' }}>No active plan</span>
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

// ─── Super Admin View (all businesses members) ────────────────────────────────

const ALL = '__all__'

function SuperAdminMembersView() {
  const [selectedBusinessId, setSelectedBusinessId] = useState(ALL)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 400)

  // Load all businesses for the filter dropdown
  const { data: businessesData, isLoading: businessesLoading } = useQuery({
    queryKey: ['admin', 'businesses', 'picker'],
    queryFn: () => businessesApi.list({ perPage: 100 }),
  })
  const businesses = businessesData?.data ?? []

  // When "All" is selected: fetch members from every business in parallel
  const perBusinessQueries = useQueries({
    queries: selectedBusinessId === ALL && businesses.length > 0
      ? businesses.map((b) => ({
          queryKey: ['admin', 'businesses', b.id, 'members', 'all-view'],
          queryFn: () => businessesApi.members(b.id, { perPage: 200 }),
          staleTime: 60_000,
        }))
      : [],
  })

  // When a specific business is selected: server-side paginated query
  const { data: singleData, isLoading: singleLoading } = useQuery({
    queryKey: ['admin', 'businesses', selectedBusinessId, 'members', { search: debouncedSearch, status, page }],
    queryFn: () => businessesApi.members(selectedBusinessId, {
      search: debouncedSearch || undefined,
      status: status || undefined,
      page,
    }),
    enabled: selectedBusinessId !== ALL && !!selectedBusinessId,
  })

  // Merge all businesses' member arrays for the "All" view
  const allMembers = useMemo<Member[]>(() => {
    return perBusinessQueries.flatMap((q) => (q.data?.data ?? []) as Member[])
  }, [perBusinessQueries])

  // Client-side search + status filter for "All" view
  const filteredAllMembers = useMemo(() => {
    let list = allMembers
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (m) =>
          m.user.fullName.toLowerCase().includes(q) ||
          (m.user.email?.toLowerCase().includes(q) ?? false) ||
          (m.user.phone?.includes(q) ?? false),
      )
    }
    if (status) list = list.filter((m) => m.status === status)
    return list
  }, [allMembers, debouncedSearch, status])

  const isAllMode = selectedBusinessId === ALL
  const isLoading = isAllMode
    ? businessesLoading || perBusinessQueries.some((q) => q.isLoading)
    : singleLoading

  const tableData = isAllMode ? filteredAllMembers : (singleData?.data ?? [])
  const totalCount = isAllMode ? filteredAllMembers.length : (singleData?.meta?.total ?? 0)

  // Pagination for "All" mode is client-side
  const clientPageSize = 20
  const clientPageCount = isAllMode ? Math.max(1, Math.ceil(filteredAllMembers.length / clientPageSize)) : (singleData?.meta?.lastPage ?? 1)
  const pagedData = isAllMode
    ? filteredAllMembers.slice((page - 1) * clientPageSize, page * clientPageSize)
    : tableData

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Members</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
            {isAllMode
              ? `${totalCount} members across all businesses`
              : `${totalCount} members in ${selectedBusiness?.name ?? 'selected business'}`}
          </p>
        </div>
      </div>

      {/* Business Filter */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}
      >
        <Building2 className="h-4 w-4 flex-shrink-0" style={{ color: '#2563EB' }} />
        <span className="text-sm font-medium text-slate-600 flex-shrink-0">Business</span>
        <select
          value={selectedBusinessId}
          onChange={(e) => { setSelectedBusinessId(e.target.value); setPage(1) }}
          disabled={businessesLoading}
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(59,130,246,0.2)',
            color: '#1e293b',
          }}
          onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)' }}
          onBlur={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.2)' }}
        >
          <option value={ALL}>— All Businesses —</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}{b.city ? ` · ${b.city}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Search + Status filters */}
      <div className="flex gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: '#94a3b8' }}
          />
          <input
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(59,130,246,0.15)', color: '#1e293b' }}
            onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
            onBlur={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.15)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(59,130,246,0.15)', color: status ? '#1e293b' : '#64748B' }}
          onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)' }}
          onBlur={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.15)' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="frozen">Frozen</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={pagedData}
        isLoading={isLoading}
        pagination={{
          page,
          pageCount: clientPageCount,
          onPageChange: setPage,
        }}
        emptyMessage="No members found."
      />
    </div>
  )
}

// ─── Gym Owner / Staff View ───────────────────────────────────────────────────

function GymMembersView() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Members</h1>
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
        <div className="relative max-w-xs flex-1">
          <Search
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: '#94a3b8' }}
          />
          <input
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(59,130,246,0.15)', color: '#1e293b' }}
            onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
            onBlur={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.15)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(59,130,246,0.15)', color: status ? '#1e293b' : '#64748B' }}
          onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)' }}
          onBlur={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.15)' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="frozen">Frozen</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
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
        emptyMessage="No members found."
      />

      <AddMemberDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const gymContext = useAuthStore((s) => s.gymContext)
  const isSuperAdmin = gymContext?.role === 'super_admin' || !gymContext?.gymId

  return isSuperAdmin ? <SuperAdminMembersView /> : <GymMembersView />
}
