import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserDetailCard } from '@/components/entity/UserDetailCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers'
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

function EditSubAdminDialog({
  user, branches, onClose,
}: {
  user: ManagedUser | null
  branches: { id: number; branchName: string }[]
  onClose: () => void
}) {
  const update = useUpdateUser(user?.id ?? '')
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        mobile: user.mobile ?? '',
        branchId: user.branchId ? String(user.branchId) : '',
        status: user.status ?? 'Active',
      })
    }
  }, [user, reset])

  const onSubmit = (values: EditFormValues) => {
    if (!user) return
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
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Sub-Admin</DialogTitle>
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

export default function AdminSubAdminDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useUser(id!)
  const gymContext = useAuthStore((s) => s.gymContext)
  const { data: branches = [] } = useBranches(gymContext?.businessId)
  const deleteUser = useDeleteUser()
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Sub-admin not found.</p>
      </div>
    )
  }

  const branchName = branches.find((b) => b.id === user.branchId)?.branchName

  return (
    <>
      <UserDetailCard
        user={user}
        roleLabel="Sub-Admin"
        branchLabel={branchName}
        onBack={() => navigate('/admin/sub-admins')}
        onEdit={() => setEditOpen(true)}
        onDelete={() =>
          deleteUser.mutate(user.id, { onSuccess: () => navigate('/admin/sub-admins') })
        }
        isDeleting={deleteUser.isPending}
      />
      <EditSubAdminDialog user={editOpen ? user : null} branches={branches} onClose={() => setEditOpen(false)} />
    </>
  )
}
