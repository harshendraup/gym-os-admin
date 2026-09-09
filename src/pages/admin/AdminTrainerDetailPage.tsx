import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users } from 'lucide-react'
import { UserDetailCard } from '@/components/entity/UserDetailCard'
import { TrainerMembersDialog } from '@/components/entity/TrainerMembersDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useUser, useUpdateUser, useDeleteUser, useUsersByRole } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useBranches } from '@/hooks/useBranches'
import { useAuthStore } from '@/store/auth.store'
import type { ManagedUser } from '@/api/user-management.api'

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
  trainer, branches, onClose,
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

export default function AdminTrainerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: trainer, isLoading } = useUser(id!)
  const gymContext = useAuthStore((s) => s.gymContext)
  const { data: branches = [] } = useBranches(gymContext?.businessId)
  const { memberRole } = useRoles()
  const { data: members = [] } = useUsersByRole(memberRole?.id)
  const deleteUser = useDeleteUser()
  const [editOpen, setEditOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Trainer not found.</p>
      </div>
    )
  }

  const branchName = branches.find((b) => b.id === trainer.branchId)?.branchName
  const assignedMembers = members.filter((m) => String(m.trainerId) === trainer.id)

  return (
    <div className="space-y-4">
      <UserDetailCard
        user={trainer}
        roleLabel="Trainer"
        branchLabel={branchName}
        onBack={() => navigate('/admin/trainers')}
        onEdit={() => setEditOpen(true)}
        onDelete={() =>
          deleteUser.mutate(trainer.id, { onSuccess: () => navigate('/admin/trainers') })
        }
        isDeleting={deleteUser.isPending}
      />

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Members</p>
              <p className="text-sm text-slate-900">{assignedMembers.length} {assignedMembers.length === 1 ? 'member' : 'members'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMembersOpen(true)}>
            View Members
          </Button>
        </CardContent>
      </Card>

      <EditTrainerDialog trainer={editOpen ? trainer : null} branches={branches} onClose={() => setEditOpen(false)} />
      <TrainerMembersDialog
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        trainer={trainer}
        members={assignedMembers}
      />
    </div>
  )
}
