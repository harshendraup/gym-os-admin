import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Building2, Mail, Phone, MapPinned, Calendar, Pencil, Trash2, MapPin,
  QrCode, RefreshCcw, Printer, Download, AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useBranches, useUpdateBranch, useDeleteBranch } from '@/hooks/useBranches'
import { useGenerateBranchQr, useBranchQr, useRegenerateBranchQr } from '@/hooks/useAttendance'
import { useAuthStore } from '@/store/auth.store'
import type { BranchRecord } from '@/api/branches.api'

const editSchema = z.object({
  branchName: z.string().min(2, 'Branch name is required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  status: z.string(),
})
type EditFormValues = z.infer<typeof editSchema>

function EditBranchDialog({ branch, onClose }: { branch: BranchRecord | null; onClose: () => void }) {
  const update = useUpdateBranch(branch?.id ?? 0)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (branch) {
      reset({
        branchName: branch.branchName,
        email: branch.email ?? '',
        mobileNumber: branch.mobileNumber ?? '',
        address: branch.address ?? '',
        city: branch.city ?? '',
        state: branch.state ?? '',
        country: branch.country ?? '',
        pincode: branch.pincode ?? '',
        status: branch.status ?? 'Active',
      })
    }
  }, [branch, reset])

  const onSubmit = (values: EditFormValues) => {
    if (!branch) return
    update.mutate(
      {
        branchName: values.branchName,
        email: values.email || undefined,
        mobileNumber: values.mobileNumber || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        country: values.country || undefined,
        pincode: values.pincode || undefined,
        status: values.status,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={!!branch} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Branch Name</Label>
            <Input placeholder="Downtown Branch" {...register('branchName')} />
            {errors.branchName && <p className="text-xs text-red-600">{errors.branchName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="branch@business.com" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Mobile Number</Label>
            <Input placeholder="9876543210" {...register('mobileNumber')} />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input placeholder="Street, area" {...register('address')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input placeholder="Mumbai" {...register('city')} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input placeholder="Maharashtra" {...register('state')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input placeholder="India" {...register('country')} />
            </div>
            <div className="space-y-1.5">
              <Label>Pincode</Label>
              <Input placeholder="400001" {...register('pincode')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={watch('status') || 'Active'} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteBranchDialog({ branch, onClose, onDeleted }: { branch: BranchRecord | null; onClose: () => void; onDeleted: () => void }) {
  const deleteBranch = useDeleteBranch()

  const handleDelete = () => {
    if (!branch) return
    deleteBranch.mutate(branch.id, { onSuccess: onDeleted })
  }

  return (
    <Dialog open={!!branch} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Branch</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-slate-800">{branch?.branchName}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteBranch.isPending}>
            {deleteBranch.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</p>
        <p className="text-sm text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function BranchQrCard({ branch }: { branch: BranchRecord }) {
  const branchId = String(branch.id)
  const { data: qr, isLoading, isError, refetch } = useBranchQr(branchId)
  const generateQr = useGenerateBranchQr(branchId)
  const regenerateQr = useRegenerateBranchQr(branchId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const qrImageUrl = useMemo(() => qr?.qrImageUrl || '', [qr?.qrImageUrl])

  const handlePrint = () => {
    if (!qrImageUrl) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>${branch.branchName} Attendance QR</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0; font-family: Arial, sans-serif; background: #fff; color: #111827;
              display: flex; align-items: center; justify-content: center; min-height: 100vh;
            }
            .card {
              width: min(540px, 90vw); border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; text-align: center;
            }
            .logo { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
            .subtitle { font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 18px; }
            .qr-wrap { display: flex; justify-content: center; align-items: center; margin: 22px 0; }
            .qr-wrap img { width: 240px; height: 240px; object-fit: contain; border: 10px solid #fff; box-shadow: 0 10px 22px rgba(15,23,42,0.08); }
            .title { font-size: 30px; font-weight: 700; margin: 0 0 8px; }
            .hint { font-size: 16px; color: #475569; margin: 0; }
            @media print {
              body { background: #fff; }
              .card { border: 0; box-shadow: none; width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">${branch.branchName}</div>
            <div class="subtitle">Attendance</div>
            <div class="title">${branch.branchName}</div>
            <p class="hint">Scan to mark attendance in the GymOS app</p>
            <div class="qr-wrap"><img src="${qrImageUrl}" alt="Attendance QR" /></div>
            <p class="hint">Open the GymOS app and scan this QR to check in.</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const handleDownload = () => {
    if (!qrImageUrl) return
    const link = document.createElement('a')
    link.href = qrImageUrl
    link.download = `branch-${branch.id}-attendance-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const statusLabel = qr?.status ?? 'Inactive'
  const hasQr = !!qr && !!qrImageUrl

  return (
    <Card className="overflow-hidden border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Attendance QR Code</h3>
              <p className="text-xs text-slate-500">{branch.branchName}</p>
            </div>
          </div>
          {hasQr && (
            <Badge variant={statusLabel === 'active' ? 'success' : 'secondary'}>
              {statusLabel === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center text-sm text-slate-500">Loading QR...</div>
          </div>
        ) : isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50 text-center text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Unable to load QR code.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : hasQr ? (
          <div className="space-y-4">
            <div className="flex justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <img src={qrImageUrl} alt="Branch attendance QR" className="h-48 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-sm" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-800">{branch.branchName}</p>
              <p className="mt-1 text-xs text-slate-500">Members can scan this QR from the GymOS mobile app to mark attendance.</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <QrCode className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">No QR code has been generated for this branch.</p>
              <p className="mt-1 text-xs text-slate-500">Generate a new attendance QR to start check-ins.</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!hasQr ? (
            <Button size="sm" onClick={() => generateQr.mutate()} disabled={generateQr.isPending}>
              {generateQr.isPending ? 'Generating...' : 'Generate QR Code'}
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)} disabled={regenerateQr.isPending}>
                <RefreshCcw className="mr-1.5 h-4 w-4" />
                {regenerateQr.isPending ? 'Regenerating...' : 'Regenerate QR'}
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="mr-1.5 h-4 w-4" />
                Print QR
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="mr-1.5 h-4 w-4" />
                Download QR
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={(open) => !open && setConfirmOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate Attendance QR?</DialogTitle>
            <DialogDescription>
              The existing QR code will stop working. A new QR code will be generated for this branch.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                regenerateQr.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })
              }}
              disabled={regenerateQr.isPending}
            >
              {regenerateQr.isPending ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default function AdminBranchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const gymContext = useAuthStore((s) => s.gymContext)
  const { data: branches = [], isLoading } = useBranches(gymContext?.businessId)
  const branch = branches.find((b) => String(b.id) === id) ?? null
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Branch not found.</p>
      </div>
    )
  }

  const isActive = (branch.status ?? '').toLowerCase() !== 'inactive'

  return (
    <div className="animate-fade-in space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/branches')} className="-ml-2">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back
      </Button>

      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-700" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{branch.branchName}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <Badge>Branch</Badge>
                  <Badge variant={isActive ? 'success' : 'secondary'}>{branch.status || 'Unknown'}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <DetailRow icon={Mail} label="Email" value={branch.email ?? '—'} />
            <DetailRow icon={Phone} label="Mobile" value={branch.mobileNumber ?? '—'} />
            <DetailRow icon={MapPinned} label="Address" value={branch.address ?? '—'} />
            <DetailRow
              icon={MapPinned}
              label="City / State / Country"
              value={[branch.city, branch.state, branch.country].filter(Boolean).join(', ') || '—'}
            />
            <DetailRow icon={MapPinned} label="Pincode" value={branch.pincode ?? '—'} />
            <DetailRow icon={Building2} label="Business ID" value={String(branch.businessId)} />
            <DetailRow icon={Calendar} label="Created" value={branch.createdAt ? new Date(branch.createdAt).toLocaleString('en-IN') : '—'} />
            <DetailRow icon={Calendar} label="Last Updated" value={branch.updatedAt ? new Date(branch.updatedAt).toLocaleString('en-IN') : '—'} />
          </div>
        </CardContent>
      </Card>

      <BranchQrCard branch={branch} />

      <EditBranchDialog branch={editOpen ? branch : null} onClose={() => setEditOpen(false)} />
      <DeleteBranchDialog
        branch={deleteOpen ? branch : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate('/admin/branches')}
      />
    </div>
  )
}
