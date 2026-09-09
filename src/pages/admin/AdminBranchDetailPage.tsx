import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Building2, Mail, Phone, MapPinned, Calendar, Pencil, Trash2, MapPin,
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

      <EditBranchDialog branch={editOpen ? branch : null} onClose={() => setEditOpen(false)} />
      <DeleteBranchDialog
        branch={deleteOpen ? branch : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate('/admin/branches')}
      />
    </div>
  )
}
