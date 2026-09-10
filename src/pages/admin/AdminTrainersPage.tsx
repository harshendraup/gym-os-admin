import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2, Users, Eye, Pencil, Mail, Phone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { CreateScopedUserDialog } from '@/components/entity/CreateScopedUserDialog'
import { TrainerMembersDialog } from '@/components/entity/TrainerMembersDialog'
import { useRoles } from '@/hooks/useRoles'
import { useUsersByRole, useDeleteUser, useUpdateUser } from '@/hooks/useUsers'
import { useBranches } from '@/hooks/useBranches'
import { useAuthStore } from '@/store/auth.store'
import type { ManagedUser } from '@/api/user-management.api'

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = (status || '').toLowerCase()
  const variant = normalized === 'active' ? 'success' : normalized === 'inactive' ? 'secondary' : 'outline'
  return <Badge variant={variant as any}>{status || 'Unknown'}</Badge>
}

function getColumns({
  branchName,
  memberCount,
  onViewMembers,
  onView,
  onEdit,
  onDelete,
  deletingId,
}: {
  branchName: (id: number | null) => string
  memberCount: (trainerId: string) => number
  onViewMembers: (u: ManagedUser) => void
  onView: (u: ManagedUser) => void
  onEdit: (u: ManagedUser) => void
  onDelete: (u: ManagedUser) => void
  deletingId: string | null
}): ColumnDef<ManagedUser>[] {
  return [
    {
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {(row.original.fullName ?? row.original.firstName ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {row.original.fullName ?? `${row.original.firstName} ${row.original.lastName ?? ''}`}
            </div>
            <div className="truncate text-xs text-slate-500">ID: {row.original.id}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{row.original.email || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{row.original.mobile || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Branch',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>{branchName(row.original.branchId)}</span>
        </div>
      ),
    },
    {
      header: 'Created',
      cell: ({ row }) =>
        row.original.createdAt ? (
          <span className="text-sm text-slate-600">
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
      header: 'Members',
      cell: ({ row }) => {
        const count = memberCount(row.original.id)
        return (
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onViewMembers(row.original)}>
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {count} {count === 1 ? 'member' : 'members'}
          </Button>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(row.original)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(row.original)}
            disabled={deletingId === row.original.id}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]
}

const editSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Valid email required'),
  mobile: z.string().optional(),
  branchId: z.string().optional(),
  status: z.string(),
})
type EditFormValues = z.infer<typeof editSchema>

function EditTrainerDialog({
  trainer,
  branches,
  onClose,
}: {
  trainer: ManagedUser | null
  branches: { id: number; branchName: string }[]
  onClose: () => void
}) {
  const update = useUpdateUser(trainer?.id ?? '')
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (trainer) {
      reset({
        firstName: trainer.firstName ?? '',
        lastName: trainer.lastName ?? '',
        email: trainer.email ?? '',
        mobile: trainer.mobile ?? '',
        branchId: trainer.branchId ? String(trainer.branchId) : '',
        status: trainer.status ?? 'Active',
      })
    }
  }, [trainer, reset])

  const onSubmit = (values: EditFormValues) => {
    if (!trainer) return
    update.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        email: values.email,
        mobile: values.mobile || undefined,
        branchId: values.branchId ? Number(values.branchId) : undefined,
        status: values.status,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={!!trainer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Trainer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input placeholder="Jane" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input placeholder="Doe" {...register('lastName')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="jane@business.com" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Mobile</Label>
            <Input placeholder="9876543210" {...register('mobile')} />
          </div>
          <div className="space-y-1.5">
            <Label>Branch</Label>
            <Select value={watch('branchId') || ''} onValueChange={(v) => setValue('branchId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a branch..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.branchName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export default function AdminTrainersPage() {
  const navigate = useNavigate()
  const { trainerRole, memberRole } = useRoles()
  const { data: trainers, isLoading, isError, refetch } = useUsersByRole(trainerRole?.id)
  const { data: members = [] } = useUsersByRole(memberRole?.id)
  const gymContext = useAuthStore((s) => s.gymContext)
  const { data: branches = [] } = useBranches(gymContext?.businessId)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewingTrainer, setViewingTrainer] = useState<ManagedUser | null>(null)
  const [editTrainer, setEditTrainer] = useState<ManagedUser | null>(null)
  const deleteUser = useDeleteUser()

  useEffect(() => {
    console.log('[AdminTrainersPage] trainers response:', trainers)
  }, [trainers])

  const membersByTrainer = useMemo(() => {
    const map = new Map<string, ManagedUser[]>()
    for (const m of members) {
      if (!m.trainerId) continue
      const key = String(m.trainerId)
      map.set(key, [...(map.get(key) ?? []), m])
    }
    return map
  }, [members])

  const branchName = (id: number | null) => branches.find((b) => b.id === id)?.branchName ?? '—'
  const memberCount = (trainerId: string) => membersByTrainer.get(trainerId)?.length ?? 0
  const columns = getColumns({
    branchName,
    memberCount,
    onViewMembers: setViewingTrainer,
    onView: (u) => navigate(`/admin/trainers/${u.id}`),
    onEdit: setEditTrainer,
    onDelete: (u) => deleteUser.mutate(u.id),
    deletingId: deleteUser.isPending ? (deleteUser.variables ?? null) : null,
  })

  return (
    <div className="-m-6 flex h-[calc(100%+3rem)] flex-col lg:-m-8 lg:h-[calc(100%+4rem)]">
      <div
        className="relative flex-1 overflow-auto bg-cover bg-center bg-fixed p-6"
        style={{
          backgroundImage: "linear-gradient(rgba(248,250,252,0.68), rgba(248,250,252,0.78)), url('/images/hero-ai.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <EntityListPage
            title="Trainers"
            description="Trainers within your business"
            columns={columns}
            data={trainers}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyMessage="No trainers yet. Add the first one."
            actions={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Trainer
              </Button>
            }
          />
        </div>
      </div>

      <CreateScopedUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        roleId={trainerRole?.id}
        roleLabel="Trainer"
        businessId={gymContext?.businessId ? Number(gymContext.businessId) : undefined}
        branchRequired
      />

      <TrainerMembersDialog
        open={!!viewingTrainer}
        onClose={() => setViewingTrainer(null)}
        trainer={viewingTrainer}
        members={viewingTrainer ? membersByTrainer.get(viewingTrainer.id) ?? [] : []}
      />

      <EditTrainerDialog trainer={editTrainer} branches={branches} onClose={() => setEditTrainer(null)} />
    </div>
  )
}
