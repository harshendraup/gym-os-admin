import { useMemo, useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { DietPlanLibrarySection } from '@/components/entity/DietPlanLibrarySection'
import { DietPlanDetailDialog } from '@/components/entity/DietPlanDetailDialog'
import { CreateDietPlanDialog } from '@/components/entity/CreateDietPlanDialog'
import { AssignDietPlanDialog } from '@/components/entity/AssignDietPlanDialog'
import { EditDietAssignmentDialog } from '@/components/entity/EditDietAssignmentDialog'
import { DietPlanTable } from '@/components/entity/DietPlanTable'
import { FoodLibrarySetupPrompt } from '@/components/entity/FoodLibrarySetupPrompt'
import { ConfigureFoodLibraryDialog } from '@/components/entity/ConfigureFoodLibraryDialog'
import { ViewFoodLibraryDialog } from '@/components/entity/ViewFoodLibraryDialog'
import { CreateFoodDialog } from '@/components/entity/CreateFoodDialog'
import { Input } from '@/components/ui/input'
import { useDietPlans, useDeleteDietPlan, useDuplicateDietPlan, useUpdateAnyDietPlan } from '@/hooks/useDietPlans'
import { useDietAssignments, useDeleteDietAssignment } from '@/hooks/useDietAssignments'
import { useFoods, useDeleteFood } from '@/hooks/useFoods'
import { useFoodLibraryConfig, useDeleteFoodLibraryConfig } from '@/hooks/useFoodLibraryConfig'
import { useUsersByRole } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useAuthStore } from '@/store/auth.store'
import type { DietAssignmentRecord } from '@/api/diet-assignments.api'
import type { DietPlanRecord } from '@/api/diet-plans.api'
import type { ManagedUser } from '@/api/user-management.api'
import { Hero, ScoreCard, ScoreboardCta, ScoreboardIconButton, RowCardList, RowCard } from '@/components/scoreboard/primitives'
import { T, mono } from '@/components/scoreboard/tokens'

// Swap in a real nutrition/meal-prep photo here once available — see
// Hero's placeholder fallback in the meantime.
const HERO_IMAGE: string | null = null

function findUser(users: ManagedUser[], id: number | null) {
  if (!id) return undefined
  return users.find((u) => u.id === String(id))
}

const SECTIONS = [
  { key: 'foods', label: 'Food Library' },
  { key: 'plans', label: 'Diet Plans' },
  { key: 'assignments', label: 'Assigned Diets' },
] as const

export default function SubAdminDietsPage() {
  const gymContext = useAuthStore((s) => s.gymContext)
  const { memberRole, trainerRole } = useRoles()
  const { data: members = [] } = useUsersByRole(memberRole?.id)
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)

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

  const [section, setSection] = useState<(typeof SECTIONS)[number]['key']>('foods')
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

  const deletingFoodId = deleteFood.isPending ? (deleteFood.variables ?? null) : null

  const stepDone: Record<(typeof SECTIONS)[number]['key'], boolean> = {
    foods: !!libraryConfig.data,
    plans: (plans.data?.length ?? 0) > 0,
    assignments: (assignments.data?.length ?? 0) > 0,
  }

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase()
    if (!q) return foods.data
    return foods.data?.filter((f) => f.name.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q))
  }, [foods.data, foodSearch])

  return (
    <>
      <Hero
        image={HERO_IMAGE}
        placeholderLabel="nutrition"
        eyebrow="Nutrition Programs"
        title="Diet Plans"
        subtitle="Build reusable diet plans, then assign them to members in your branch."
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {SECTIONS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              ...mono,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${section === s.key ? T.signal : T.line}`,
              background: section === s.key ? T.signal : '#fff',
              color: section === s.key ? '#fff' : T.dim,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 16,
                width: 16,
                borderRadius: 999,
                fontSize: 10,
                background: stepDone[s.key] ? (section === s.key ? '#fff' : T.signal) : 'transparent',
                color: stepDone[s.key] ? (section === s.key ? T.signal : '#fff') : 'inherit',
                border: stepDone[s.key] ? 'none' : `1px solid ${section === s.key ? '#fff' : T.line}`,
              }}
            >
              {stepDone[s.key] ? <Check size={10} /> : i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'assignments' && (
        <ScoreCard
          title={`Assigned Diets · ${assignments.data?.length ?? 0}`}
          subtitle="Which members are on a diet plan right now, and who's coaching them"
          action={
            <ScoreboardCta icon={Plus} onClick={() => { setAssignFixedPlanId(undefined); setAssignOpen(true) }}>
              Assign to Member
            </ScoreboardCta>
          }
        >
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
        </ScoreCard>
      )}

      {section === 'plans' && (
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
      )}

      {section === 'foods' && !libraryConfig.isLoading && !libraryConfig.data && (
        <ScoreCard title="Food Library" subtitle="Every food your branch has added">
          <FoodLibrarySetupPrompt onConfigure={() => setConfigureLibraryOpen(true)} />
        </ScoreCard>
      )}

      {section === 'foods' && (libraryConfig.isLoading || libraryConfig.data) && (
        <ScoreCard
          title={`Food Library · ${foods.data?.length ?? 0}`}
          subtitle={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>Every food your branch has added — pick from these when building a diet plan</span>
              <button
                onClick={() => setViewLibraryOpen(true)}
                style={{ ...mono, fontSize: 10.5, color: T.dim, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                View Library
              </button>
              <button
                onClick={() => setConfigureLibraryOpen(true)}
                style={{ ...mono, fontSize: 10.5, color: T.dim, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Edit Setup
              </button>
              {import.meta.env.DEV && (
                <button
                  disabled={deleteLibrary.isPending}
                  title="Dev-only: wipes the food library setup for testing"
                  onClick={() => {
                    if (window.confirm('[Dev only] Permanently delete this gym\'s food library setup? This does not delete any foods already added.')) {
                      deleteLibrary.mutate()
                    }
                  }}
                  style={{ ...mono, fontSize: 10.5, color: T.signal, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Delete Library (dev)
                </button>
              )}
            </span>
          }
          action={
            <ScoreboardCta icon={Plus} onClick={() => setCreateFoodOpen(true)}>
              Add Food
            </ScoreboardCta>
          }
        >
          <div style={{ marginBottom: 12, maxWidth: 280 }}>
            <Input
              placeholder="Search foods..."
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <RowCardList
            isLoading={foods.isLoading || libraryConfig.isLoading}
            isError={foods.isError}
            onRetry={foods.refetch}
            isEmpty={!foods.isLoading && !foods.isError && (filteredFoods?.length ?? 0) === 0}
            emptyMessage={foodSearch ? 'No foods match your search.' : 'No foods yet — click "Add Food" to create your first one.'}
          >
            {filteredFoods?.map((f) => (
              <RowCard key={f.id} columns="1.4fr 1fr 1fr 1fr 1fr auto">
                <div style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>{f.name}</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{f.category ?? '—'}</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{f.calories} kcal</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{f.protein}g protein</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{f.servingSize}{f.servingUnit}</div>
                <ScoreboardIconButton icon={Trash2} onClick={() => deleteFood.mutate(f.id)} disabled={deletingFoodId === f.id} />
              </RowCard>
            ))}
          </RowCardList>
        </ScoreCard>
      )}

      <DietPlanDetailDialog
        open={!!detailPlan}
        onClose={() => setDetailPlan(null)}
        plan={detailPlan}
        onEdit={(p) => { setDetailPlan(null); setEditingPlan(p); setPlanFormOpen(true) }}
        onDelete={(p) => {
          if (window.confirm(`Delete "${p.name}"? Members currently assigned to it will keep their assignment, but it'll no longer be in the library.`)) {
            deletePlan.mutate(p.id)
            setDetailPlan(null)
          }
        }}
        onAssign={(p) => { setDetailPlan(null); setAssignFixedPlanId(p.id); setAssignOpen(true) }}
        onDuplicate={(p) => { duplicatePlan.mutate(p.id); setDetailPlan(null) }}
        deleting={deletePlan.isPending}
      />

      <CreateDietPlanDialog
        open={planFormOpen}
        onClose={() => setPlanFormOpen(false)}
        fixedBranchId={gymContext?.branchId ? Number(gymContext.branchId) : undefined}
        plan={editingPlan}
      />

      <AssignDietPlanDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        memberOptions={members}
        trainerOptions={trainers}
        planOptions={plans.data ?? []}
        fixedDietPlanId={assignFixedPlanId}
      />

      <EditDietAssignmentDialog
        open={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
        trainerOptions={trainers}
      />

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
    </>
  )
}
