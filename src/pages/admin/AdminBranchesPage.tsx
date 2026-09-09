import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, MapPin, Eye, Trash2, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { useBranches, useCreateBranch, useDeleteBranch } from '@/hooks/useBranches'
import { useAuthStore } from '@/store/auth.store'
import type { BranchRecord } from '@/api/branches.api'

const schema = z.object({
  branchName: z.string().min(2, 'Branch name is required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function CreateBranchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateBranch()
  const gymContext = useAuthStore((s) => s.gymContext)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) reset({ branchName: '', email: '', mobileNumber: '', address: '', city: '' })
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    const businessId = gymContext?.businessId ? Number(gymContext.businessId) : undefined
    if (!businessId) return
    create.mutate(
      {
        businessId,
        branchName: values.branchName,
        email: values.email || undefined,
        mobileNumber: values.mobileNumber || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Branch</DialogTitle>
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
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input placeholder="Mumbai" {...register('city')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Creating...' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = (status || '').toLowerCase()
  const variant = normalized === 'active' ? 'success' : normalized === 'inactive' ? 'secondary' : 'outline'
  return <Badge variant={variant as any}>{status || 'Unknown'}</Badge>
}

function getColumns({
  onView,
  onDelete,
}: {
  onView: (branch: BranchRecord) => void
  onDelete: (branch: BranchRecord) => void
}): ColumnDef<BranchRecord>[] {
  return [
    {
      header: 'Branch',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{row.original.branchName}</div>
            <div className="truncate text-xs text-slate-500">{row.original.address || 'No address on file'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      cell: ({ row }) => {
        const parts = [row.original.city, row.original.state, row.original.country].filter(Boolean)
        return <span className="text-slate-700">{parts.length ? parts.join(', ') : '—'}</span>
      },
    },
    {
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{row.original.email || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{row.original.mobileNumber || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Created',
      cell: ({ row }) =>
        row.original.createdAt ? (
          <span className="text-slate-600 text-sm">
            {new Date(row.original.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        ) : (
          '—'
        ),
    },
    {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(row.original)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      ),
    },
  ]
}

function DeleteBranchDialog({ branch, onClose }: { branch: BranchRecord | null; onClose: () => void }) {
  const deleteBranch = useDeleteBranch()

  const handleDelete = () => {
    if (!branch) return
    deleteBranch.mutate(branch.id, { onSuccess: onClose })
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

export default function AdminBranchesPage() {
  const navigate = useNavigate()
  const gymContext = useAuthStore((s) => s.gymContext)
  const { data: branches, isLoading, isError, refetch } = useBranches(gymContext?.businessId)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteBranch, setDeleteBranch] = useState<BranchRecord | null>(null)

  useEffect(() => {
    console.log('[AdminBranchesPage] branches response:', branches)
  }, [branches])

  const columns = getColumns({
    onView: (branch) => navigate(`/admin/branches/${branch.id}`),
    onDelete: setDeleteBranch,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <EntityListPage
          title="Branches"
          description="Branches under your business"
          columns={columns}
          data={branches}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyMessage="No branches yet. Add the first one."
          actions={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Branch
            </Button>
          }
        />
      </div>

      <CreateBranchDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <DeleteBranchDialog branch={deleteBranch} onClose={() => setDeleteBranch(null)} />
    </div>
  )
}
