import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useExpiringMemberships } from '@/hooks/useMemberships'
import { getInitials, daysUntil } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export function ExpiringMembersList() {
  const { data, isLoading } = useExpiringMemberships(7)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-32 rounded-lg" />
              <div className="skeleton h-3 w-24 rounded-lg" />
            </div>
            <div className="skeleton h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  const members = (data as any[]) ?? []

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'rgba(34,197,94,0.12)' }}
        >
          <AlertCircle className="h-5 w-5 text-green-400" />
        </div>
        <p className="text-sm" style={{ color: '#64748B' }}>
          No memberships expiring this week
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((m: any) => {
        const days = daysUntil(m.expires_at)
        const isUrgent = days <= 2

        return (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
            }}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={m.avatar_url} />
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
              >
                {getInitials(m.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{m.full_name}</p>
              <p className="text-xs truncate" style={{ color: '#64748B' }}>{m.plan_name}</p>
            </div>

            <span
              className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={
                isUrgent
                  ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444' }
                  : { background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }
              }
            >
              {days === 0 ? 'Today' : `${days}d`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
