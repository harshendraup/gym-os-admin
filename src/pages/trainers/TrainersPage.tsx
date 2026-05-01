import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/api/client'
import { getInitials } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

function InviteTrainerDialog({ gymId, open, onClose }: { gymId: string; open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const qc = useQueryClient()

  const invite = useMutation({
    mutationFn: (data: any) => api.post(`/gyms/${gymId}/trainers`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainers', gymId] })
      toast({ title: 'Trainer invited' })
      onClose()
    },
    onError: () => toast({ title: 'Failed to invite trainer', variant: 'destructive' }),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Trainer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input placeholder="+91..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input placeholder="Priya Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => invite.mutate({ phone, fullName })} disabled={invite.isPending}>
            {invite.isPending ? 'Inviting...' : 'Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TrainersPage() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const [showInvite, setShowInvite] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['trainers', gymId],
    queryFn: () => api.get(`/gyms/${gymId}/trainers`),
    enabled: !!gymId,
  })

  const trainers = (data as any)?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Trainers" />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Trainers</h2>
            <p className="text-sm text-muted-foreground">{trainers.length} trainer{trainers.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowInvite(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Invite Trainer
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : trainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mb-3" />
            <p className="text-base font-medium">No trainers yet</p>
            <p className="text-sm mt-1">Invite your first trainer to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((trainer: any) => (
              <Card key={trainer.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={trainer.avatar_url} />
                      <AvatarFallback>{getInitials(trainer.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{trainer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{trainer.phone}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {trainer.metadata?.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trainer.metadata.specializations.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs capitalize">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{trainer.stats?.memberCount ?? 0} members</span>
                    <span>{trainer.metadata?.experience ?? 0}y exp</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <InviteTrainerDialog gymId={gymId} open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  )
}
