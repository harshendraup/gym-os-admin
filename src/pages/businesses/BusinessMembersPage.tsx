import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Search, Mail, Phone, Globe, MapPin, Building2, CheckCircle2, Clock, XCircle, Hash, Tag, Key, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import DataTable from '@/components/data-table/DataTable'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDebounce } from '@/hooks/useDebounce'
import { businessesApi, type BusinessStatus } from '@/api/businesses.api'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Member } from '@/api/members.api'

function generateBusinessKey(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `BIZ-${ts}-${rand}`
}

function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  const map = {
    active: { label: 'Active', Icon: CheckCircle2, color: '#059669', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)' },
    pending: { label: 'Pending', Icon: Clock, color: '#D97706', bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.35)' },
    suspended: { label: 'Suspended', Icon: XCircle, color: '#DC2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.35)' },
  }
  const cfg = map[status] ?? map.pending
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

const columns: ColumnDef<Member>[] = [
  {
    id: 'member',
    header: 'Member',
    cell: ({ row }) => {
      const m = row.original
      return (
        <div className="flex items-center gap-3">
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
            <p className="text-sm font-medium text-slate-900">{m.user.fullName}</p>
            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{m.memberCode}</p>
          </div>
        </div>
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

export default function BusinessMembersPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showKey, setShowKey] = useState(false)
  const [showKeyWarning, setShowKeyWarning] = useState(false)
  const debouncedSearch = useDebounce(search, 400)

  const { data: business } = useQuery({
    queryKey: ['admin', 'businesses', id],
    queryFn: () => businessesApi.get(id!),
    enabled: !!id,
  })

  const regenerateMutation = useMutation({
    mutationFn: () => businessesApi.update(id!, { businessKey: generateBusinessKey() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'businesses', id] })
      toast({ title: 'Business key regenerated' })
    },
    onError: () => toast({ title: 'Failed to regenerate key', variant: 'destructive' }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'businesses', id, 'members', { search: debouncedSearch, status, page }],
    queryFn: () =>
      businessesApi.members(id!, {
        search: debouncedSearch || undefined,
        status: status || undefined,
        page,
      }),
    enabled: !!id,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        to="/businesses"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#64748B' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#2563EB')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#64748B')}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Businesses
      </Link>

      {/* Business Details Card */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(59,130,246,0.12)', backdropFilter: 'blur(8px)' }}
      >
        {/* Identity row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt={business?.name} className="h-10 w-10 object-contain rounded-xl" />
              ) : (
                <Building2 className="h-7 w-7 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{business?.name ?? '...'}</h1>
                {business?.status && <BusinessStatusBadge status={business.status} />}
              </div>
              {business?.legalName && (
                <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>{business.legalName}</p>
              )}
              <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>
                {data?.meta?.total ?? 0} members registered
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {business?.type && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg capitalize font-medium"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Tag className="h-3 w-3" />
                {business.type}
              </span>
            )}
            {business?.registrationNumber && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-medium"
                style={{ background: 'rgba(100,116,139,0.08)', color: '#475569', border: '1px solid rgba(100,116,139,0.2)' }}>
                <Hash className="h-3 w-3" />
                {business.registrationNumber}
              </span>
            )}
          </div>
        </div>

        <div className="border-t" style={{ borderColor: 'rgba(59,130,246,0.08)' }} />

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {business?.email && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)' }}>
                <Mail className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Email</p>
                <a href={`mailto:${business.email}`} className="text-sm text-slate-700 hover:text-blue-600 transition-colors">
                  {business.email}
                </a>
              </div>
            </div>
          )}

          {business?.phone && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)' }}>
                <Phone className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Phone</p>
                <p className="text-sm text-slate-700">{business.phone}</p>
              </div>
            </div>
          )}

          {business?.website && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)' }}>
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Website</p>
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate max-w-[180px] block"
                >
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}

          {(business?.addressLine1 || business?.city) && (
            <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-2">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)' }}>
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Address</p>
                <p className="text-sm text-slate-700">
                  {[business?.addressLine1, business?.addressLine2, business?.city, business?.state, business?.pincode, business?.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {business?.businessKey && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)' }}>
                <Key className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Business Key</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <p className="text-sm font-mono text-slate-700 tracking-wide">
                    {showKey ? business.businessKey : '•'.repeat(business.businessKey.length)}
                  </p>
                  <button
                    onClick={() => setShowKey(v => !v)}
                    className="flex items-center justify-center h-5 w-5 rounded transition-colors hover:bg-slate-100"
                    style={{ color: '#94a3b8' }}
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setShowKeyWarning(true)}
                    disabled={regenerateMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-all duration-150 disabled:opacity-50"
                    style={{
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.2)',
                      color: '#DC2626',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)' }}
                  >
                    <RefreshCw className={`h-3 w-3 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}

          {business?.createdAt && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)' }}>
                <Clock className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Registered</p>
                <p className="text-sm text-slate-700">{format(new Date(business.createdAt), 'dd MMM yyyy')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: '#94a3b8' }}
          />
          <input
            placeholder="Search by name, email..."
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
        emptyMessage="No members found for this business."
      />

      {/* Key Regenerate Warning Dialog */}
      <Dialog open={showKeyWarning} onOpenChange={(o) => !o && setShowKeyWarning(false)}>
        <DialogContent
          className="sm:max-w-sm"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(220,38,38,0.2)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.12)',
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: '#DC2626' }} />
              </div>
              <DialogTitle className="text-slate-900">Regenerate Business Key?</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
            This will permanently replace the current business key with a new one.
            Any integrations or API clients using the old key will{' '}
            <span className="font-semibold text-red-600">stop working immediately</span>.
          </p>
          <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2.5 mt-2">
            <button
              onClick={() => setShowKeyWarning(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150"
              style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', color: '#64748B' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowKeyWarning(false); regenerateMutation.mutate() }}
              disabled={regenerateMutation.isPending}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
              style={{ background: 'rgba(220,38,38,0.85)', border: '1px solid rgba(220,38,38,0.4)' }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Yes, Regenerate
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
