import { useState } from 'react'
import { QrCode, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/Header'
import { useTodayAttendance, useBranchQr } from '@/hooks/useAttendance'
import { useAuthStore } from '@/store/auth.store'
import { getInitials } from '@/lib/utils'

function QrPanel({ gymId }: { gymId: string }) {
  const defaultBranchId = useAuthStore((s) => s.gymContext?.branchId ?? '')
  const { data: qr, isLoading } = useBranchQr(defaultBranchId)

  if (!defaultBranchId) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="h-4 w-4" />
          Branch QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="h-48 w-48 animate-pulse rounded-lg bg-muted" />
        ) : qr ? (
          <img src={(qr as any).qrImageUrl} alt="QR Code" className="h-48 w-48 rounded-lg border" />
        ) : null}
        <p className="text-xs text-muted-foreground text-center">Members scan this QR code to check in</p>
      </CardContent>
    </Card>
  )
}

export default function AttendancePage() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const { data, isLoading, refetch } = useTodayAttendance()
  const records = (data as any[]) ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Attendance" />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Today's Check-ins</h2>
            <p className="text-sm text-muted-foreground">{records.length} members checked in</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-0 divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                        <div className="h-9 w-9 rounded-full bg-muted" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 w-32 rounded bg-muted" />
                          <div className="h-3 w-24 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p className="text-sm">No check-ins yet today</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {records.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 p-4">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.avatar_url} />
                          <AvatarFallback className="text-xs">{getInitials(r.full_name ?? 'M')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{r.full_name}</p>
                          <p className="text-xs text-muted-foreground">{r.member_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                          <Badge variant={r.check_in_method === 'qr' ? 'info' : 'secondary'} className="text-xs">
                            {r.check_in_method === 'qr' ? 'QR' : 'Manual'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <QrPanel gymId={gymId} />
          </div>
        </div>
      </div>
    </div>
  )
}
