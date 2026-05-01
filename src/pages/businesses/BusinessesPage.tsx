import { useState, useRef, useEffect, forwardRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Building2, Plus, Search, MoreHorizontal, Edit2, Trash2,
  CheckCircle2, XCircle, Clock, Phone, MapPin, Mail,
  AlertTriangle, RefreshCw,
} from 'lucide-react'
import DataTable from '@/components/data-table/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { businessesApi, type Business, type BusinessStatus, type BusinessPayload } from '@/api/businesses.api'
import { cn } from '@/lib/utils'

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BusinessStatus }) {
  const map = {
    active:    { label: 'Active',    Icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
    pending:   { label: 'Pending',   Icon: Clock,        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
    suspended: { label: 'Suspended', Icon: XCircle,      color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'  },
  } as const
  const cfg = map[status]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    independent: { label: 'Independent', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
    chain:       { label: 'Chain',       color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
    franchise:   { label: 'Franchise',   color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)'  },
  }
  const cfg = map[type] ?? { label: type, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' }
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const statusOpts = [
    { status: 'active' as BusinessStatus,    label: 'Mark Active',  color: '#10B981' },
    { status: 'pending' as BusinessStatus,   label: 'Mark Pending', color: '#F59E0B' },
    { status: 'suspended' as BusinessStatus, label: 'Suspend',      color: '#EF4444' },
  ].filter((o) => o.status !== business.status)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-40"
        style={{
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#94A3B8',
        }}
      >
        {isPending
          ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          : <MoreHorizontal className="h-4 w-4" />
        }
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-50 min-w-[172px] overflow-hidden rounded-xl py-1"
          style={{
            background: 'rgba(10,18,35,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={() => { onEdit(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Details
          </button>

          <div className="my-1 mx-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {statusOpts.map(({ status, label, color }) => (
            <button
              key={status}
              onClick={() => { onStatusChange(status); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
              style={{ color }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}

          <div className="my-1 mx-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors"
            style={{ color: '#EF4444' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
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
          background: 'rgba(12,20,38,0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(239,68,68,0.2)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: '#EF4444' }} />
            </div>
            <DialogTitle className="text-white">Delete Business</DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">{business?.name}</span>?
          This is a soft delete and can be reviewed later.
        </p>

        <div className="flex justify-end gap-2.5 mt-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.4)' }}
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

// ─── Form ─────────────────────────────────────────────────────────────────────

const businessSchema = z.object({
  name:               z.string().min(2, 'Business name is required'),
  legalName:          z.string().optional(),
  registrationNumber: z.string().optional(),
  type:               z.enum(['independent', 'chain', 'franchise'], { required_error: 'Type is required' }),
  email:              z.string().email('Valid email required'),
  phone:              z.string().min(7, 'Phone is required'),
  website:            z.string().url('Enter a valid URL').optional().or(z.literal('')),
  addressLine1:       z.string().min(1, 'Address is required'),
  addressLine2:       z.string().optional(),
  city:               z.string().min(1, 'City is required'),
  state:              z.string().min(1, 'State is required'),
  pincode:            z.string().min(4, 'Pincode is required'),
  country:            z.string().min(1, 'Country is required'),
  logoUrl:            z.string().url('Enter a valid URL').optional().or(z.literal('')),
})
type FormData = z.infer<typeof businessSchema>

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: '#3B82F6' }}>
        {label}
      </p>
      <div className="flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
    </div>
  )
}

const GlassInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, onFocus, onBlur, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-600',
        className,
      )}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFFFFF' }}
      onFocus={(e) => {
        e.target.style.border = '1px solid rgba(59,130,246,0.5)'
        e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
        onFocus?.(e)
      }}
      onBlur={(e) => {
        e.target.style.border = '1px solid rgba(255,255,255,0.08)'
        e.target.style.boxShadow = 'none'
        onBlur?.(e)
      }}
      {...props}
    />
  )
)
GlassInput.displayName = 'GlassInput'

function GlassSelect({ value, children, onChange, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: value ? '#FFFFFF' : '#64748B',
      }}
      onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)' }}
      onBlur={(e)  => { e.target.style.border = '1px solid rgba(255,255,255,0.08)' }}
      {...props}
    >
      {children}
    </select>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>{msg}</p>
}

function FormField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#3B82F6' }}>*</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  )
}

function BusinessFormDialog({
  open,
  onClose,
  editBusiness,
}: {
  open: boolean
  onClose: () => void
  editBusiness: Business | null
}) {
  const qc = useQueryClient()
  const isEdit = !!editBusiness

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: { country: 'India', type: 'independent' },
  })

  useEffect(() => {
    if (open && editBusiness) {
      reset({
        name:               editBusiness.name,
        legalName:          editBusiness.legalName  ?? '',
        registrationNumber: editBusiness.registrationNumber ?? '',
        type:               editBusiness.type,
        email:              editBusiness.email,
        phone:              editBusiness.phone,
        website:            editBusiness.website    ?? '',
        addressLine1:       editBusiness.addressLine1,
        addressLine2:       editBusiness.addressLine2 ?? '',
        city:               editBusiness.city,
        state:              editBusiness.state,
        pincode:            editBusiness.pincode,
        country:            editBusiness.country,
        logoUrl:            editBusiness.logoUrl    ?? '',
      })
    } else if (!open) {
      reset({ country: 'India', type: 'independent' })
    }
  }, [open, editBusiness, reset])

  const createMutation = useMutation({
    mutationFn: (d: BusinessPayload) => businessesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'businesses'] }); toast({ title: 'Business created' }); onClose() },
    onError:   () => toast({ title: 'Failed to create business', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: (d: Partial<BusinessPayload>) => businessesApi.update(editBusiness!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'businesses'] }); toast({ title: 'Business updated' }); onClose() },
    onError:   () => toast({ title: 'Failed to update business', variant: 'destructive' }),
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const typeValue = watch('type')

  const onSubmit = (data: FormData) => {
    const payload: BusinessPayload = {
      name:         data.name,
      type:         data.type,
      email:        data.email,
      phone:        data.phone,
      addressLine1: data.addressLine1,
      city:         data.city,
      state:        data.state,
      pincode:      data.pincode,
      country:      data.country,
      ...(data.legalName          && { legalName: data.legalName }),
      ...(data.registrationNumber && { registrationNumber: data.registrationNumber }),
      ...(data.website            && { website: data.website }),
      ...(data.addressLine2       && { addressLine2: data.addressLine2 }),
      ...(data.logoUrl            && { logoUrl: data.logoUrl }),
    }
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        style={{
          background: 'rgba(10,18,35,0.98)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Dialog Header */}
        <div
          className="flex items-center gap-3 px-6 pt-6 pb-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <DialogTitle className="text-[17px] font-semibold text-white">
              {isEdit ? 'Edit Business' : 'New Business'}
            </DialogTitle>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              {isEdit ? `Editing ${editBusiness?.name}` : 'Register a new business on the platform'}
            </p>
          </div>
        </div>

        {/* Scrollable Form */}
        <form id="biz-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-7">

            {/* ── Identity ── */}
            <div className="space-y-4">
              <SectionLabel label="Identity" />
              <FormField label="Business Name" required error={errors.name?.message}>
                <GlassInput placeholder="e.g. FitLife Studios" {...register('name')} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Legal Name" error={errors.legalName?.message}>
                  <GlassInput placeholder="Official registered name" {...register('legalName')} />
                </FormField>
                <FormField label="Registration No." error={errors.registrationNumber?.message}>
                  <GlassInput placeholder="GST / CIN / Company No." {...register('registrationNumber')} />
                </FormField>
              </div>
              <FormField label="Business Type" required error={errors.type?.message}>
                <GlassSelect
                  value={typeValue}
                  onChange={(e) => setValue('type', e.target.value as FormData['type'], { shouldValidate: true })}
                >
                  <option value="independent" style={{ background: '#0a1223' }}>Independent</option>
                  <option value="chain"       style={{ background: '#0a1223' }}>Chain</option>
                  <option value="franchise"   style={{ background: '#0a1223' }}>Franchise</option>
                </GlassSelect>
              </FormField>
            </div>

            {/* ── Contact ── */}
            <div className="space-y-4">
              <SectionLabel label="Contact" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email" required error={errors.email?.message}>
                  <GlassInput type="email" placeholder="admin@business.com" {...register('email')} />
                </FormField>
                <FormField label="Phone" required error={errors.phone?.message}>
                  <GlassInput placeholder="+91 98765 43210" {...register('phone')} />
                </FormField>
              </div>
              <FormField label="Website" error={errors.website?.message}>
                <GlassInput type="url" placeholder="https://www.business.com" {...register('website')} />
              </FormField>
            </div>

            {/* ── Address ── */}
            <div className="space-y-4">
              <SectionLabel label="Address" />
              <FormField label="Address Line 1" required error={errors.addressLine1?.message}>
                <GlassInput placeholder="Street, building, area" {...register('addressLine1')} />
              </FormField>
              <FormField label="Address Line 2" error={errors.addressLine2?.message}>
                <GlassInput placeholder="Apartment, suite, floor (optional)" {...register('addressLine2')} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="City" required error={errors.city?.message}>
                  <GlassInput placeholder="Mumbai" {...register('city')} />
                </FormField>
                <FormField label="State" required error={errors.state?.message}>
                  <GlassInput placeholder="Maharashtra" {...register('state')} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Pincode" required error={errors.pincode?.message}>
                  <GlassInput placeholder="400001" {...register('pincode')} />
                </FormField>
                <FormField label="Country" required error={errors.country?.message}>
                  <GlassInput placeholder="India" {...register('country')} />
                </FormField>
              </div>
            </div>

            {/* ── Branding ── */}
            <div className="space-y-4">
              <SectionLabel label="Branding" />
              <FormField label="Logo URL" error={errors.logoUrl?.message}>
                <GlassInput type="url" placeholder="https://cdn.example.com/logo.png" {...register('logoUrl')} />
              </FormField>
            </div>

          </div>
        </form>

        {/* Dialog Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="biz-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}
          >
            {isPending
              ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</>
              : isEdit ? 'Save Changes' : 'Create Business'
            }
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Table Columns ────────────────────────────────────────────────────────────

function getColumns(
  onEdit: (b: Business) => void,
  onDelete: (b: Business) => void,
  onStatusChange: (b: Business, s: BusinessStatus) => void,
  pendingId: string | null,
): ColumnDef<Business>[] {
  return [
    {
      id: 'business',
      header: 'Business',
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="flex items-center gap-3">
            {b.logoUrl
              ? <img src={b.logoUrl} alt={b.name} className="h-9 w-9 rounded-xl object-cover flex-shrink-0" />
              : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                >
                  <Building2 className="h-4 w-4 text-white" />
                </div>
              )
            }
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{b.name}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: '#475569' }}>/{b.slug}</p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Type',
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      header: 'Contact',
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[160px]">{b.email}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: '#64748B' }}>
              <Phone className="h-3 w-3 flex-shrink-0" />
              {b.phone}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Location',
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#94A3B8' }}>
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span>{b.city}, {b.state}</span>
          </div>
        )
      },
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="flex justify-end">
            <ActionMenu
              business={b}
              onEdit={() => onEdit(b)}
              onDelete={() => onDelete(b)}
              onStatusChange={(s) => onStatusChange(b, s)}
              isPending={pendingId === b.id}
            />
          </div>
        )
      },
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessesPage() {
  const qc = useQueryClient()
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]   = useState('')
  const [page, setPage]               = useState(1)
  const debouncedSearch               = useDebounce(search, 400)

  const [formOpen, setFormOpen]         = useState(false)
  const [editBusiness, setEditBusiness] = useState<Business | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null)
  const [pendingId, setPendingId]       = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'businesses', { search: debouncedSearch, status: statusFilter, type: typeFilter, page }],
    queryFn: () =>
      businessesApi.list({
        search:  debouncedSearch || undefined,
        status:  statusFilter   || undefined,
        type:    typeFilter     || undefined,
        page,
        perPage: 20,
      }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BusinessStatus }) =>
      businessesApi.updateStatus(id, status),
    onMutate:  ({ id }) => setPendingId(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'businesses'] }); toast({ title: 'Status updated' }) },
    onError:   () => toast({ title: 'Failed to update status', variant: 'destructive' }),
    onSettled: () => setPendingId(null),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => businessesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      toast({ title: 'Business deleted' })
      setDeleteTarget(null)
    },
    onError: () => toast({ title: 'Failed to delete business', variant: 'destructive' }),
  })

  const openCreate = () => { setEditBusiness(null); setFormOpen(true) }
  const openEdit   = (b: Business) => { setEditBusiness(b); setFormOpen(true) }

  const columns = getColumns(
    openEdit,
    setDeleteTarget,
    (b, s) => statusMutation.mutate({ id: b.id, status: s }),
    pendingId,
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Businesses</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
            {data?.meta?.total ?? 0} total businesses registered on the platform
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-white transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
        >
          <Plus className="h-4 w-4" />
          New Business
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: '#475569' }}
          />
          <input
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-600"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFFFFF' }}
            onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
            onBlur={(e)  => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: statusFilter ? '#FFFFFF' : '#64748B' }}
          onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)' }}
          onBlur={(e)  => { e.target.style.border = '1px solid rgba(255,255,255,0.08)' }}
        >
          <option value=""          style={{ background: '#0a1223' }}>All Status</option>
          <option value="pending"   style={{ background: '#0a1223' }}>Pending</option>
          <option value="active"    style={{ background: '#0a1223' }}>Active</option>
          <option value="suspended" style={{ background: '#0a1223' }}>Suspended</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: typeFilter ? '#FFFFFF' : '#64748B' }}
          onFocus={(e) => { e.target.style.border = '1px solid rgba(59,130,246,0.5)' }}
          onBlur={(e)  => { e.target.style.border = '1px solid rgba(255,255,255,0.08)' }}
        >
          <option value=""            style={{ background: '#0a1223' }}>All Types</option>
          <option value="independent" style={{ background: '#0a1223' }}>Independent</option>
          <option value="chain"       style={{ background: '#0a1223' }}>Chain</option>
          <option value="franchise"   style={{ background: '#0a1223' }}>Franchise</option>
        </select>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pagination={{
          page,
          pageCount: data?.meta?.lastPage ?? 1,
          onPageChange: setPage,
        }}
        emptyMessage="No businesses found. Add the first one."
      />

      {/* ── Dialogs ── */}
      <BusinessFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditBusiness(null) }}
        editBusiness={editBusiness}
      />

      <DeleteDialog
        open={!!deleteTarget}
        business={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
