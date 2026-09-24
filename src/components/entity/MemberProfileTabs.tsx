import { useState } from 'react'
import {
  Mail, Phone, MapPin, Calendar, Pencil, ArrowLeft, Dumbbell, UserCog, Salad,
  Info, User as UserIcon, HeartPulse, Apple, CreditCard, TrendingUp, CalendarCheck,
  Plus, ShieldAlert, StickyNote, Power, PowerOff,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getInitials, formatDate } from '@/lib/utils'
import { AssignTrainerDialog } from './AssignTrainerDialog'
import { AssignMembershipDialog } from './AssignMembershipDialog'
import { MemberDietsDialog } from './MemberDietsDialog'
import { EditMemberPersonalInfoDialog } from './EditMemberPersonalInfoDialog'
import { EditFitnessPreferencesDialog } from './EditFitnessPreferencesDialog'
import { RecordMeasurementDialog } from './RecordMeasurementDialog'
import { LogCheckInDialog } from './LogCheckInDialog'
import { AIInsightsPanel } from './AIInsightsPanel'
import { useBodyMeasurementsForMember } from '@/hooks/useBodyMeasurements'
import { useAttendanceLogsForMember, useAttendanceStats } from '@/hooks/useAttendanceLogs'
import { useMemberFitnessPreferences } from '@/hooks/useMemberFitnessPreferences'
import { useNutritionAssessmentsForMember } from '@/hooks/useNutritionAssessments'
import { useMemberships } from '@/hooks/useMemberships'
import { useUpdateUser } from '@/hooks/useUsers'
import type { ManagedUser } from '@/api/user-management.api'
import type { DietAssignmentRecord } from '@/api/diet-assignments.api'
import type { MembershipRecord } from '@/api/memberships.api'

function computeExpiry(joiningDate: string | null | undefined, plan: MembershipRecord | undefined): string | null {
  if (!joiningDate || !plan || plan.isLifetime) return null
  const start = new Date(joiningDate)
  const expiry = new Date(start)
  switch (plan.durationUnit) {
    case 'days':
      expiry.setDate(expiry.getDate() + plan.durationValue)
      break
    case 'weeks':
      expiry.setDate(expiry.getDate() + plan.durationValue * 7)
      break
    case 'months':
      expiry.setMonth(expiry.getMonth() + plan.durationValue)
      break
    case 'years':
      expiry.setFullYear(expiry.getFullYear() + plan.durationValue)
      break
  }
  return expiry.toISOString()
}

interface MemberProfileTabsProps {
  member: ManagedUser
  roleLabel?: string
  branchLabel?: string
  onBack?: () => void
  onToggleStatus?: () => void
  isTogglingStatus?: boolean
  trainerOptions: ManagedUser[]
  currentTrainerName?: string
  dietAssignments: DietAssignmentRecord[]
  dietTrainerName: (trainerId: number | null) => string
}

/**
 * The full tabbed member profile — Overview / Personal & Contact / Fitness
 * Profile / Nutrition / Membership & Trainer / Progress / Attendance.
 * Member-only (see UserDetailCard for the plain single-card layout still
 * used by admin/sub-admin/trainer detail pages, which don't have any of
 * these fitness-journey concepts).
 */
export function MemberProfileTabs({
  member, roleLabel, branchLabel, onBack, onToggleStatus, isTogglingStatus,
  trainerOptions, currentTrainerName, dietAssignments, dietTrainerName,
}: MemberProfileTabsProps) {
  const memberId = Number(member.id)
  const displayName = member.fullName ?? member.firstName
  const isActive = member.status === 'Active'

  const [assignTrainerOpen, setAssignTrainerOpen] = useState(false)
  const [assignMembershipOpen, setAssignMembershipOpen] = useState(false)
  const [dietsOpen, setDietsOpen] = useState(false)
  const [editPersonalOpen, setEditPersonalOpen] = useState(false)
  const [editFitnessOpen, setEditFitnessOpen] = useState(false)
  const [recordMeasurementOpen, setRecordMeasurementOpen] = useState(false)
  const [logCheckInOpen, setLogCheckInOpen] = useState(false)
  const [trainerNotesDraft, setTrainerNotesDraft] = useState<string | null>(null)

  const measurements = useBodyMeasurementsForMember(memberId)
  const attendanceLogs = useAttendanceLogsForMember(memberId)
  const attendanceStats = useAttendanceStats(memberId)
  const fitnessPrefs = useMemberFitnessPreferences(memberId)
  const assessments = useNutritionAssessmentsForMember(memberId)
  const { data: memberships = [] } = useMemberships()
  const updateUser = useUpdateUser(member.id)

  const latestAssessment = assessments.data?.[0]
  const latestMeasurement = measurements.data?.[0]
  const previousMeasurement = measurements.data?.[1]
  // Ids come back from the API as strings even where the type says number, so compare as strings.
  const membershipPlan = memberships.find((m) => String(m.id) === String(member.membershipId))
  const membershipOptions = memberships.filter((m) => m.status === 'active' && (!m.branchId || String(m.branchId) === String(member.branchId)))
  const trainerNotes = (member.metaUser?.trainerNotes as string | undefined) ?? ''
  const effectiveJoiningDate = member.joiningDate ?? member.createdAt ?? null
  const membershipExpiry = computeExpiry(effectiveJoiningDate, membershipPlan)

  const saveTrainerNotes = () => {
    if (trainerNotesDraft === null) return
    updateUser.mutate(
      { metaUser: { ...member.metaUser, trainerNotes: trainerNotesDraft } },
      { onSuccess: () => setTrainerNotesDraft(null) }
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
      )}

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
    <div className="order-2 space-y-4 xl:order-2 xl:col-span-2">

      <Card className="overflow-hidden border-white/60 bg-white/75 shadow-lg backdrop-blur-md">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-700" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 shadow-md">
                <AvatarFallback className="text-lg font-bold text-white bg-gradient-to-br from-blue-500 to-blue-700">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                <div className="mt-1 flex items-center gap-2">
                  {roleLabel && <Badge>{roleLabel}</Badge>}
                  <Badge variant={isActive ? 'success' : 'secondary'}>{member.status}</Badge>
                  {member.memberCode && <span className="text-xs text-slate-400">#{member.memberCode}</span>}
                </div>
              </div>
            </div>
            {onToggleStatus && (
              <Button
                variant={isActive ? 'outline' : 'default'}
                size="sm"
                onClick={onToggleStatus}
                disabled={isTogglingStatus}
              >
                {isActive ? (
                  <PowerOff className="mr-1.5 h-4 w-4" />
                ) : (
                  <Power className="mr-1.5 h-4 w-4" />
                )}
                {isTogglingStatus ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-5">
            <QuickStat label="Membership" value={membershipPlan?.membershipName ?? '—'} />
            <QuickStat label="Expires" value={membershipPlan?.isLifetime ? 'Lifetime' : membershipExpiry ? formatDate(membershipExpiry) : '—'} />
            <QuickStat
              label="Last Check-in"
              value={attendanceStats.data?.lastCheckInAt ? formatDate(attendanceStats.data.lastCheckInAt) : 'Never'}
            />
            <QuickStat label="Trainer" value={currentTrainerName ?? 'Unassigned'} />
            <QuickStat label="Goal" value={fitnessPrefs.data?.primaryGoal ?? '—'} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-slate-100/70 p-1">
            <BuilderTab value="overview" icon={Info} label="Overview" />
            <BuilderTab value="personal" icon={UserIcon} label="Personal" />
            <BuilderTab value="fitness" icon={Dumbbell} label="Fitness" />
            <BuilderTab value="nutrition" icon={Apple} label="Nutrition" />
            <BuilderTab value="membership" icon={CreditCard} label="Membership" />
            <BuilderTab value="progress" icon={TrendingUp} label="Progress" />
            <BuilderTab value="attendance" icon={CalendarCheck} label="Attendance" />
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <DetailRow icon={Mail} label="Email" value={member.email ?? '—'} />
              <DetailRow icon={Phone} label="Mobile" value={member.mobile ?? '—'} />
              {branchLabel && <DetailRow icon={MapPin} label="Branch" value={branchLabel} />}
              <DetailRow icon={Calendar} label="Joined" value={member.createdAt ? formatDate(member.createdAt) : '—'} />
            </CardContent>
          </Card>
          {(fitnessPrefs.data?.injuries || fitnessPrefs.data?.physicalLimitations) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Health flags — check before building a program</p>
                {fitnessPrefs.data.injuries && <p className="mt-0.5">Injuries: {fitnessPrefs.data.injuries}</p>}
                {fitnessPrefs.data.physicalLimitations && <p className="mt-0.5">Limitations: {fitnessPrefs.data.physicalLimitations}</p>}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="personal" className="mt-4">
          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Personal & Contact</h3>
                <Button size="sm" variant="outline" onClick={() => setEditPersonalOpen(true)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow icon={UserIcon} label="Gender" value={member.gender ?? '—'} />
                <DetailRow icon={Calendar} label="Date of Birth" value={member.dateOfBirth ? formatDate(member.dateOfBirth) : '—'} />
                <DetailRow icon={Mail} label="Email" value={member.email ?? '—'} />
                <DetailRow icon={Phone} label="Mobile" value={member.mobile ?? '—'} />
                <DetailRow icon={Phone} label="Alternate Mobile" value={member.alternateMobile ?? '—'} />
                <DetailRow icon={HeartPulse} label="Blood Group" value={member.bloodGroup ?? '—'} />
                <DetailRow
                  icon={MapPin}
                  label="Address"
                  value={[member.address, member.city, member.state, member.country, member.pincode].filter(Boolean).join(', ') || '—'}
                />
                <DetailRow icon={Phone} label="Emergency Contact" value={member.emergencyContactName ? `${member.emergencyContactName} — ${member.emergencyContactNumber ?? '—'}` : '—'} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fitness" className="mt-4">
          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Fitness Profile</h3>
                <Button size="sm" variant="outline" onClick={() => setEditFitnessOpen(true)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> {fitnessPrefs.data ? 'Edit' : 'Set Up'}
                </Button>
              </div>
              {!fitnessPrefs.data ? (
                <p className="text-sm text-slate-400">No fitness profile recorded yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailRow icon={Dumbbell} label="Primary Goal" value={fitnessPrefs.data.primaryGoal ?? '—'} />
                  <DetailRow icon={Dumbbell} label="Secondary Goals" value={fitnessPrefs.data.secondaryGoals?.join(', ') || '—'} />
                  <DetailRow icon={Dumbbell} label="Target Weight" value={fitnessPrefs.data.targetWeight ? `${fitnessPrefs.data.targetWeight} kg` : '—'} />
                  <DetailRow icon={Dumbbell} label="Target Body Fat %" value={fitnessPrefs.data.targetBodyFatPercentage ? `${fitnessPrefs.data.targetBodyFatPercentage}%` : '—'} />
                  <DetailRow icon={Calendar} label="Goal Timeline" value={fitnessPrefs.data.goalTimeline ?? '—'} />
                  <DetailRow icon={Dumbbell} label="Fitness Level" value={fitnessPrefs.data.fitnessLevel ?? '—'} />
                  <DetailRow icon={Dumbbell} label="Gym Experience" value={fitnessPrefs.data.gymExperienceLevel ?? '—'} />
                  <DetailRow icon={Calendar} label="Workouts / Week" value={fitnessPrefs.data.workoutFrequency ? String(fitnessPrefs.data.workoutFrequency) : '—'} />
                  <DetailRow icon={Calendar} label="Preferred Days" value={fitnessPrefs.data.preferredDays?.join(', ') || '—'} />
                  <DetailRow icon={Calendar} label="Preferred Duration" value={fitnessPrefs.data.preferredDuration ? `${fitnessPrefs.data.preferredDuration} min` : '—'} />
                  <DetailRow icon={Calendar} label="Preferred Time" value={fitnessPrefs.data.preferredTime ?? '—'} />
                  <DetailRow icon={Dumbbell} label="Workout Types" value={fitnessPrefs.data.preferredWorkoutTypes?.join(', ') || '—'} />
                  <DetailRow icon={Dumbbell} label="Favorite Exercises" value={fitnessPrefs.data.favoriteExercises?.join(', ') || '—'} />
                  <DetailRow icon={Dumbbell} label="Exercises to Avoid" value={fitnessPrefs.data.avoidExercises?.join(', ') || '—'} />
                  <DetailRow icon={ShieldAlert} label="Injuries" value={fitnessPrefs.data.injuries || 'None'} />
                  <DetailRow icon={ShieldAlert} label="Physical Limitations" value={fitnessPrefs.data.physicalLimitations || 'None'} />
                  <DetailRow icon={ShieldAlert} label="Exercise Restrictions" value={fitnessPrefs.data.exerciseRestrictions || 'None'} />
                  <DetailRow icon={ShieldAlert} label="Mobility Limitations" value={fitnessPrefs.data.mobilityLimitations || 'None'} />
                  <DetailRow icon={Dumbbell} label="Strength Level" value={fitnessPrefs.data.strengthLevel ?? '—'} />
                  <DetailRow icon={Dumbbell} label="Cardio Level" value={fitnessPrefs.data.cardioLevel ?? '—'} />
                  <DetailRow icon={Dumbbell} label="Mobility Level" value={fitnessPrefs.data.mobilityLevel ?? '—'} />
                  <DetailRow icon={Dumbbell} label="Overall Fitness Level" value={fitnessPrefs.data.overallFitnessLevel ?? '—'} />
                  {fitnessPrefs.data.fitnessAssessmentNotes && (
                    <DetailRow icon={ShieldAlert} label="Trainer Assessment Notes" value={fitnessPrefs.data.fitnessAssessmentNotes} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="mt-4 space-y-4">
          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Latest Nutrition Assessment</h3>
                <Button size="sm" variant="outline" onClick={() => setDietsOpen(true)}>
                  <Salad className="mr-1.5 h-3.5 w-3.5" /> Manage Diet Plans
                </Button>
              </div>
              {!latestAssessment ? (
                <p className="text-sm text-slate-400">No nutrition assessment recorded yet — open Manage Diet Plans to start one.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailRow icon={Apple} label="Goal" value={latestAssessment.goal} />
                  <DetailRow icon={Apple} label="Diet Type" value={latestAssessment.dietType} />
                  <DetailRow icon={Apple} label="Current Weight" value={latestAssessment.currentWeight ? `${latestAssessment.currentWeight} kg` : '—'} />
                  <DetailRow icon={Apple} label="Target Weight" value={latestAssessment.targetWeight ? `${latestAssessment.targetWeight} kg` : '—'} />
                  <DetailRow icon={Apple} label="Meals / Day" value={String(latestAssessment.mealsPerDay ?? '—')} />
                  <DetailRow icon={ShieldAlert} label="Allergies" value={latestAssessment.allergies || '—'} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membership" className="mt-4 space-y-4">
          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Membership</h3>
                <Button size="sm" variant="outline" onClick={() => setAssignMembershipOpen(true)}>
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" /> {membershipPlan ? 'Change' : 'Assign'}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow icon={CreditCard} label="Plan" value={membershipPlan?.membershipName ?? '—'} />
                <DetailRow icon={Info} label="Status" value={member.status} />
                <DetailRow icon={Calendar} label="Joining Date" value={effectiveJoiningDate ? formatDate(effectiveJoiningDate) : '—'} />
                {branchLabel && <DetailRow icon={MapPin} label="Branch" value={branchLabel} />}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Assigned Trainer</h3>
                <Button size="sm" variant="outline" onClick={() => setAssignTrainerOpen(true)}>
                  <UserCog className="mr-1.5 h-3.5 w-3.5" /> {currentTrainerName ? 'Change' : 'Assign'}
                </Button>
              </div>
              <p className="text-sm text-slate-700">{currentTrainerName ?? 'No trainer assigned'}</p>
            </CardContent>
          </Card>

          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">Trainer Notes</h3>
                <span className="text-xs text-slate-400">(private — never shown to the member)</span>
              </div>
              <Textarea
                rows={3}
                placeholder="Ongoing notes about this member's training..."
                value={trainerNotesDraft ?? trainerNotes}
                onChange={(e) => setTrainerNotesDraft(e.target.value)}
              />
              {trainerNotesDraft !== null && (
                <div className="mt-2 flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setTrainerNotesDraft(null)}>Cancel</Button>
                  <Button size="sm" onClick={saveTrainerNotes} disabled={updateUser.isPending}>
                    {updateUser.isPending ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Measurement History</h3>
                <Button size="sm" onClick={() => setRecordMeasurementOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Record Measurement
                </Button>
              </div>
              {latestMeasurement && previousMeasurement && (
                <p className="mb-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-slate-600">
                  Since {formatDate(previousMeasurement.recordedDate)}:{' '}
                  <WeightDelta latest={latestMeasurement.weight} previous={previousMeasurement.weight} />
                </p>
              )}
              {!measurements.data || measurements.data.length === 0 ? (
                <p className="text-sm text-slate-400">No measurements recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Weight</th>
                        <th className="pb-2 pr-4 font-medium">BMI</th>
                        <th className="pb-2 pr-4 font-medium">Body Fat %</th>
                        <th className="pb-2 pr-4 font-medium">Waist</th>
                        <th className="pb-2 pr-4 font-medium">Chest</th>
                        <th className="pb-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.data.map((m) => (
                        <tr key={m.id} className="border-t border-slate-100">
                          <td className="py-2 pr-4 text-slate-700">{formatDate(m.recordedDate)}</td>
                          <td className="py-2 pr-4 text-slate-700">{m.weight ? `${m.weight} kg` : '—'}</td>
                          <td className="py-2 pr-4 text-slate-700">{m.bmi ?? '—'}</td>
                          <td className="py-2 pr-4 text-slate-700">{m.bodyFatPercentage ? `${m.bodyFatPercentage}%` : '—'}</td>
                          <td className="py-2 pr-4 text-slate-700">{m.waist ? `${m.waist} cm` : '—'}</td>
                          <td className="py-2 pr-4 text-slate-700">{m.chest ? `${m.chest} cm` : '—'}</td>
                          <td className="py-2 text-slate-500">{m.notes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          <Card className="border-white/60 bg-white/65 shadow-lg backdrop-blur-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Attendance</h3>
                <Button size="sm" onClick={() => setLogCheckInOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Check-in
                </Button>
              </div>
              {attendanceStats.data && (
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <QuickStat label="Total Visits" value={String(attendanceStats.data.totalVisits)} />
                  <QuickStat label="This Month" value={String(attendanceStats.data.monthlyVisits)} />
                  <QuickStat label="Streak" value={`${attendanceStats.data.streak} days`} />
                  <QuickStat label="Avg / Week" value={String(attendanceStats.data.avgVisitsPerWeek)} />
                </div>
              )}
              {!attendanceLogs.data || attendanceLogs.data.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
                  <p className="text-sm font-medium text-slate-600">No check-ins yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Once {displayName} checks in, attendance trends and progress will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {attendanceLogs.data.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-slate-50">
                      <span className="text-slate-700">{formatDate(log.checkInAt)} · {new Date(log.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <Badge variant="secondary">{log.method}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <div className="order-1 xl:order-1 xl:col-span-3">
      <div className="xl:sticky xl:top-4">
        <AIInsightsPanel
          user={member}
          ctx={{
            dietCount: dietAssignments.length,
            hasTrainer: !!currentTrainerName,
            lastCheckInAt: attendanceStats.data?.lastCheckInAt,
            checkInStreak: attendanceStats.data?.streak,
            monthlyVisits: attendanceStats.data?.monthlyVisits,
            bmi: latestMeasurement?.bmi,
            weightTrendKg:
              latestMeasurement?.weight && previousMeasurement?.weight
                ? Math.round((Number(latestMeasurement.weight) - Number(previousMeasurement.weight)) * 10) / 10
                : null,
            injuries: fitnessPrefs.data?.injuries,
            physicalLimitations: fitnessPrefs.data?.physicalLimitations,
            nutritionGoal: latestAssessment?.goal,
            membershipStatus: member.status,
          }}
        />
      </div>
    </div>
    </div>

      <EditMemberPersonalInfoDialog open={editPersonalOpen} onClose={() => setEditPersonalOpen(false)} member={member} />
      <EditFitnessPreferencesDialog
        open={editFitnessOpen}
        onClose={() => setEditFitnessOpen(false)}
        member={member}
        preferences={fitnessPrefs.data}
      />
      <RecordMeasurementDialog
        open={recordMeasurementOpen}
        onClose={() => setRecordMeasurementOpen(false)}
        member={member}
        lastWeight={latestMeasurement?.weight}
        lastHeight={latestMeasurement?.height}
      />
      <LogCheckInDialog open={logCheckInOpen} onClose={() => setLogCheckInOpen(false)} member={member} />
      <AssignTrainerDialog
        open={assignTrainerOpen}
        onClose={() => setAssignTrainerOpen(false)}
        member={member}
        trainerOptions={trainerOptions}
      />
      <AssignMembershipDialog
        open={assignMembershipOpen}
        onClose={() => setAssignMembershipOpen(false)}
        member={member}
        membershipOptions={membershipOptions}
      />
      <MemberDietsDialog
        open={dietsOpen}
        onClose={() => setDietsOpen(false)}
        member={member}
        assignments={dietAssignments}
        trainerOptions={trainerOptions}
        trainerName={dietTrainerName}
      />
    </div>
  )
}

function BuilderTab({ value, icon: Icon, label }: { value: string; icon: any; label: string }) {
  return (
    <TabsTrigger value={value} className="shrink-0 gap-1.5 whitespace-nowrap text-xs">
      <Icon className="h-3.5 w-3.5" /> {label}
    </TabsTrigger>
  )
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/50 bg-white/35 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function WeightDelta({ latest, previous }: { latest: string | null; previous: string | null }) {
  if (!latest || !previous) return <span>no weight change data</span>
  const delta = Number(latest) - Number(previous)
  const rounded = Math.round(delta * 10) / 10
  if (rounded === 0) return <span className="font-semibold text-slate-800">no weight change</span>
  return (
    <span className="font-semibold text-slate-800">
      {rounded > 0 ? `+${rounded}` : rounded} kg
    </span>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</p>
        <p className="text-sm text-slate-900">{value}</p>
      </div>
    </div>
  )
}
