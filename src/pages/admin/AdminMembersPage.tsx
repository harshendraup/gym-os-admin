import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2, Eye, Pencil, Mail, Phone, Building2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { CreateScopedUserDialog } from '@/components/entity/CreateScopedUserDialog'
import { useRoles } from '@/hooks/useRoles'
import { useUsersByRole, useDeleteUser, useUpdateUser } from '@/hooks/useUsers'
import { useBranches } from '@/hooks/useBranches'
import { useAuthStore } from '@/store/auth.store'
import type { ManagedUser } from '@/api/user-management.api'
import { getRandomPageBackground } from '@/data/pageBackgrounds'

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = (status || '').toLowerCase()
  const variant = normalized === 'active' ? 'success' : normalized === 'inactive' ? 'secondary' : 'outline'
  return <Badge variant={variant as any}>{status || 'Unknown'}</Badge>
}

function getColumns({
  branchName,
  onView,
  onEdit,
  onDelete,
  deletingId,
}: {
  branchName: (id: number | null) => string
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

function EditMemberDialog({
  member,
  branches,
  onClose,
}: {
  member: ManagedUser | null
  branches: { id: number; branchName: string }[]
  onClose: () => void
}) {
  const update = useUpdateUser(member?.id ?? '')
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (member) {
      reset({
        firstName: member.firstName ?? '',
        lastName: member.lastName ?? '',
        email: member.email ?? '',
        mobile: member.mobile ?? '',
        branchId: member.branchId ? String(member.branchId) : '',
        status: member.status ?? 'Active',
      })
    }
  }, [member, reset])

  const onSubmit = (values: EditFormValues) => {
    if (!member) return
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
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
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

export default function AdminMembersPage() {
  const navigate = useNavigate()
  const { memberRole } = useRoles()
  const { data: members, isLoading, isError, refetch } = useUsersByRole(memberRole?.id)
  const gymContext = useAuthStore((s) => s.gymContext)
  const [backgroundImage] = useState(getRandomPageBackground)
  const { data: branches = [] } = useBranches(gymContext?.businessId)
  const [createOpen, setCreateOpen] = useState(false)
  const [editMember, setEditMember] = useState<ManagedUser | null>(null)
  const deleteUser = useDeleteUser()

  useEffect(() => {
    console.log('[AdminMembersPage] members response:', members)
  }, [members])

  const branchName = (id: number | null) => branches.find((b) => b.id === id)?.branchName ?? '—'
  const columns = getColumns({
    branchName,
    onView: (u) => navigate(`/admin/members/${u.id}`),
    onEdit: setEditMember,
    onDelete: (u) => deleteUser.mutate(u.id),
    deletingId: deleteUser.isPending ? (deleteUser.variables ?? null) : null,
  })

  return (
    <div className="relative -m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden lg:-m-8 lg:h-[calc(100%+4rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(248,250,252,0.78), rgba(248,250,252,0.86)), url('${backgroundImage}')` }}
        aria-hidden="true"
      />
      {/* <Header title="Members" /> */}
      <div className="relative z-10 flex-1 overflow-auto p-6">
        <EntityListPage
          title="Members"
          description="Members across your business's branches"
          columns={columns}
          data={members}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyMessage="No members yet. Add the first one."
          actions={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Member
            </Button>
          }
        />
      </div>

      <CreateScopedUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        roleId={memberRole?.id}
        roleLabel="Member"
        businessId={gymContext?.businessId ? Number(gymContext.businessId) : undefined}
        branchRequired
      />
      <EditMemberDialog member={editMember} branches={branches} onClose={() => setEditMember(null)} />
    </div>
  )
}
