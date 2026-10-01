import { useState } from 'react'
import { Activity, CalendarClock, CalendarPlus, ClipboardCheck, Dumbbell, Eye, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { useProgramAssignments } from '@/hooks/useProgramAssignments'
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms'
import {
  useCreateFitnessAssessment,
  useFitnessAssessments,
  useRescheduleWorkoutSession,
  useScheduleWorkoutSession,
  useWorkoutProgressSummary,
  useWorkoutSessionsForMember,
} from '@/hooks/useWorkoutTracking'
import type {
  AssessmentLevel,
  FitnessAssessmentRecord,
  WorkoutSessionRecord,
  WorkoutSessionStatus,
} from '@/api/workout-tracking.api'
import { FITNESS_LEVELS as LEVELS } from '../constants'

function statusLabel(status: WorkoutSessionStatus) {
  return status.replace(/_/g, ' ')
}

function statusStyle(status: WorkoutSessionStatus) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700'
  if (status === 'partially_completed') return 'bg-amber-50 text-amber-700'
  if (status === 'skipped' || status === 'missed') return 'bg-rose-50 text-rose-700'
  if (status === 'in_progress') return 'bg-sky-50 text-sky-700'
  return 'bg-slate-100 text-slate-600'
}

function durationLabel(seconds: number | null) {
  if (!seconds) return null
  const minutes = Math.round(seconds / 60)
  return `${minutes} min`
}

function AssessmentDialog({
  memberId,
  open,
  onClose,
}: {
  memberId: number
  open: boolean
  onClose: () => void
}) {
  const create = useCreateFitnessAssessment(memberId)
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().slice(0, 10))
  const [assessmentType, setAssessmentType] = useState('Periodic review')
  const [strengthLevel, setStrengthLevel] = useState('')
  const [cardioLevel, setCardioLevel] = useState('')
  const [mobilityLevel, setMobilityLevel] = useState('')
  const [overallFitnessLevel, setOverallFitnessLevel] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [notes, setNotes] = useState('')

  const submit = () => {
    create.mutate({
      assessmentDate,
      assessmentType: assessmentType || undefined,
      strengthLevel: strengthLevel as AssessmentLevel || undefined,
      cardioLevel: cardioLevel as AssessmentLevel || undefined,
      mobilityLevel: mobilityLevel as AssessmentLevel || undefined,
      overallFitnessLevel: overallFitnessLevel as AssessmentLevel || undefined,
      recommendations: recommendations || undefined,
      notes: notes || undefined,
    }, { onSuccess: onClose })
  }

  const levelSelect = (label: string, value: string, setValue: (value: string) => void) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger><SelectValue placeholder="Not assessed" /></SelectTrigger>
        <SelectContent>{LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record Fitness Assessment</DialogTitle>
          <DialogDescription>This creates a dated assessment record and does not change the member profile.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={assessmentDate} onChange={(event) => setAssessmentDate(event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Assessment type</Label><Input value={assessmentType} onChange={(event) => setAssessmentType(event.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {levelSelect('Strength', strengthLevel, setStrengthLevel)}
            {levelSelect('Cardio', cardioLevel, setCardioLevel)}
            {levelSelect('Mobility', mobilityLevel, setMobilityLevel)}
            {levelSelect('Overall', overallFitnessLevel, setOverallFitnessLevel)}
          </div>
          <div className="space-y-1.5"><Label>Recommendations</Label><Input value={recommendations} onChange={(event) => setRecommendations(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !assessmentDate}>{create.isPending ? 'Saving...' : 'Record Assessment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SessionDetail({ session, onClose }: { session: WorkoutSessionRecord | null; onClose: () => void }) {
  return (
    <Dialog open={!!session} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {session && <>
          <DialogHeader>
            <DialogTitle>{session.programDayName ?? `Workout day ${session.programDayId}`}</DialogTitle>
            <DialogDescription>{session.programName ?? 'Assigned program'} · {formatDate(session.scheduledDate)}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className={statusStyle(session.status)}>{statusLabel(session.status)}</Badge>
            {durationLabel(session.durationSeconds) && <span className="text-sm text-muted-foreground">{durationLabel(session.durationSeconds)}</span>}
          </div>
          <div className="divide-y">
            {session.exercises.map((exercise) => (
              <section key={exercise.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-medium">{exercise.exerciseName ?? `Exercise ${exercise.exerciseId}`}</h4>
                  <span className="text-xs capitalize text-muted-foreground">{statusLabel(exercise.status)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Planned: {[exercise.targetSets && `${exercise.targetSets} sets`, exercise.targetReps && `${exercise.targetReps} reps`, exercise.targetWeight].filter(Boolean).join(' · ') || 'No target recorded'}
                </p>
                {exercise.sets.length > 0 ? (
                  <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {exercise.sets.map((set) => (
                      <p key={set.id} className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-700">
                        Set {set.setNumber}: {set.actualWeight ? `${set.actualWeight} kg × ` : ''}{set.actualReps ?? '—'} reps{set.durationSeconds ? ` · ${Math.round(set.durationSeconds / 60)} min` : ''} · {set.status}
                      </p>
                    ))}
                  </div>
                ) : <p className="mt-2 text-xs text-muted-foreground">No set performance recorded.</p>}
                {exercise.memberNotes && <p className="mt-2 text-xs text-slate-600">Member: {exercise.memberNotes}</p>}
                {exercise.trainerNotes && <p className="mt-1 text-xs text-slate-600">Trainer: {exercise.trainerNotes}</p>}
              </section>
            ))}
          </div>
          {session.trainerNotes && <p className="border-t pt-3 text-sm text-slate-600">Trainer notes: {session.trainerNotes}</p>}
        </>}
      </DialogContent>
    </Dialog>
  )
}

function AssessmentRow({ assessment }: { assessment: FitnessAssessmentRecord }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-slate-100 py-3 sm:grid-cols-[120px_1fr]">
      <div className="text-xs font-medium text-slate-500">{formatDate(assessment.assessmentDate)}</div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{assessment.overallFitnessLevel ?? 'Level not recorded'}</span>
          {assessment.assessmentType && <span className="text-xs text-slate-400">{assessment.assessmentType}</span>}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {[assessment.strengthLevel && `Strength ${assessment.strengthLevel}`, assessment.cardioLevel && `Cardio ${assessment.cardioLevel}`, assessment.mobilityLevel && `Mobility ${assessment.mobilityLevel}`].filter(Boolean).join(' · ') || 'No component levels recorded'}
        </p>
        {assessment.recommendations && <p className="mt-1 text-xs text-slate-600">{assessment.recommendations}</p>}
        {assessment.notes && <p className="mt-1 text-xs text-slate-500">{assessment.notes}</p>}
      </div>
    </div>
  )
}

export function MemberWorkoutProgress({ memberId, canRecordAssessment = true }: { memberId: number; canRecordAssessment?: boolean }) {
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [detailSession, setDetailSession] = useState<WorkoutSessionRecord | null>(null)
  const [rescheduleSession, setRescheduleSession] = useState<WorkoutSessionRecord | null>(null)
  const [programDayId, setProgramDayId] = useState('')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10))
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const sessions = useWorkoutSessionsForMember(memberId)
  const summary = useWorkoutProgressSummary(memberId)
  const assessments = useFitnessAssessments(memberId)
  const assignments = useProgramAssignments()
  const programs = useTrainingPrograms()
  const schedule = useScheduleWorkoutSession(memberId)
  const reschedule = useRescheduleWorkoutSession(memberId)

  const activeAssignment = assignments.data?.find((assignment) =>
    String(assignment.memberId) === String(memberId) && assignment.status === 'active'
  )
  const currentProgram = programs.data?.find((program) =>
    String(program.id) === String(activeAssignment?.trainingProgramId)
  )
  const visibleSessions = sessions.data?.slice(0, 10) ?? []
  const assessmentRows = assessments.data?.slice(0, 5) ?? []
  const selectedDay = currentProgram?.days.find((day) => String(day.id) === programDayId)
  const today = new Date().toISOString().slice(0, 10)
  const todaySession = sessions.data?.find((session) => session.scheduledDate.slice(0, 10) === today)
  const localWeekday = (new Date().getDay() + 6) % 7 + 1
  const start = activeAssignment ? new Date(`${activeAssignment.startDate.slice(0, 10)}T12:00:00`) : null
  const now = new Date(`${today}T12:00:00`)
  const elapsedDays = start ? Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000)) : 0
  const assignmentStarted = !!activeAssignment && activeAssignment.startDate.slice(0, 10) <= today
  const todayProgramDay = currentProgram?.days.find((day) => day.dayOfWeek === localWeekday) ??
    (assignmentStarted && activeAssignment && currentProgram?.days.every((day) => !day.dayOfWeek)
      ? currentProgram.days.find((day) => day.dayNumber === (elapsedDays % 7) + 1)
      : undefined)
  const upcomingSessions = (sessions.data ?? []).filter((session) =>
    session.scheduledDate.slice(0, 10) > today && session.status !== 'cancelled'
  ).sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate)).slice(0, 4)
  const exerciseProgress = (() => {
    const records = (sessions.data ?? [])
      .filter((session) => ['completed', 'partially_completed'].includes(session.status))
      .flatMap((session) => session.exercises.flatMap((exercise) => exercise.sets
        .filter((set) => set.status === 'completed' && set.actualWeight !== null)
        .map((set) => ({ name: exercise.exerciseName ?? `Exercise ${exercise.exerciseId}`, weight: Number(set.actualWeight), date: session.scheduledDate }))))
      .sort((left, right) => right.date.localeCompare(left.date))
    const byExercise = new Map<string, typeof records>()
    for (const record of records) byExercise.set(record.name, [...(byExercise.get(record.name) ?? []), record])
    return [...byExercise.entries()].slice(0, 5)
  })()

  const scheduleWorkout = () => {
    if (!activeAssignment || !programDayId) return
    schedule.mutate({
      assignmentId: Number(activeAssignment.id),
      programDayId: Number(programDayId),
      scheduledDate,
    }, { onSuccess: () => setScheduleOpen(false) })
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase text-slate-400">Current program</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{currentProgram?.name ?? 'No active program'}</p>
            </div>
            <div className="min-w-[180px]">
              <p className="text-[11px] font-medium uppercase text-slate-400">Today</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{todaySession?.programDayName ?? (todaySession ? `Workout day ${todaySession.programDayId}` : todayProgramDay?.restDay ? 'Rest Day' : todayProgramDay?.dayName ?? 'No workout scheduled')}</p>
              {todaySession && <Badge className={`mt-1 ${statusStyle(todaySession.status)}`}>{statusLabel(todaySession.status)}</Badge>}
            </div>
            <div className="min-w-[180px]">
              <p className="text-[11px] font-medium uppercase text-slate-400">Upcoming</p>
              {upcomingSessions.length ? upcomingSessions.slice(0, 2).map((session) => <p key={session.id} className="mt-1 text-xs text-slate-700">{formatDate(session.scheduledDate)} · {session.programDayName ?? `Day ${session.programDayId}`}</p>) : <p className="mt-1 text-xs text-slate-500">No upcoming workouts</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-semibold text-slate-900">Workout Progress</h3>
            {currentProgram && <span className="ml-auto text-xs text-slate-500">{currentProgram.name}</span>}
          </div>
          {summary.isLoading ? <div className="h-16 animate-pulse rounded bg-slate-100" /> : summary.isError ? (
            <p className="text-sm text-destructive">Workout progress could not be loaded.</p>
          ) : summary.data?.workoutCount ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryStat label="Adherence" value={summary.data.adherencePercentage === null ? 'Not enough data' : `${summary.data.adherencePercentage}%`} />
              <SummaryStat label="Completed" value={`${summary.data.completedCount} / ${summary.data.workoutCount}`} />
              <SummaryStat label="Workout streak" value={`${summary.data.currentWorkoutStreak}`} />
              <SummaryStat label="Last workout" value={summary.data.lastWorkoutDate ? formatDate(summary.data.lastWorkoutDate) : 'None'} />
            </div>
          ) : <p className="text-sm text-slate-500">Not enough scheduled workout data yet.</p>}
          {summary.data && summary.data.workoutCount > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {summary.data.partialCount} partial · {summary.data.skippedCount} skipped · {summary.data.missedCount} missed. Cancelled and future sessions are excluded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-slate-500" /><h3 className="text-sm font-semibold text-slate-900">Workout History</h3></div>
            {canRecordAssessment && activeAssignment && <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}><CalendarPlus className="mr-1.5 h-3.5 w-3.5" />Schedule workout</Button>}
          </div>
          {sessions.isLoading ? <div className="h-20 animate-pulse rounded bg-slate-100" /> : sessions.isError ? (
            <p className="text-sm text-destructive">Workout history could not be loaded.</p>
          ) : visibleSessions.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">No workouts scheduled or recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleSessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{session.programDayName ?? `Workout day ${session.programDayId}`}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(session.scheduledDate)} · {session.exercises.filter((exercise) => exercise.status === 'completed').length}/{session.exercises.length} exercises</p>
                  </div>
                  <Badge className={statusStyle(session.status)}>{statusLabel(session.status)}</Badge>
                  {session.status === 'pending' && canRecordAssessment && <Button size="icon" variant="ghost" aria-label="Reschedule workout" title="Reschedule workout" onClick={() => {
                    setRescheduleSession(session)
                    setRescheduleDate(session.scheduledDate.slice(0, 10))
                    setRescheduleReason('')
                  }}><CalendarClock className="h-4 w-4" /></Button>}
                  <Button size="icon" variant="ghost" aria-label="View workout details" title="View workout details" onClick={() => setDetailSession(session)}><Eye className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2"><Dumbbell className="h-4 w-4 text-slate-500" /><h3 className="text-sm font-semibold text-slate-900">Exercise Progress</h3></div>
          {exerciseProgress.length ? <div className="divide-y divide-slate-100">
            {exerciseProgress.map(([name, entries]) => <div key={name} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="text-sm font-medium text-slate-800">{name}</span>
              <span className="text-xs text-slate-600">Latest {entries[0].weight} kg · {formatDate(entries[0].date)}{entries[1] ? ` · Previous ${entries[1].weight} kg` : ' · Not enough previous data'}</span>
            </div>)}
          </div> : <p className="text-sm text-slate-500">No usable weighted exercise history yet.</p>}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-slate-500" /><h3 className="text-sm font-semibold text-slate-900">Fitness Assessments</h3></div>
            {canRecordAssessment && <Button size="sm" variant="outline" onClick={() => setAssessmentOpen(true)}><Dumbbell className="mr-1.5 h-3.5 w-3.5" />Record assessment</Button>}
          </div>
          {assessments.isLoading ? <div className="h-16 animate-pulse rounded bg-slate-100" /> : assessments.isError ? (
            <p className="text-sm text-destructive">Assessment history could not be loaded.</p>
          ) : assessmentRows.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">No fitness assessments recorded yet.</p>
          ) : assessmentRows.map((assessment) => <AssessmentRow key={assessment.id} assessment={assessment} />)}
        </CardContent>
      </Card>

      <SessionDetail session={detailSession} onClose={() => setDetailSession(null)} />
      <Dialog open={!!rescheduleSession} onOpenChange={(value) => !value && setRescheduleSession(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reschedule workout</DialogTitle><DialogDescription>{rescheduleSession?.programDayName ?? 'Workout'} · original date {rescheduleSession?.originalScheduledDate || rescheduleSession?.scheduledDate ? formatDate(rescheduleSession?.originalScheduledDate ?? rescheduleSession?.scheduledDate ?? '') : 'Not specified'}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>New date</Label><Input type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Reason</Label><Input value={rescheduleReason} onChange={(event) => setRescheduleReason(event.target.value)} placeholder="Member unavailable" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleSession(null)}>Cancel</Button>
            <Button disabled={!rescheduleSession || !rescheduleDate || !rescheduleReason.trim() || reschedule.isPending} onClick={() => rescheduleSession && reschedule.mutate({ sessionId: Number(rescheduleSession.id), scheduledDate: rescheduleDate, rescheduleReason: rescheduleReason.trim() }, { onSuccess: () => setRescheduleSession(null) })}>{reschedule.isPending ? 'Saving...' : 'Reschedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AssessmentDialog memberId={memberId} open={assessmentOpen} onClose={() => setAssessmentOpen(false)} />
      <Dialog open={scheduleOpen} onOpenChange={(value) => !value && setScheduleOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule workout</DialogTitle><DialogDescription>{currentProgram?.name ?? 'Select a program day and date.'}</DialogDescription></DialogHeader>
          {currentProgram?.days.length ? <div className="space-y-4">
            <div className="space-y-1.5"><Label>Program day</Label>
              <Select value={programDayId} onValueChange={setProgramDayId}>
                <SelectTrigger><SelectValue placeholder="Choose a day" /></SelectTrigger>
                <SelectContent>{currentProgram.days.map((day) => <SelectItem key={day.id} value={String(day.id)} disabled={day.restDay}>{day.dayName ?? `Day ${day.dayNumber}`}{day.restDay ? ' · Rest' : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></div>
            {selectedDay?.restDay && <p className="text-xs text-amber-700">Rest days cannot be scheduled as workouts.</p>}
          </div> : <p className="text-sm text-slate-500">An active program with workout days is required to schedule a session.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={scheduleWorkout} disabled={!activeAssignment || !programDayId || !scheduledDate || selectedDay?.restDay || schedule.isPending}>{schedule.isPending ? 'Scheduling...' : 'Schedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[11px] font-medium uppercase text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p></div>
}