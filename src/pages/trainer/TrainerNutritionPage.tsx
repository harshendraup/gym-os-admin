import type { ColumnDef } from '@tanstack/react-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { useTrainerMembers } from '@/hooks/useTrainerMembers'
import { useDietAssignments } from '@/hooks/useDietAssignments'
import { useDietPlans } from '@/hooks/useDietPlans'
import { useNutritionAssessments } from '@/hooks/useNutritionAssessments'
import type { DietAssignmentRecord } from '@/api/diet-assignments.api'
import type { DietPlanRecord } from '@/api/diet-plans.api'
import type { NutritionAssessmentRecord } from '@/api/nutrition-assessments.api'

export default function TrainerNutritionPage() {
  const members = useTrainerMembers({ page: 1, perPage: 100 })
  const assignments = useDietAssignments()
  const plans = useDietPlans()
  const assessments = useNutritionAssessments()
  const memberName = (id: number) => members.data?.data.find((member) => String(member.id) === String(id))?.fullName ?? `#${id}`
  const planName = (id: number) => plans.data?.find((plan) => String(plan.id) === String(id))?.name ?? `#${id}`
  const assignmentColumns: ColumnDef<DietAssignmentRecord>[] = [
    { header: 'Member', cell: ({ row }) => <span className="font-medium">{memberName(row.original.memberId)}</span> },
    { header: 'Plan', cell: ({ row }) => planName(row.original.dietPlanId) },
    { header: 'Start', cell: ({ row }) => row.original.startDate.slice(0, 10) },
    { header: 'Status', cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge> },
  ]
  const planColumns: ColumnDef<DietPlanRecord>[] = [
    { header: 'Plan', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { header: 'Goal', cell: ({ row }) => row.original.goal },
    { header: 'Type', cell: ({ row }) => row.original.planType },
    { header: 'Status', cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge> },
  ]
  const assessmentColumns: ColumnDef<NutritionAssessmentRecord>[] = [
    { header: 'Member', cell: ({ row }) => <span className="font-medium">{memberName(row.original.memberId)}</span> },
    { header: 'Goal', cell: ({ row }) => row.original.goal },
    { header: 'Diet type', cell: ({ row }) => row.original.dietType },
    { header: 'Status', cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge> },
  ]
  const loading = members.isLoading || assignments.isLoading || plans.isLoading || assessments.isLoading
  const error = members.isError || assignments.isError || plans.isError || assessments.isError

  return <Tabs defaultValue="assignments" className="space-y-4">
    <TabsList><TabsTrigger value="assignments">Assigned Diets</TabsTrigger><TabsTrigger value="assessments">Assessments</TabsTrigger><TabsTrigger value="plans">Diet Plans</TabsTrigger></TabsList>
    <TabsContent value="assignments"><EntityListPage title="Assigned Diets" description="Diet assignments for your members." columns={assignmentColumns} data={assignments.data} isLoading={loading} isError={error} onRetry={() => { void assignments.refetch(); void members.refetch() }} emptyMessage="No diet assignments found." /></TabsContent>
    <TabsContent value="assessments"><EntityListPage title="Nutrition Assessments" description="Nutrition assessments for your assigned members." columns={assessmentColumns} data={assessments.data} isLoading={loading} isError={error} onRetry={() => void assessments.refetch()} emptyMessage="No nutrition assessments found." /></TabsContent>
    <TabsContent value="plans"><EntityListPage title="Diet Plans" description="Diet plans available to your branch." columns={planColumns} data={plans.data} isLoading={loading} isError={error} onRetry={() => void plans.refetch()} emptyMessage="No diet plans found." /></TabsContent>
  </Tabs>
}