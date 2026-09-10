import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { StepLabel } from '@/components/entity/StepLabel'
import { FoodLibrarySetupPrompt } from '@/components/entity/FoodLibrarySetupPrompt'
import { ConfigureFoodLibraryDialog } from '@/components/entity/ConfigureFoodLibraryDialog'
import { ViewFoodLibraryDialog } from '@/components/entity/ViewFoodLibraryDialog'
import { CreateFoodDialog } from '@/components/entity/CreateFoodDialog'
import { DietPlanLibrarySection } from '@/components/entity/DietPlanLibrarySection'
import { DietPlanDetailDialog } from '@/components/entity/DietPlanDetailDialog'
import { CreateDietPlanDialog } from '@/components/entity/CreateDietPlanDialog'
import { AssignDietPlanDialog } from '@/components/entity/AssignDietPlanDialog'
import { EditDietAssignmentDialog } from '@/components/entity/EditDietAssignmentDialog'
import { DietPlanTable } from '@/components/entity/DietPlanTable'
import { useDietPlans, useDeleteDietPlan, useDuplicateDietPlan, useUpdateAnyDietPlan } from '@/hooks/useDietPlans'
import { useDietAssignments, useDeleteDietAssignment } from '@/hooks/useDietAssignments'
import { useFoods, useDeleteFood } from '@/hooks/useFoods'
import { useFoodLibraryConfig, useDeleteFoodLibraryConfig } from '@/hooks/useFoodLibraryConfig'
import { useUsersByRole } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useBranches } from '@/hooks/useBranches'
import { useAuthStore } from '@/store/auth.store'
import type { DietAssignmentRecord } from '@/api/diet-assignments.api'
import type { DietPlanRecord } from '@/api/diet-plans.api'
import type { FoodRecord } from '@/api/foods.api'
import type { ManagedUser } from '@/api/user-management.api'
import type { BranchRecord } from '@/api/branches.api'

function findUser(users: ManagedUser[], id: number | null) {
  if (!id) return undefined
  return users.find((u) => u.id === String(id))
}

function foodColumns(onDelete: (f: FoodRecord) => void, deletingId: number | null): ColumnDef<FoodRecord>[] {
  return [
    { header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
    { header: 'Category', cell: ({ row }) => row.original.category ?? '—' },
    { header: 'Serving', cell: ({ row }) => `${row.original.servingSize}${row.original.servingUnit}` },
    { header: 'Calories', cell: ({ row }) => row.original.calories },
    { header: 'Protein', cell: ({ row }) => `${row.original.protein}g` },
    { header: 'Carbs', cell: ({ row }) => `${row.original.carbs}g` },
    { header: 'Fat', cell: ({ row }) => `${row.original.fat}g` },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="destructive" onClick={() => onDelete(row.original)} disabled={deletingId === row.original.id}>
            Remove
          </Button>
        </div>
      ),
    },
  ]
}

export default function AdminDietsPage() {
  const gymContext = useAuthStore((s) => s.gymContext)
  const { memberRole, trainerRole } = useRoles()
  const { data: members = [] } = useUsersByRole(memberRole?.id)
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)
  const { data: branches = [] } = useBranches(gymContext?.businessId)

  const plans = useDietPlans()
  const assignments = useDietAssignments()
  const foods = useFoods()
  const libraryConfig = useFoodLibraryConfig()

  const deletePlan = useDeleteDietPlan()
  const deleteAssignment = useDeleteDietAssignment()
  const duplicatePlan = useDuplicateDietPlan()
  const updateAnyPlan = useUpdateAnyDietPlan()
  const deleteFood = useDeleteFood()
  const deleteLibrary = useDeleteFoodLibraryConfig()

  const [planFormOpen, setPlanFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<DietPlanRecord | null>(null)
  const [detailPlan, setDetailPlan] = useState<DietPlanRecord | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignFixedPlanId, setAssignFixedPlanId] = useState<number | undefined>(undefined)
  const [editingAssignment, setEditingAssignment] = useState<DietAssignmentRecord | null>(null)
  const [createFoodOpen, setCreateFoodOpen] = useState(false)
  const [configureLibraryOpen, setConfigureLibraryOpen] = useState(false)
  const [viewLibraryOpen, setViewLibraryOpen] = useState(false)
  const [foodSearch, setFoodSearch] = useState('')

  const memberName = (id: number) => {
    const u = findUser(members, id)
    return u ? (u.fullName ?? u.firstName) : `#${id}`
  }
  const trainerName = (id: number | null) => {
    if (!id) return 'Unassigned'
    const u = findUser(trainers, id)
    return u ? (u.fullName ?? u.firstName) : `#${id}`
  }
  const planLookup = (dietPlanId: number) =>
    plans.data?.find((p) => String(p.id) === String(dietPlanId))

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase()
    if (!q) return foods.data
    return foods.data?.filter((f) => f.name.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q))
  }, [foods.data, foodSearch])

  return (
    <div className="relative -m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden lg:-m-8 lg:h-[calc(100%+4rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(248,250,252,0.78), rgba(248,250,252,0.84)), url('/images/diet-nutrition.jpeg')" }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 overflow-auto p-6">
        <Tabs defaultValue="foods" className="space-y-4">
          <TabsList>
            <TabsTrigger value="foods">
              <StepLabel step={1} label="Food Library" done={!!libraryConfig.data} />
            </TabsTrigger>
            <TabsTrigger value="plans">
              <StepLabel step={2} label="Diet Plans" done={(plans.data?.length ?? 0) > 0} />
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <StepLabel step={3} label="Assigned Diets" done={(assignments.data?.length ?? 0) > 0} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="foods">
            {!libraryConfig.isLoading && !libraryConfig.data ? (
              <FoodLibrarySetupPrompt onConfigure={() => setConfigureLibraryOpen(true)} />
            ) : (
              <EntityListPage
                title="Food Library"
                description="Every food your gym has added — pick from these when building a diet plan."
                columns={foodColumns(
                  (f) => deleteFood.mutate(f.id),
                  deleteFood.isPending ? (deleteFood.variables ?? null) : null
                )}
                data={filteredFoods}
                isLoading={foods.isLoading || libraryConfig.isLoading}
                isError={foods.isError}
                onRetry={foods.refetch}
                emptyMessage={foodSearch ? 'No foods match your search.' : 'No foods yet — click "Add Food" to create your first one.'}
                actions={
                  <Button size="sm" onClick={() => setCreateFoodOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add Food
                  </Button>
                }
                toolbar={
                  <>
                    <div className="relative w-56">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search foods..."
                        value={foodSearch}
                        onChange={(e) => setFoodSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setViewLibraryOpen(true)}>
                      View Library
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setConfigureLibraryOpen(true)}>
                      Edit Setup
                    </Button>
                    {import.meta.env.DEV && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteLibrary.isPending}
                        title="Dev-only: wipes the food library setup for testing"
                        onClick={() => {
                          if (window.confirm('[Dev only] Permanently delete this gym\'s food library setup? This does not delete any foods already added.')) {
                            deleteLibrary.mutate()
                          }
                        }}
                      >
                        Delete Library (dev)
                      </Button>
                    )}
                  </>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="plans">
            <DietPlanLibrarySection
              data={plans.data}
              isLoading={plans.isLoading}
              isError={plans.isError}
              onRetry={plans.refetch}
              onCreate={() => { setEditingPlan(null); setPlanFormOpen(true) }}
              onOpenPlan={setDetailPlan}
              onDuplicatePlan={(p) => duplicatePlan.mutate(p.id)}
              onArchivePlan={(p) => updateAnyPlan.mutate({ id: p.id, data: { status: 'Archived', isActive: false } })}
              defaultOpen
            />
          </TabsContent>

          <TabsContent value="assignments">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Assigned Diet Plans</h1>
                  <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
                    Which members are on a diet plan right now, and who's coaching them.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => { setAssignFixedPlanId(undefined); setAssignOpen(true) }}
                  disabled={(plans.data?.length ?? 0) === 0}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Assign to Member
                </Button>
              </div>

              <DietPlanTable
                data={assignments.data}
                planLookup={planLookup}
                isLoading={assignments.isLoading || plans.isLoading}
                isError={assignments.isError}
                onRetry={assignments.refetch}
                emptyMessage={
                  (plans.data?.length ?? 0) === 0
                    ? 'Create a diet plan in the Diet Plans tab, then assign it to a member.'
                    : 'No members are on a diet plan yet — assign your first one.'
                }
                memberLabel={memberName}
                trainerLabel={trainerName}
                onEdit={setEditingAssignment}
                onDelete={(a) => deleteAssignment.mutate(a.id)}
                deletingId={deleteAssignment.isPending ? (deleteAssignment.variables ?? null) : null}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateFoodDialog
        open={createFoodOpen}
        onClose={() => setCreateFoodOpen(false)}
        libraryCatalog={libraryConfig.data?.config.categories}
      />

      <ConfigureFoodLibraryDialog
        open={configureLibraryOpen}
        onClose={() => setConfigureLibraryOpen(false)}
        existingConfig={libraryConfig.data}
      />

      <ViewFoodLibraryDialog
        open={viewLibraryOpen}
        onClose={() => setViewLibraryOpen(false)}
        config={libraryConfig.data}
        onEdit={() => {
          setViewLibraryOpen(false)
          setConfigureLibraryOpen(true)
        }}
      />

      <DietPlanLibraryDialogs
        detailPlan={detailPlan}
        onCloseDetail={() => setDetailPlan(null)}
        onEditPlan={(p) => { setDetailPlan(null); setEditingPlan(p); setPlanFormOpen(true) }}
        onDeletePlan={(p) => {
          if (window.confirm(`Delete "${p.name}"? Members currently assigned to it will keep their assignment, but it'll no longer be in the library.`)) {
            deletePlan.mutate(p.id)
            setDetailPlan(null)
          }
        }}
        onAssignPlan={(p) => { setDetailPlan(null); setAssignFixedPlanId(p.id); setAssignOpen(true) }}
        onDuplicatePlan={(p) => { duplicatePlan.mutate(p.id); setDetailPlan(null) }}
        deletingPlan={deletePlan.isPending}
        planFormOpen={planFormOpen}
        onClosePlanForm={() => setPlanFormOpen(false)}
        editingPlan={editingPlan}
        branchOptions={branches}
        assignOpen={assignOpen}
        onCloseAssign={() => setAssignOpen(false)}
        assignFixedPlanId={assignFixedPlanId}
        memberOptions={members}
        trainerOptions={trainers}
        planOptions={plans.data ?? []}
        editingAssignment={editingAssignment}
        onCloseEditAssignment={() => setEditingAssignment(null)}
      />
    </div>
  )
}

/** Groups the five diet-plan dialogs this page owns so the main return stays scannable. */
function DietPlanLibraryDialogs(props: {
  detailPlan: DietPlanRecord | null
  onCloseDetail: () => void
  onEditPlan: (p: DietPlanRecord) => void
  onDeletePlan: (p: DietPlanRecord) => void
  onAssignPlan: (p: DietPlanRecord) => void
  onDuplicatePlan: (p: DietPlanRecord) => void
  deletingPlan: boolean
  planFormOpen: boolean
  onClosePlanForm: () => void
  editingPlan: DietPlanRecord | null
  branchOptions: BranchRecord[]
  assignOpen: boolean
  onCloseAssign: () => void
  assignFixedPlanId: number | undefined
  memberOptions: ManagedUser[]
  trainerOptions: ManagedUser[]
  planOptions: DietPlanRecord[]
  editingAssignment: DietAssignmentRecord | null
  onCloseEditAssignment: () => void
}) {
  return (
    <>
      <DietPlanDetailDialog
        open={!!props.detailPlan}
        onClose={props.onCloseDetail}
        plan={props.detailPlan}
        onEdit={props.onEditPlan}
        onDelete={props.onDeletePlan}
        onAssign={props.onAssignPlan}
        onDuplicate={props.onDuplicatePlan}
        deleting={props.deletingPlan}
      />

      <CreateDietPlanDialog
        open={props.planFormOpen}
        onClose={props.onClosePlanForm}
        branchOptions={props.branchOptions}
        plan={props.editingPlan}
      />

      <AssignDietPlanDialog
        open={props.assignOpen}
        onClose={props.onCloseAssign}
        memberOptions={props.memberOptions}
        trainerOptions={props.trainerOptions}
        planOptions={props.planOptions}
        fixedDietPlanId={props.assignFixedPlanId}
      />

      <EditDietAssignmentDialog
        open={!!props.editingAssignment}
        onClose={props.onCloseEditAssignment}
        assignment={props.editingAssignment}
        trainerOptions={props.trainerOptions}
      />
    </>
  )
}
