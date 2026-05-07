import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { api } from '@/api/client'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { Search, Shield, UserCog, Users } from 'lucide-react'

type UserRole = 'super_admin' | 'admin' | 'gym_owner' | 'trainer' | 'member' | string

type AdminUser = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  role: UserRole
  business_id: string | null
  gym_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type UsersResponse = {
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
    firstPageUrl: string
    lastPageUrl: string
    nextPageUrl: string | null
    previousPageUrl: string | null
  }
  data: AdminUser[]
}

type UpdateBusinessAdminPayload = {
  business_id: string
  name: string
  email: string
  phone: string
  password: string
  role: string
}

const ROLE_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  super_admin: 'destructive',
  admin: 'default',
  gym_owner: 'secondary',
  trainer: 'outline',
  member: 'secondary',
}

const ROLE_OPTIONS = ['all', 'super_admin', 'admin', 'gym_owner', 'trainer', 'member']
const EDIT_ROLE_OPTIONS = ['super_admin', 'admin', 'gym_owner', 'trainer', 'member']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function roleLabel(role: string) {
  return role.replace('_', ' ')
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [form, setForm] = useState<UpdateBusinessAdminPayload>({
    business_id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
  })

  const updateUser = useMutation({
    mutationFn: (payload: UpdateBusinessAdminPayload) => api.put(`/admin/business-admins/${user?.id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast({ title: 'User updated successfully' })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update user',
        description: error?.response?.data?.message ?? 'Please check input values and try again.',
        variant: 'destructive',
      })
    },
  })

  const hydrateForm = (nextUser: AdminUser | null) => {
    if (!nextUser) return
    setForm({
      business_id: nextUser.business_id ?? '',
      name: nextUser.full_name ?? '',
      email: nextUser.email ?? '',
      phone: nextUser.phone ?? '',
      password: '',
      role: nextUser.role ?? 'admin',
    })
    setConfirmPassword('')
    setShowPassword(false)
  }

  useEffect(() => {
    if (open) hydrateForm(user)
  }, [open, user])

  const passwordMismatch = !!form.password && form.password !== confirmPassword

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user profile details.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Rahul yadav"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="rahul@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+919666543210"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {!EDIT_ROLE_OPTIONS.includes(form.role) && form.role && (
                  <SelectItem value={form.role}>{form.role}</SelectItem>
                )}
                {EDIT_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Password (optional)</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter new password to change"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Confirm Password</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            {passwordMismatch && (
              <p className="text-xs text-red-600">Password and confirm password must match.</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => updateUser.mutate(form)}
            disabled={!form.name || !form.email || !form.phone || !form.role || passwordMismatch || updateUser.isPending}
          >
            {updateUser.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const deactivate = useMutation({
    mutationFn: () => api.del(`/admin/business-admins/${user?.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast({ title: 'User deactivated successfully' })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to deactivate user',
        description: error?.response?.data?.message ?? 'Please try again.',
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate User</DialogTitle>
          <DialogDescription>
            This action will deactivate the selected user account.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border p-3 text-sm">
          <p><strong>Name:</strong> {user?.full_name}</p>
          <p><strong>Email:</strong> {user?.email || '—'}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => deactivate.mutate()}
            disabled={deactivate.isPending}
          >
            {deactivate.isPending ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<UsersResponse>('/admin/users'),
  })

  const users = data?.data ?? []
  const meta = data?.meta

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesSearch =
        !q ||
        user.full_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [users, search, roleFilter])

  const activeCount = users.filter((u) => u.is_active).length
  const adminsCount = users.filter((u) => u.role === 'admin').length

  return (
    <div className="flex h-full flex-col">
      <Header title="Users" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" /> Total Users
            </div>
            <p className="text-2xl font-semibold">{meta?.total ?? users.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" /> Active Users
            </div>
            <p className="text-2xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <UserCog className="h-4 w-4" /> Admins
            </div>
            <p className="text-2xl font-semibold">{adminsCount}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">User Directory</h2>
              <p className="text-sm text-muted-foreground">
                Manage users by role and perform edit/deactivate actions.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search name, email, phone, id"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Role filter" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role === 'all' ? 'All roles' : roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 rounded-lg border">
            {isLoading ? (
              <div className="h-40 animate-pulse rounded-lg bg-muted" />
            ) : isError ? (
              <div className="p-6 text-sm text-red-600">Failed to load users.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Gym ID</TableHead>
                    <TableHead>Business ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell className="h-20 text-center text-muted-foreground" colSpan={9}>
                        No users match current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                        <TableCell>{user.phone || '—'}</TableCell>
                        <TableCell>{user.email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={ROLE_BADGE[user.role] ?? 'outline'}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{user.gym_id || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{user.business_id || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {user.role === 'super_admin' ? (
                            <span className="text-xs text-muted-foreground">Not allowed</span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setEditTarget(user)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteTarget(user)}
                              >
                                Deactivate
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <EditUserDialog user={editTarget} open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
      <DeactivateUserDialog
        user={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  )
}
