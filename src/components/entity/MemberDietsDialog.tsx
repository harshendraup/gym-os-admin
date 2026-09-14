import { useState } from 'react'
import { Plus, Salad, ClipboardList, Activity } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AssignDietPlanDialog } from './AssignDietPlanDialog'
import { NutritionAssessmentDialog } from './NutritionAssessmentDialog'
import { CreateDietPlanDialog } from './CreateDietPlanDialog'
import { useDietPlans } from '@/hooks/useDietPlans'
import { useNutritionAssessmentsForMember } from '@/hooks/useNutritionAssessments'
import { useDietProgress } from '@/hooks/useDietTracking'
import type { DietAssignmentRecord, DietAssignmentStatus } from '@/api/diet-assignments.api'
import type { ManagedUser } from '@/api/user-management.api'
import type { NutritionAssessmentRecord } from '@/api/nutrition-assessments.api'

const statusVariant: Record<DietAssignmentStatus, 'secondary' | 'success' | 'default'> = {
  Draft: 'secondary',
  Active: 'success',
  Completed: 'default',
}

const ADHERENCE_STYLE = {
  Good: 'text-emerald-600',
  'Needs Attention': 'text-amber-600',
  'At Risk': 'text-red-600',
} as const

interface MemberDietsDialogProps {
  open: boolean
  onClose: () => void
  member: ManagedUser
  assignments: DietAssignmentRecord[]
  trainerOptions: ManagedUser[]
  trainerName: (id: number | null) => string
}

/** All diet plan assignments (past + present) for one member, plus their nutrition assessment and live adherence. */
export function MemberDietsDialog({
  open, onClose, member, assignments, trainerOptions, trainerName,
}: MemberDietsDialogProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [planFormOpen, setPlanFormOpen] = useState(false)
  const [planFormAssessment, setPlanFormAssessment] = useState<NutritionAssessmentRecord | null>(null)
  const { data: plans = [] } = useDietPlans()
  const { data: assessments = [] } = useNutritionAssessmentsForMember(open ? Number(member.id) : undefined)
  const latestAssessment = assessments[0]
  const memberPlans = plans.filter((plan) => Number(plan.memberId) === Number(member.id))
  const activeMemberPlan = memberPlans.find((plan) => plan.status === 'Active')
  const hasCompletedAssessment = latestAssessment?.status === 'Completed'

  const activeAssignment = assignments.find((a) => a.status === 'Active')
  const { data: progress } = useDietProgress(activeAssignment?.id)

  const planName = (dietPlanId: number) => plans.find((p) => String(p.id) === String(dietPlanId))?.name ?? `#${dietPlanId}`
  const planGoal = (dietPlanId: number) => plans.find((p) => String(p.id) === String(dietPlanId))?.goal

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{member.fullName ?? member.firstName}'s Nutrition</DialogTitle>
          </DialogHeader>

          {progress && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Activity className="h-3.5 w-3.5" /> Current Adherence
                </span>
                <span className={`text-xs font-bold ${ADHERENCE_STYLE[progress.status]}`}>{progress.status}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-4 text-sm">
                <span className="font-semibold text-slate-800">{progress.mealAdherencePct}%</span>
                <span className="text-xs text-slate-500">meals</span>
                {progress.waterAdherencePct !== null && (
                  <>
                    <span className="font-semibold text-slate-800">{progress.waterAdherencePct}%</span>
                    <span className="text-xs text-slate-500">water</span>
                  </>
                )}
                {progress.proteinActualAvg !== null && (
                  <span className="text-xs text-slate-500">
                    protein avg {progress.proteinActualAvg}g{progress.proteinTargetAvg ? ` / ${progress.proteinTargetAvg}g` : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nutrition Assessment</p>
              <p className="text-xs text-slate-500">
                {latestAssessment ? `Last recorded — ${latestAssessment.goal}, ${latestAssessment.dietType}` : 'Not recorded yet'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAssessmentOpen(true)}>
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> {hasCompletedAssessment ? 'Update' : 'Complete Assessment'}
            </Button>
          </div>

          {!hasCompletedAssessment ? (
            <Button size="sm" onClick={() => setAssessmentOpen(true)}>
              <ClipboardList className="mr-1.5 h-4 w-4" /> Complete Nutrition Assessment
            </Button>
          ) : !activeMemberPlan ? (
            <Button size="sm" onClick={() => { setPlanFormAssessment(latestAssessment); setPlanFormOpen(true) }}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Diet Plan
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Assign Active Diet Plan
            </Button>
          )}

          {assignments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Salad className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No diet plans assigned yet.</p>
            </div>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {assignments.map((a) => (
                <div key={a.id} className="rounded-lg px-2 py-2 hover:bg-muted/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{planName(a.dietPlanId)}</p>
                    <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {planGoal(a.dietPlanId) ?? 'Unknown goal'} · Trainer: {trainerName(a.trainerId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.startDate.slice(0, 10)} → {a.endDate?.slice(0, 10) ?? 'ongoing'}
                  </p>
                </div>
              ))}
            </div>
          )}

        </DialogContent>
      </Dialog>

      <AssignDietPlanDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        memberOptions={[member]}
        trainerOptions={trainerOptions}
        planOptions={memberPlans.filter((plan) => plan.status === 'Active')}
        fixedMember={member}
      />

      <NutritionAssessmentDialog
        open={assessmentOpen}
        onClose={() => setAssessmentOpen(false)}
        member={member}
        assessment={latestAssessment}
        onSaved={(saved) => {
          // Only a completed assessment (not a draft) has enough to suggest
          // real targets from — a draft save just closes as before.
          if (saved.status !== 'Completed') return
          setPlanFormAssessment(saved)
          setPlanFormOpen(true)
        }}
      />

      <CreateDietPlanDialog
        open={planFormOpen}
        onClose={() => { setPlanFormOpen(false); setPlanFormAssessment(null) }}
        fixedBranchId={member.branchId ? Number(member.branchId) : undefined}
        assessment={planFormAssessment}
        member={member}
        templateOptions={plans.filter((plan) => plan.memberId === null && plan.planType === 'Template')}
      />
    </>
  )
}
