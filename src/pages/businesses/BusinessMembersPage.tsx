import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeft, Search, Mail, Phone, Globe, MapPin, Building2,
  CheckCircle2, Clock, XCircle, Hash, Tag, Key, Eye, EyeOff,
  RefreshCw, AlertTriangle, MoreVertical, Edit2, Trash2,
  Copy,
} from 'lucide-react'
import { format } from 'date-fns'
import DataTable from '@/components/data-table/DataTable'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebounce } from '@/hooks/useDebounce'
import { businessesApi, type Business, type BusinessStatus } from '@/api/businesses.api'
import { api } from '@/api/client'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BusinessFormDialog } from './BusinessesPage'
import type { Member } from '@/api/members.api'
import { useAuthStore } from '@/store/auth.store'

function generateBusinessKey(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `BIZ-${ts}-${rand}`
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast({ title: `${label} copied` })
  } catch {
    toast({
      title: `Failed to copy ${label.toLowerCase()}`,
      variant: 'destructive',
    })
  }
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

// ─── Action Dropdown ──────────────────────────────────────────────────────────

function ActionMenu({
  business,
  onEdit,
  onDelete,
  onStatusChange,
  isPending,
}: {
  business: Business
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (s: BusinessStatus) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!buttonRef.current?.contains(target) && !ref.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
  }, [open])

  const statusOpts = [
    { status: 'active' as BusinessStatus, label: 'Mark Active', color: '#059669' },
    { status: 'pending' as BusinessStatus, label: 'Mark Pending', color: '#D97706' },
    { status: 'suspended' as BusinessStatus, label: 'Suspend', color: '#DC2626' },
  ].filter((o) => o.status !== business.status)

  return (
    <div ref={ref}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((p) => !p)}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-40"
        style={{
          background: open ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)',
          border: '1px solid rgba(59,130,246,0.1)',
          color: '#64748b',
        }}
      >
        {isPending
          ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-slate-500" />
          : <MoreVertical className="h-4 w-4" />
        }
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[172px] overflow-hidden rounded-xl py-1"
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59,130,246,0.15)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={() => { onEdit(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Details
          </button>

          <div className="my-1 mx-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

          {statusOpts.map(({ status, label, color }) => (
            <button
              key={status}
              onClick={() => { onStatusChange(status); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
              style={{ color }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}

          <div className="my-1 mx-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors"
            style={{ color: '#DC2626' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteDialog({
  open,
  business,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  business: Business | null
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-sm"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(220,38,38,0.2)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.1)',
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: '#DC2626' }} />
            </div>
            <DialogTitle className="text-slate-900">Delete Business</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900">{business?.name}</span>?
          This is a soft delete and can be reviewed later.
        </p>
        <div className="flex justify-end gap-2.5 mt-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150"
            style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', color: '#64748B' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
            style={{ background: 'rgba(220,38,38,0.8)', border: '1px solid rgba(220,38,38,0.4)' }}
          >
            {isPending
              ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Deleting...</>
              : 'Delete Business'
            }
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Members Table Columns ────────────────────────────────────────────────────

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

type BusinessUser = {
  id: string
  full_name?: string
  fullName?: string
  phone?: string | null
  email?: string | null
  role?: string
  business_id?: string | null
  businessId?: string | null
  is_active?: boolean
  isActive?: boolean
}

type UsersResponse = {
  meta?: {
    total: number
  }
  data: BusinessUser[]
}

type CreateBusinessUserPayload = {
  business_id: string
  name: string
  email: string
  phone: string
  password: string
  role: string
}

const BUSINESS_USER_ROLE_OPTIONS = ['admin', 'trainer', 'gym_owner', 'member']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessMembersPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isSuperAdmin = useAuthStore((s) => s.gymContext?.role === 'super_admin')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showKey, setShowKey] = useState(false)
  const [showKeyWarning, setShowKeyWarning] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [userForm, setUserForm] = useState<CreateBusinessUserPayload>({
    business_id: id ?? '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
  })
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    setUserForm((prev) => ({ ...prev, business_id: id ?? '' }))
  }, [id])

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

  const statusMutation = useMutation({
    mutationFn: (s: BusinessStatus) => businessesApi.updateStatus(id!, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'businesses', id] })
      toast({ title: 'Status updated' })
    },
    onError: () => toast({ title: 'Failed to update status', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => businessesApi.delete(id!),
    onSuccess: () => {
      toast({ title: 'Business deleted' })
      navigate('/businesses')
    },
    onError: () => toast({ title: 'Failed to delete business', variant: 'destructive' }),
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

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => api.get<UsersResponse>('/admin/users'),
    enabled: !!id,
  })

  const businessUsers = (usersData?.data ?? []).filter((u) => (u.business_id ?? u.businessId) === id)

  const addBusinessUserMutation = useMutation({
    mutationFn: (payload: CreateBusinessUserPayload) => {
      return api.post('/admin/business-admins', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'users', id] })
      toast({ title: 'Business user added' })
      setUserForm({
        business_id: id ?? '',
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin',
      })
      setUserFormOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add user',
        description: error?.response?.data?.error?.message ?? 'Please check details and try again.',
        variant: 'destructive',
      })
    },
  })

  const canSubmitBusinessUser =
    !!userForm.business_id &&
    !!userForm.name &&
    !!userForm.email &&
    !!userForm.phone &&
    !!userForm.password &&
    !!userForm.role

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
        {/* Identity row: logo + name + action menu */}
        <div className="flex items-start justify-between gap-4">
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
          {business && (
            <ActionMenu
              business={business}
              onEdit={() => setFormOpen(true)}
              onDelete={() => setDeleteConfirm(true)}
              onStatusChange={(s) => statusMutation.mutate(s)}
              isPending={statusMutation.isPending || deleteMutation.isPending}
            />
          )}
        </div>

        {/* Danger-tinted section: type/registration tags + info grid */}
        <div
          className="rounded-xl p-4 space-y-4"
          style={{
            background: 'rgba(220,38,38,0.03)',
            border: '1px solid rgba(220,38,38,0.1)',
          }}
        >
          {/* Tags row */}
          {(business?.type || business?.registrationNumber) && (
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
          )}

          <div className="border-t" style={{ borderColor: 'rgba(220,38,38,0.08)' }} />

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
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${business.email}`} className="text-sm text-slate-700 hover:text-blue-600 transition-colors">
                      {business.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyText(business.email, 'Email')}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-blue-50"
                      title="Copy email"
                      aria-label="Copy email"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-700">{business.phone}</p>
                    <button
                      type="button"
                      onClick={() => copyText(business.phone, 'Phone')}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-blue-50"
                      title="Copy phone"
                      aria-label="Copy phone"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  </div>
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

      {/* Business Users */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(239,246,255,0.9), rgba(255,255,255,0.86))',
          border: '1px solid rgba(59,130,246,0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 24px rgba(37,99,235,0.06)',
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Business Users</h2>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Users mapped to this business with role-based access.
            </p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => setUserFormOpen(true)}>
              Add Business User
            </Button>
          )}
        </div>

        <div
          className="rounded-lg border bg-white/80"
          style={{ borderColor: 'rgba(59,130,246,0.16)' }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-slate-500">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : businessUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-slate-500">
                    No users added for this business.
                  </TableCell>
                </TableRow>
              ) : (
                businessUsers.map((user) => {
                  const name = user.full_name ?? user.fullName ?? '—'
                  const isActive = user.is_active ?? user.isActive
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{user.email ?? '—'}</TableCell>
                      <TableCell>{user.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role ?? '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{user.id}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Members Section */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(236,253,245,0.82), rgba(255,255,255,0.88))',
          border: '1px solid rgba(16,185,129,0.24)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 24px rgba(5,150,105,0.06)',
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Business Members</h2>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Membership list and current plan status for this business.
            </p>
          </div>
        </div>

        <div
          className="rounded-lg border bg-white/80"
          style={{ borderColor: 'rgba(16,185,129,0.2)' }}
        >
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
        </div>
      </div>

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

      {/* Edit Business Dialog */}
      <BusinessFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editBusiness={business ?? null}
      />

      {/* Delete Confirm Dialog */}
      <DeleteDialog
        open={deleteConfirm}
        business={business ?? null}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Business User</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Business ID</Label>
              <Input value={userForm.business_id} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="your_name1@gmail.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={userForm.phone}
                onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+91"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_USER_ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUserFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addBusinessUserMutation.mutate(userForm)}
                disabled={!canSubmitBusinessUser || addBusinessUserMutation.isPending}
              >
                {addBusinessUserMutation.isPending ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
