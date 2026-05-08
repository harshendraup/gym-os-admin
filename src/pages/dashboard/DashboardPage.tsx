import { StatCard } from '@/components/charts/StatCard'
import { Users, TrendingUp, UserCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { businessesApi } from '@/api/businesses.api'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { toast } from '@/hooks/use-toast'

type WithBusinessId = { businessId?: string | null; business_id?: string | null }
type LinkedBusinessUser = {
  id: string
  fullName?: string
  email?: string | null
  phone?: string | null
  isActive?: boolean
  lastLoginAt?: string | null
  role?: string | null
}

function resolveBusinessId(value?: WithBusinessId | null) {
  return value?.businessId ?? value?.business_id ?? null
}

function getAllLinkedUsers(linkedUsers: any): LinkedBusinessUser[] {
  if (!linkedUsers || typeof linkedUsers !== 'object') return []

  const buckets: LinkedBusinessUser[][] = []

  // New API shape: linkedUsers.byRole = { [role]: User[] }
  if (linkedUsers.byRole && typeof linkedUsers.byRole === 'object') {
    for (const value of Object.values(linkedUsers.byRole as Record<string, unknown>)) {
      if (Array.isArray(value)) buckets.push(value as LinkedBusinessUser[])
    }
  }

  // Backward-compatible shape: linkedUsers.admins, linkedUsers.members, etc.
  for (const value of Object.values(linkedUsers as Record<string, unknown>)) {
    if (Array.isArray(value)) buckets.push(value as LinkedBusinessUser[])
  }

  const merged = buckets.flat().filter((u) => u && typeof u === 'object')
  const seen = new Set<string>()

  return merged.filter((u) => {
    const key = u.id || `${u.email ?? ''}-${u.phone ?? ''}-${u.fullName ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user) as (WithBusinessId & { fullName?: string | null }) | null
  const context = useAuthStore((s) => s.gymContext) as WithBusinessId | null
  const role = useAuthStore((s) => (s.gymContext as { role?: string } | null)?.role)
  const qc = useQueryClient()
  const contextBusinessId = resolveBusinessId(context) ?? resolveBusinessId(user)
  const [addUserOpen, setAddUserOpen] = useState(false)

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 5 * 60_000,
  })
  const effectiveRole = (
    role ??
    ((me as unknown as { role?: string } | null)?.role ?? '')
  ).toLowerCase()
  const businessId = contextBusinessId ?? resolveBusinessId((me as unknown as WithBusinessId | null) ?? null)
  const canAddBusinessMember = !!businessId && ['admin', 'super_admin', 'sub_admin', 'gym_owner'].includes(effectiveRole)
  const { data: businessOverview, isLoading: isBusinessOverviewLoading } = useQuery({
    queryKey: ['admin', 'businesses', businessId, 'overview'],
    queryFn: () => businessesApi.overview(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  })
  const allLinkedUsers = businessOverview ? getAllLinkedUsers(businessOverview.linkedUsers) : []
  const [memberForm, setMemberForm] = useState({
    business_id: businessId ?? '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
  })

  useEffect(() => {
    setMemberForm((prev) => ({ ...prev, business_id: businessId ?? '' }))
  }, [businessId])

  const addBusinessUserMutation = useMutation({
    mutationFn: (payload: typeof memberForm) => api.post('/admin/business-admins', payload),
    onSuccess: () => {
      toast({ title: 'Business member added successfully' })
      setAddUserOpen(false)
      setMemberForm((prev) => ({
        ...prev,
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin',
      }))
      qc.invalidateQueries({ queryKey: ['admin', 'businesses', businessId, 'overview'] })
    },
    onError: (error: any) => {
      toast({
        title: error?.response?.data?.error?.message ?? 'Failed to add business member',
        variant: 'destructive',
      })
    },
  })

  const canSubmitMember =
    !!memberForm.business_id &&
    !!memberForm.name.trim() &&
    !!memberForm.email.trim() &&
    !!memberForm.phone.trim() &&
    !!memberForm.password.trim() &&
    !!memberForm.role.trim()

  return (
    <div className="space-y-8 animate-fade-in" style={{ background: 'linear-gradient(180deg, rgba(248,250,252,0.95), rgba(241,245,249,0.9))', borderRadius: '20px', padding: '16px' }}>
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(255,255,255,0.82)' }}>
        <div className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Business Overview</h2>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                This admin belongs to this business.
              </p>
            </div>
            {/* {canAddBusinessMember && (
              <Button
                onClick={() => setAddUserOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Business User
              </Button>
            )} */}
            <Button
              onClick={() => setAddUserOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Business User
            </Button>
          </div>
        </div>

        {!businessId && (
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            No `businessId` found for this admin. Please map this admin to a business first.
          </p>
        )}

        {businessId && isBusinessOverviewLoading && (
          <p className="text-sm" style={{ color: '#94A3B8' }}>Loading business overview...</p>
        )}

        {businessId && !isBusinessOverviewLoading && !businessOverview && (
          <p className="text-sm" style={{ color: '#FCA5A5' }}>
            Could not load business overview for <span className="font-mono">{businessId}</span>. Check admin permission for this endpoint.
          </p>
        )}

        {businessOverview && (
          <div className="space-y-5">
            <div
              className="rounded-2xl p-5"
              style={{
                border: '1px solid rgba(148,163,184,0.24)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {businessOverview.business.logoUrl ? (
                    <img
                      src={businessOverview.business.logoUrl}
                      alt={businessOverview.business.name}
                      className="h-14 w-14 rounded-xl object-cover border border-white/15"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                      No Logo
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-slate-900">{businessOverview.business.name}</h3>
                </div>
                <Badge variant={businessOverview.business.status === 'active' ? 'success' : 'warning'}>
                  {businessOverview.business.status}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <BusinessInfoItem label="Admin" value={user?.fullName ?? 'Admin'} />
                <BusinessInfoItem label="Business ID" value={businessOverview.business.id} mono />
                <BusinessInfoItem label="Business Key" value={businessOverview.business.businessKey ?? '—'} mono />
                <BusinessInfoItem label="Type" value={businessOverview.business.type} />
                <BusinessInfoItem label="Email" value={businessOverview.business.email || '—'} />
                <BusinessInfoItem label="Phone" value={businessOverview.business.phone || '—'} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard title="Total Users" value={businessOverview.summary.totalUsers} icon={<Users className="h-5 w-5" />} color="blue" />
              <StatCard title="Total Gyms" value={businessOverview.summary.totalGyms} icon={<TrendingUp className="h-5 w-5" />} color="amber" />
              <StatCard title="Gym Members" value={businessOverview.summary.totalGymMembers} icon={<UserCheck className="h-5 w-5" />} color="green" />
            </div>

            <div className="rounded-xl border border-white/10 p-3">
              <p className="mb-2 text-sm font-medium text-slate-900">Linked Business Users</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLinkedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-slate-400">No linked business users found.</TableCell>
                    </TableRow>
                  ) : (
                    allLinkedUsers.map((linkedUser) => (
                      <TableRow key={linkedUser.id}>
                        <TableCell className="text-slate-900">{linkedUser.fullName ?? '—'}</TableCell>
                        <TableCell className="text-slate-600">{linkedUser.email ?? '—'}</TableCell>
                        <TableCell className="text-slate-600">{linkedUser.phone ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={linkedUser.isActive ? 'success' : 'destructive'}>
                            {linkedUser.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-slate-600">
                          {typeof linkedUser.role === 'string' && linkedUser.role.trim().length > 0
                            ? linkedUser.role.replace(/_/g, ' ')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {linkedUser.lastLoginAt
                            ? new Date(linkedUser.lastLoginAt).toLocaleString('en-IN')
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent
          className="sm:max-w-lg"
          style={{
            background: 'rgba(255,255,255,0.98)',
            border: '1px solid rgba(148,163,184,0.28)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-slate-900">Add Business User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Business ID</Label>
              <Input value={memberForm.business_id} disabled />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Name</Label>
                <Input
                  value={memberForm.name}
                  onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="xyz abc"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Email</Label>
                <Input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="axyzabc@gmail.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Phone</Label>
                <Input
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Password</Label>
                <Input
                  value={memberForm.password}
                  onChange={(e) => setMemberForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="********"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Role</Label>
              <Input
                value={memberForm.role}
                onChange={(e) => setMemberForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Enter any role"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addBusinessUserMutation.mutate(memberForm)}
                disabled={!canSubmitMember || addBusinessUserMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {addBusinessUserMutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BusinessInfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: 'rgba(248,250,252,0.95)', border: '1px solid rgba(148,163,184,0.2)' }}
    >
      <p className="text-[11px] uppercase tracking-wide" style={{ color: '#94A3B8' }}>{label}</p>
      <p className={`mt-1 text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
