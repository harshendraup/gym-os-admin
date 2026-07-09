import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { RevenueChartPoint } from '@/api/analytics.api'
import { format, parseISO } from 'date-fns'
import { useRevenueChart } from '@/hooks/useAnalytics'

interface RevenueChartProps {
  data?: RevenueChartPoint[]
}

export function RevenueChart({ data: propData }: RevenueChartProps) {
  const { data: fetchedData, isLoading } = useRevenueChart()

  if (!propData && isLoading) {
    return <div className="h-[220px] w-full rounded-xl animate-pulse bg-muted" />
  }

  const chartData = (propData ?? fetchedData ?? []).map((d) => ({
    month: format(parseISO(`${d.month}-01`), 'MMM'),
    revenue: d.revenue / 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
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
          formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
          cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3B82F6"
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
