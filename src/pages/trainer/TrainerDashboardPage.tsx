import { Dumbbell, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceLogsApi } from '@/api/attendance-logs.api'
import { useTrainerMembers } from '@/hooks/useTrainerMembers'
import { useProgramAssignments } from '@/hooks/useProgramAssignments'
import { useTrainerSessions } from '@/hooks/useTrainerSessions'

export default function TrainerDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const gymContext = useAuthStore((state) => state.gymContext)
  const name = user?.fullName ?? user?.firstName ?? 'Trainer'
  const members = useTrainerMembers({ page: 1, perPage: 100 })
  const assignments = useProgramAssignments()
  const sessions = useTrainerSessions()
  const attendance = useQuery({ queryKey: ['trainer-dashboard-attendance'], queryFn: attendanceLogsApi.list, staleTime: 30_000 })
  const today = new Date().toISOString().slice(0, 10)
  const todayAttendance = attendance.data?.filter((log) => log.checkInAt.slice(0, 10) === today).length ?? 0
  const upcomingSessions = sessions.data?.filter((session) => session.status === 'scheduled' && session.startsAt >= new Date().toISOString()).slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Trainer workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome, {name}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Your coaching workspace is ready. Trainer modules will appear here as they are enabled.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            Trainer dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                Role
              </div>
              <p className="mt-2 text-lg font-semibold">Trainer</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm font-medium text-muted-foreground">Branch</div>
              <p className="mt-2 text-lg font-semibold">{gymContext?.branchId ?? 'Not assigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="My Members" value={String(members.data?.meta?.total ?? members.data?.data.length ?? 0)} />
        <MetricCard label="Today's Attendance" value={String(todayAttendance)} />
        <MetricCard label="Active Workouts" value={String(assignments.data?.filter((assignment) => assignment.status === 'active').length ?? 0)} />
        <MetricCard label="Upcoming Sessions" value={String(upcomingSessions.length)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Upcoming Sessions</CardTitle></CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p> : <div className="space-y-2">{upcomingSessions.map((session) => <div key={session.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{session.sessionType}</p><p className="text-xs text-muted-foreground">{new Date(session.startsAt).toLocaleString()} · Member #{session.memberId}</p></div><Badge variant="secondary">{session.status}</Badge></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>
}