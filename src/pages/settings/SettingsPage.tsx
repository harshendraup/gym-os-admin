import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import { gymApi } from '@/api/gym.api'
import { toast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: () => gymApi.getProfile(gymId),
    enabled: !!gymId,
  })

  const { register, handleSubmit, reset } = useForm({ values: profile as any })

  const update = useMutation({
    mutationFn: (data: any) => gymApi.updateProfile(gymId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gym', gymId] })
      toast({ title: 'Settings saved' })
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Settings" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-2xl">
        <form onSubmit={handleSubmit((data) => update.mutate(data))}>
          <Card>
            <CardHeader>
              <CardTitle>Gym Profile</CardTitle>
              <CardDescription>Update your gym's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Gym Name</Label>
                  <Input {...register('name')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...register('phone')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input placeholder="https://..." {...register('website')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input {...register('address')} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input {...register('city')} />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input {...register('state')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pincode</Label>
                  <Input {...register('pincode')} />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Customize colors shown in the mobile app</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => update.mutate({ branding: data.branding }))}>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <input type="color" {...register('branding.primaryColor')} className="h-10 w-12 cursor-pointer rounded border" />
                    <Input {...register('branding.primaryColor')} className="font-mono uppercase" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <input type="color" {...register('branding.secondaryColor')} className="h-10 w-12 cursor-pointer rounded border" />
                    <Input {...register('branding.secondaryColor')} className="font-mono uppercase" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <input type="color" {...register('branding.accentColor')} className="h-10 w-12 cursor-pointer rounded border" />
                    <Input {...register('branding.accentColor')} className="font-mono uppercase" />
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" variant="outline" disabled={update.isPending}>Save Branding</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gym Code</CardTitle>
            <CardDescription>Members use this code to join your gym in the mobile app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="rounded-lg border bg-muted px-4 py-3 font-mono text-xl font-bold tracking-widest">
                {(profile as any)?.gymCode ?? '—'}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText((profile as any)?.gymCode ?? '')}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
