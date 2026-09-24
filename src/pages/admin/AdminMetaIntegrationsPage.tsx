import { useState } from 'react'
import { useMetaLeadAds, useMetaLeadAdsMutation } from '@/hooks/useMetaLeadAds'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Megaphone, RefreshCw, Unplug } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function AdminMetaIntegrationsPage() {
  const { data, isLoading, isError } = useMetaLeadAds()
  const mutations = useMetaLeadAdsMutation()
  const [selectedPage, setSelectedPage] = useState('')

  const connect = async () => {
    try {
      const result = await mutations.connect.mutateAsync()
      window.location.assign(result.url)
    } catch {
      toast({ title: 'Meta connection failed', description: 'Check the server Meta configuration.', variant: 'destructive' })
    }
  }

  const selectPage = async () => {
    if (!selectedPage) return
    try {
      await mutations.selectPage.mutateAsync(selectedPage)
      toast({ title: 'Facebook Page connected' })
    } catch {
      toast({ title: 'Page connection failed', description: 'Meta could not subscribe this Page to lead events.', variant: 'destructive' })
    }
  }

  const sync = async () => {
    try {
      const result = await mutations.sync.mutateAsync(undefined)
      toast({ title: 'Sync complete', description: `${result.imported} new leads imported.` })
    } catch {
      toast({ title: 'Sync failed', description: 'Meta could not be synchronized right now.', variant: 'destructive' })
    }
  }

  return (
    <div className="relative -m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden lg:-m-8 lg:h-[calc(100%+4rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(248,250,252,0.78), rgba(248,250,252,0.86)), url('/images/meta-social-media.jpg')" }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 space-y-6 overflow-auto p-6">
        <Card className="border-white/70 bg-white/45 shadow-lg backdrop-blur-md">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Meta Lead Ads</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Receive Facebook and Instagram leads directly in GymOS Sales.</p>
            </div>
            {data?.status === 'connected' && <Badge variant="success">Connected</Badge>}
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? <div className="h-24 animate-pulse rounded-lg bg-muted" /> : isError ? (
              <p className="text-sm text-destructive">Meta connection needs attention.</p>
            ) : data?.status !== 'connected' ? (
              <div className="flex items-center justify-between rounded-lg border border-white/50 bg-white/30 p-4 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground">Connect Meta to automatically receive leads from your Facebook and Instagram Lead Ads.</p>
                <Button onClick={connect} disabled={mutations.connect.isPending}>Connect Meta</Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Facebook Page</p>
                    <p className="font-medium">{data.pages.find((page) => page.isActive)?.pageName ?? 'Select a Page'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Sync</p>
                    <p className="font-medium">{data.lastSyncAt ? new Date(data.lastSyncAt).toLocaleString() : 'Not synced yet'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-64 flex-1 space-y-1.5">
                    <label className="text-sm font-medium">Available Facebook Pages</label>
                    <Select value={selectedPage} onValueChange={setSelectedPage}>
                      <SelectTrigger><SelectValue placeholder="Choose a Page" /></SelectTrigger>
                      <SelectContent>{data.pages.map((page) => <SelectItem key={page.metaPageId} value={page.metaPageId}>{page.pageName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={selectPage} disabled={!selectedPage || mutations.selectPage.isPending}>Use Page</Button>
                  <Button variant="outline" onClick={sync} disabled={mutations.sync.isPending}><RefreshCw className="mr-2 h-4 w-4" />{mutations.sync.isPending ? 'Syncing...' : 'Sync Now'}</Button>
                  <Button variant="outline" onClick={() => mutations.disconnect.mutate()} disabled={mutations.disconnect.isPending}><Unplug className="mr-2 h-4 w-4" />Disconnect</Button>
                </div>
                <div className="border-t pt-4">
                  <h2 className="font-medium">Meta Lead Forms</h2>
                  {data.forms.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No Lead Ads forms were found for this Page.</p> : <div className="mt-3 grid gap-2 md:grid-cols-2">{data.forms.map((form) => <div key={form.metaFormId} className="flex items-center justify-between rounded-md border p-3 text-sm"><span>{form.name}</span><Badge variant="secondary">{form.status ?? 'Available'}</Badge></div>)}</div>}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
