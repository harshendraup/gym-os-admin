import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { MemberGrowthChart } from '@/components/charts/MemberGrowthChart'
import { useAttendanceHeatmap } from '@/hooks/useAnalytics'

function AttendanceHeatmap() {
  const { data, isLoading } = useAttendanceHeatmap()
  const points = (data as any[]) ?? []

  const maxCount = Math.max(...points.map((p: any) => p.count), 1)

  const getColor = (count: number) => {
    const ratio = count / maxCount
    if (ratio === 0) return 'bg-muted'
    if (ratio < 0.25) return 'bg-green-200'
    if (ratio < 0.5) return 'bg-green-400'
    if (ratio < 0.75) return 'bg-green-600'
    return 'bg-green-800'
  }

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded bg-muted" />
  }

  return (
    <div className="flex flex-wrap gap-1">
      {points.map((p: any) => (
        <div
          key={p.date}
          title={`${p.date}: ${p.count} check-ins`}
          className={`h-3 w-3 rounded-sm ${getColor(p.count)}`}
        />
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue (Last 12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberGrowthChart />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Heatmap (Last 90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceHeatmap />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
