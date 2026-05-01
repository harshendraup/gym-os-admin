import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/api/client'
import { toast } from '@/hooks/use-toast'

function BroadcastDialog({ gymId, open, onClose }: { gymId: string; open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const qc = useQueryClient()

  const broadcast = useMutation({
    mutationFn: () => api.post(`/gyms/${gymId}/notifications/broadcast`, { title, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', gymId] })
      toast({ title: 'Broadcast sent' })
      setTitle('')
      setBody('')
      onClose()
    },
    onError: () => toast({ title: 'Failed to send broadcast', variant: 'destructive' }),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Broadcast Notification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Message *</Label>
            <textarea
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => broadcast.mutate()}
            disabled={!title || !body || broadcast.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {broadcast.isPending ? 'Sending...' : 'Send to All Members'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function NotificationsPage() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const [showBroadcast, setShowBroadcast] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', gymId],
    queryFn: () => api.get(`/gyms/${gymId}/notifications`),
    enabled: !!gymId,
  })

  const notifications = (data as any)?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Notifications" />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Recent activity and announcements</p>
          </div>
          <Button onClick={() => setShowBroadcast(true)} className="gap-2">
            <Send className="h-4 w-4" />
            Broadcast
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-4 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-48 rounded bg-muted" />
                      <div className="h-3 w-64 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n: any) => (
                  <div key={n.id} className="flex items-start gap-3 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.is_read && <Badge variant="info" className="text-xs">New</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BroadcastDialog gymId={gymId} open={showBroadcast} onClose={() => setShowBroadcast(false)} />
    </div>
  )
}
