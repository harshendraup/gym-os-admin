import { Badge } from '@/components/ui/badge'

type Status = 'active' | 'inactive' | 'suspended' | 'pending' | 'expired'

const statusConfig: Record<Status, { label: string; variant: 'success' | 'destructive' | 'warning' | 'secondary' | 'info' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  suspended: { label: 'Suspended', variant: 'destructive' },
  pending: { label: 'Pending', variant: 'warning' },
  expired: { label: 'Expired', variant: 'warning' },
}

export function MemberStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? { label: status, variant: 'secondary' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
