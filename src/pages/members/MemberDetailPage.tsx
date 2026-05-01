import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/Header'
import { useMember, useMemberStats } from '@/hooks/useMembers'
import { useMemberSubscriptions } from '@/hooks/useMemberships'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { getInitials, formatCurrency, daysUntil } from '@/lib/utils'

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: member, isLoading } = useMember(id!)
  const { data: stats } = useMemberStats(id!)
  const { data: subscriptions } = useMemberSubscriptions(id!)

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="p-6 space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (!member) return null

  const activeSub = (subscriptions as any[])?.find((s: any) => s.status === 'active' || s.status === 'grace_period')

  return (
    <div className="flex flex-col h-full">
      <Header />

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={(member as any).avatar_url} />
                <AvatarFallback className="text-lg">{getInitials((member as any).full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold">{(member as any).full_name}</h2>
                  <MemberStatusBadge status={(member as any).status} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{(member as any).member_code}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {(member as any).phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{(member as any).phone}</span>
                  )}
                  {(member as any).email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{(member as any).email}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Visits', value: (stats as any)?.totalVisits ?? 0 },
            { label: 'This Month', value: (stats as any)?.thisMonthVisits ?? 0 },
            { label: 'Streak', value: `${(stats as any)?.currentStreak ?? 0}d` },
            { label: 'Since', value: (member as any).join_date ? new Date((member as any).join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold mt-0.5">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeSub && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{activeSub.plan_name}</span>
                <Badge variant={activeSub.status === 'active' ? 'success' : 'warning'} className="capitalize">{activeSub.status}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Expires: {new Date(activeSub.expires_at).toLocaleDateString('en-IN')}</span>
                <span>{daysUntil(activeSub.expires_at)} days left</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (daysUntil(activeSub.expires_at) / 30) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">Paid: {formatCurrency(activeSub.amount_paid)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
