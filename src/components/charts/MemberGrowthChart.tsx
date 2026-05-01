import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemberGrowth } from '@/hooks/useAnalytics'

interface MemberGrowthPoint {
  month: string
  newMembers: number
  [key: string]: unknown
}

interface MemberGrowthChartProps {
  data?: MemberGrowthPoint[]
}

export function MemberGrowthChart({ data: propData }: MemberGrowthChartProps) {
  const { data: fetchedData, isLoading } = useMemberGrowth()

  if (!propData && isLoading) {
    return <div className="skeleton h-56 w-full rounded-xl" />
  }

  const chartData = (propData ?? fetchedData ?? []) as MemberGrowthPoint[]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#64748B' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748B' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(17,24,39,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: 13,
          }}
          labelStyle={{ color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}
          cursor={{ stroke: 'rgba(34,197,94,0.2)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="newMembers"
          name="New Members"
          stroke="#22C55E"
          strokeWidth={2.5}
          fill="url(#growthGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#22C55E', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
