import { useEffect, useState } from 'react'
import { useTrainerProfile, useUpdateTrainerProfile } from '@/hooks/useTrainerProfile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserRound } from 'lucide-react'

export default function TrainerProfilePage() {
  const { data, isLoading, isError } = useTrainerProfile()
  const user = data?.user
  const update = useUpdateTrainerProfile()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', mobile: '' })

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email ?? '', mobile: user.mobile ?? '' })
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Trainer profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserRound className="h-5 w-5 text-primary" />
            Profile details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="h-32 animate-pulse rounded-lg bg-muted" />}
          {isError && <p className="text-sm text-destructive">Unable to load your profile.</p>}
          {user && (
            <>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); update.mutate({ firstName: form.firstName, lastName: form.lastName || undefined, email: form.email || undefined, mobile: form.mobile || undefined }) }}>
              <label className="text-sm text-muted-foreground">First name<Input className="mt-1 text-foreground" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
              <label className="text-sm text-muted-foreground">Last name<Input className="mt-1 text-foreground" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
              <label className="text-sm text-muted-foreground">Email<Input className="mt-1 text-foreground" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label className="text-sm text-muted-foreground">Mobile<Input className="mt-1 text-foreground" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
              <div className="sm:col-span-2"><Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save profile'}</Button></div>
            </form>
            <dl className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
              <div><dt className="text-sm text-muted-foreground">Name</dt><dd className="mt-1 font-medium">{user.fullName ?? user.firstName}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Status</dt><dd className="mt-1"><Badge variant={user.status === 'Active' ? 'success' : 'secondary'}>{user.status}</Badge></dd></div>
              <div><dt className="text-sm text-muted-foreground">Business</dt><dd className="mt-1 font-medium">{user.businessId ?? '—'}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Branch</dt><dd className="mt-1 font-medium">{user.branchId ?? '—'}</dd></div>
            </dl>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}