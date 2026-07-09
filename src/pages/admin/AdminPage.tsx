import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { api } from '@/api/client'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, X } from 'lucide-react'

function PlatformStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'platform'],
    queryFn: () => api.get('/admin/analytics/platform'),
  })
  const stats = (data as any) ?? {}
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[
        { label: 'Total Gyms', value: stats.totalGyms },
        { label: 'Active Gyms', value: stats.activeGyms },
        { label: 'Total Members', value: stats.totalMembers?.toLocaleString() },
        { label: 'MRR', value: formatCurrency(stats.mrr ?? 0) },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value ?? '—'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CreateGymOwnerModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', gymId: '' })

  const { data: gymsData } = useQuery({
    queryKey: ['admin', 'gyms-list'],
    queryFn: () => api.get('/admin/gyms?limit=100'),
  })
  const gyms = (gymsData as any) ?? []

  const create = useMutation({
    mutationFn: () => api.post('/admin/gym-owners', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'gym-owners'] })
      toast({
        title: 'Gym owner created',
        description: `${form.fullName} can now log in with their email & password`,
      })
      onClose()
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.response?.data?.error?.message ?? 'Something went wrong',
        variant: 'destructive',
      })
    },
  })

  const field = (label: string, key: keyof typeof form, type: string, placeholder: string) => (
    <div className="space-y-1">
      <label className="text-sm text-slate-400">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Gym Owner</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        {field('Full Name', 'fullName', 'text', 'Rajesh Kumar')}
        {field('Email', 'email', 'email', 'rajesh@hulkgym.com')}
        {field('Password', 'password', 'password', 'Min 6 characters')}

        <div className="space-y-1">
          <label className="text-sm text-slate-400">Assign to Gym</label>
          <select
            value={form.gymId}
            onChange={(e) => setForm((f) => ({ ...f, gymId: e.target.value }))}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="">Select a gym...</option>
            {gyms.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <Button
          className="w-full"
          disabled={!form.fullName || !form.email || !form.password || !form.gymId || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? 'Creating...' : 'Create Gym Owner'}
        </Button>
      </div>
    </div>
  )
}

function GymOwnersTable() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'gym-owners'],
    queryFn: () => api.get('/admin/gym-owners?limit=50'),
  })
  const owners = (data as any)?.data ?? []

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/admin/gym-owners/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'gym-owners'] })
      toast({ title: 'Gym owner removed' })
    },
  })

  return (
    <>
      {showCreate && <CreateGymOwnerModal onClose={() => setShowCreate(false)} />}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Gym Owners (Sub Admins)</CardTitle>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Gym Owner
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-32 animate-pulse bg-muted" />
          ) : owners.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No gym owners yet. Click "Add Gym Owner" to create one.
            </p>
          ) : (
            <div className="divide-y">
              {owners.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{o.full_name}</p>
                    <p className="text-xs text-muted-foreground">{o.email} · {o.gym_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={o.is_active ? 'success' : 'secondary'}>
                      {o.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove.mutate(o.id)}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function CreateGymModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', state: '' })

  const create = useMutation({
    mutationFn: () => api.post('/admin/gyms', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'gyms'] })
      qc.invalidateQueries({ queryKey: ['admin', 'gyms-list'] })
      toast({ title: 'Gym created', description: `${form.name} is ready. Now add a gym owner for it.` })
      onClose()
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.error?.message ?? 'Something went wrong', variant: 'destructive' })
    },
  })

  const field = (label: string, key: keyof typeof form, placeholder: string, required = false) => (
    <div className="space-y-1">
      <label className="text-sm text-slate-400">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add New Gym</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        {field('Gym Name', 'name', 'Hulk GYM', true)}
        {field('Email', 'email', 'info@hulkgym.com')}
        {field('Phone', 'phone', '9876543210')}
        {field('City', 'city', 'Udaipur')}
        {field('State', 'state', 'Rajasthan')}
        <Button
          className="w-full"
          disabled={!form.name || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? 'Creating...' : 'Create Gym'}
        </Button>
      </div>
    </div>
  )
}

function GymsTable() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'gyms'],
    queryFn: () => api.get('/admin/gyms?limit=20'),
  })
  const verify = useMutation({
    mutationFn: (gymId: string) => api.put(`/admin/gyms/${gymId}/verify`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'gyms'] }); toast({ title: 'Gym verified' }) },
  })
  const updateStatus = useMutation({
    mutationFn: ({ gymId, status }: { gymId: string; status: string }) =>
      api.put(`/admin/gyms/${gymId}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'gyms'] }); toast({ title: 'Status updated' }) },
  })
  const gyms = (data as any) ?? []

  return (
    <>
      {showCreate && <CreateGymModal onClose={() => setShowCreate(false)} />}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">All Gyms</CardTitle>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Gym
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-32 animate-pulse bg-muted" />
          ) : gyms.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No gyms yet. Click "Add Gym" to create one.
            </p>
          ) : (
            <div className="divide-y">
              {gyms.map((gym: any) => (
                <div key={gym.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{gym.name}</p>
                    <p className="text-xs text-muted-foreground">{gym.city}, {gym.state} · {gym.gym_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={gym.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                      {gym.status}
                    </Badge>
                    {!gym.is_verified && (
                      <Button size="sm" variant="outline" onClick={() => verify.mutate(gym.id)}>Verify</Button>
                    )}
                    {gym.status === 'active' ? (
                      <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ gymId: gym.id, status: 'suspended' })}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ gymId: gym.id, status: 'active' })}>
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Platform Admin" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <PlatformStats />
        <GymOwnersTable />
        <GymsTable />
      </div>
    </div>
  )
}
