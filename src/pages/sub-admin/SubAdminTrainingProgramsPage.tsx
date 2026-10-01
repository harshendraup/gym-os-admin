import { useMemo, useState } from 'react'
import { Plus, Dumbbell, Trash2, Check } from 'lucide-react'
import { AssignTrainingProgramDialog } from '@/components/entity/AssignTrainingProgramDialog'
import { CreateTrainingProgramDialog } from '@/components/entity/CreateTrainingProgramDialog'
import { CreateExerciseDialog } from '@/components/entity/CreateExerciseDialog'
import { ExerciseLibrarySetupPrompt } from '@/components/entity/ExerciseLibrarySetupPrompt'
import { ConfigureExerciseLibraryDialog } from '@/components/entity/ConfigureExerciseLibraryDialog'
import { ViewExerciseLibraryDialog } from '@/components/entity/ViewExerciseLibraryDialog'
import { Input } from '@/components/ui/input'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useProgramAssignments, useDeleteProgramAssignment, useUpdateProgramAssignment } from '@/hooks/useProgramAssignments'
import { useTrainingPrograms, useDeleteTrainingProgram } from '@/hooks/useTrainingPrograms'
import { useExercises, useDeleteExercise } from '@/hooks/useExercises'
import { useExerciseLibraryConfig, useDeleteExerciseLibraryConfig } from '@/hooks/useExerciseLibraryConfig'
import { useUsersByRole } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useAuthStore } from '@/store/auth.store'
import type { ProgramAssignmentStatus } from '@/api/program-assignments.api'
import type { ManagedUser } from '@/api/user-management.api'
import { T, mono } from '@/components/scoreboard/tokens'
import { Hero, ScoreCard, ScoreboardCta, ScoreboardIconButton, RowCardList, RowCard } from '@/components/scoreboard/primitives'
import { EXERCISE_CATEGORIES, FITNESS_GOALS, EQUIPMENT_TYPES, EXERCISE_DIFFICULTY, MUSCLE_GROUPS } from '@/components/constants'

const HERO_IMAGE: string | null = null

const STATUSES: ProgramAssignmentStatus[] = ['active', 'paused', 'completed', 'cancelled']

function findUser(users: ManagedUser[], id: number | null) {
  if (!id) return undefined
  return users.find((u) => u.id === String(id))
}

const SECTIONS = [
  { key: 'exercises', label: 'Exercise Library' },
  { key: 'programs', label: 'Programs' },
  { key: 'assignments', label: 'Assigned Programs' },
] as const

export default function SubAdminTrainingProgramsPage() {
  const gymContext = useAuthStore((s) => s.gymContext)
  const { memberRole, trainerRole } = useRoles()
  const { data: members = [] } = useUsersByRole(memberRole?.id)
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)

  const assignments = useProgramAssignments()
  const programs = useTrainingPrograms()
  const exercises = useExercises()
  const libraryConfig = useExerciseLibraryConfig()

  const deleteAssignment = useDeleteProgramAssignment()
  const updateAssignment = useUpdateProgramAssignment()
  const deleteProgram = useDeleteTrainingProgram()
  const deleteExercise = useDeleteExercise()
  const deleteLibrary = useDeleteExerciseLibraryConfig()

  const [section, setSection] = useState<(typeof SECTIONS)[number]['key']>('exercises')
  const [assignOpen, setAssignOpen] = useState(false)
  const [createProgramOpen, setCreateProgramOpen] = useState(false)
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false)
  const [configureLibraryOpen, setConfigureLibraryOpen] = useState(false)
  const [viewLibraryOpen, setViewLibraryOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState('')
  const [exerciseGoalFilter, setExerciseGoalFilter] = useState('')
  const [exerciseEquipmentFilter, setExerciseEquipmentFilter] = useState('')
  const [exerciseDifficultyFilter, setExerciseDifficultyFilter] = useState('')
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('')
  const [exerciseActiveFilter, setExerciseActiveFilter] = useState('')

  const memberName = (id: number) => {
    const u = findUser(members, id)
    return u ? (u.fullName ?? u.firstName) : `#${id}`
  }
  const trainerName = (id: number | null) => {
    if (!id) return 'Unassigned'
    const u = findUser(trainers, id)
    return u ? (u.fullName ?? u.firstName) : `#${id}`
  }
  // training_programs.id comes back over the wire as a string (Postgres
  // bigint serialization) despite the TrainingProgramRecord type saying
  // number — same reason findUser above coerces id to a string.
  const programName = (id: number) => programs.data?.find((p) => String(p.id) === String(id))?.name ?? `#${id}`

  const deletingAssignmentId = deleteAssignment.isPending ? (deleteAssignment.variables ?? null) : null
  const deletingProgramId = deleteProgram.isPending ? (deleteProgram.variables ?? null) : null
  const deletingExerciseId = deleteExercise.isPending ? (deleteExercise.variables ?? null) : null

  const stepDone: Record<(typeof SECTIONS)[number]['key'], boolean> = {
    exercises: !!libraryConfig.data,
    programs: (programs.data?.length ?? 0) > 0,
    assignments: (assignments.data?.length ?? 0) > 0,
  }

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase()
    return exercises.data?.filter((e) => {
      if (q && !(e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.muscleGroup?.toLowerCase().includes(q))) return false
      if (exerciseCategoryFilter && e.category !== exerciseCategoryFilter) return false
      if (exerciseGoalFilter && !e.goals?.includes(exerciseGoalFilter as any)) return false
      if (exerciseEquipmentFilter && !(e.equipmentTags ?? []).includes(exerciseEquipmentFilter as any)) return false
      if (exerciseDifficultyFilter && e.difficultyLevel !== exerciseDifficultyFilter) return false
      if (exerciseMuscleFilter && e.muscleGroup !== exerciseMuscleFilter && !(e.secondaryMuscleGroups ?? []).includes(exerciseMuscleFilter as any)) return false
      if (exerciseActiveFilter && String(e.isActive) !== exerciseActiveFilter) return false
      return true
    })
  }, [
    exercises.data, exerciseSearch, exerciseCategoryFilter, exerciseGoalFilter,
    exerciseEquipmentFilter, exerciseDifficultyFilter, exerciseMuscleFilter, exerciseActiveFilter,
  ])

  return (
    <>
      <Hero
        image={HERO_IMAGE}
        placeholderLabel="coaching"
        eyebrow="Training"
        title="Training Programs"
        subtitle="Build programs, assign them to members, and track who's coaching who in your branch."
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {SECTIONS.filter((s) => s.key === 'exercises' || !!libraryConfig.data).map((s, i) => (
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

      {section === 'assignments' && libraryConfig.data && (
        <ScoreCard
          title={`Assigned Programs · ${assignments.data?.length ?? 0}`}
          subtitle="Which members are currently following a training program, and since when"
          action={
            <ScoreboardCta icon={Plus} onClick={() => setAssignOpen(true)}>
              Assign to a Member
            </ScoreboardCta>
          }
        >
          <RowCardList
            isLoading={assignments.isLoading || programs.isLoading}
            isError={assignments.isError}
            onRetry={assignments.refetch}
            isEmpty={!assignments.isLoading && !assignments.isError && (assignments.data?.length ?? 0) === 0}
            emptyMessage="No members are on a program yet — assign your first training program."
          >
            {assignments.data?.map((a) => (
              <RowCard key={a.id} columns="1.3fr 1fr 1fr 0.8fr 0.8fr 0.9fr auto">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,70,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell size={18} color={T.signal} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>{programName(a.trainingProgramId)}</div>
                </div>
                <div style={{ fontSize: 13.5, color: T.text }}>
                  <span style={{ ...mono, fontSize: 9.5, color: T.dim, display: 'block', letterSpacing: '0.06em' }}>MEMBER</span>
                  {memberName(a.memberId)}
                </div>
                <div style={{ fontSize: 13.5, color: T.text }}>
                  <span style={{ ...mono, fontSize: 9.5, color: T.dim, display: 'block', letterSpacing: '0.06em' }}>TRAINER</span>
                  {trainerName(a.trainerId)}
                </div>
                <div>
                  <span style={{ ...mono, fontSize: 9.5, color: T.dim, display: 'block', letterSpacing: '0.06em' }}>START</span>
                  <span style={{ ...mono, fontSize: 12, color: T.text }}>{a.startDate.slice(0, 10)}</span>
                </div>
                <div>
                  <span style={{ ...mono, fontSize: 9.5, color: T.dim, display: 'block', letterSpacing: '0.06em' }}>END</span>
                  <span style={{ ...mono, fontSize: 12, color: T.text }}>{a.endDate?.slice(0, 10) ?? '—'}</span>
                </div>
                <Select value={a.status} onValueChange={(v) => updateAssignment.mutate({ id: a.id, data: { status: v as ProgramAssignmentStatus } })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <ScoreboardIconButton icon={Trash2} label="Remove" onClick={() => deleteAssignment.mutate(a.id)} disabled={deletingAssignmentId === a.id} />
              </RowCard>
            ))}
          </RowCardList>
        </ScoreCard>
      )}

      {section === 'programs' && libraryConfig.data && (
        <ScoreCard
          title={`Programs · ${programs.data?.length ?? 0}`}
          subtitle="Reusable workout templates for your branch — build one here, then assign it to members from Assigned Programs"
          action={
            <ScoreboardCta icon={Plus} onClick={() => setCreateProgramOpen(true)}>
              Create Program
            </ScoreboardCta>
          }
        >
          <RowCardList
            isLoading={programs.isLoading}
            isError={programs.isError}
            onRetry={programs.refetch}
            isEmpty={!programs.isLoading && !programs.isError && (programs.data?.length ?? 0) === 0}
            emptyMessage="No training programs yet — create one to start building workouts for your members."
          >
            {programs.data?.map((p) => (
              <RowCard key={p.id} columns="1.6fr 1fr 1fr 0.8fr auto">
                <div style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{p.goal}</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{p.difficultyLevel}</div>
                <div style={{ ...mono, fontSize: 12, color: T.text }}>{p.days.length} days</div>
                <ScoreboardIconButton icon={Trash2} label="Remove" onClick={() => deleteProgram.mutate(p.id)} disabled={deletingProgramId === p.id} />
              </RowCard>
            ))}
          </RowCardList>
        </ScoreCard>
      )}

      {section === 'exercises' && !libraryConfig.isLoading && !libraryConfig.data && (
        <ScoreCard title="Exercise Library" subtitle="Every exercise your branch has added">
          <ExerciseLibrarySetupPrompt onConfigure={() => setConfigureLibraryOpen(true)} />
        </ScoreCard>
      )}

      {section === 'exercises' && (libraryConfig.isLoading || libraryConfig.data) && (
        <ScoreCard
          title={`Exercise Library · ${exercises.data?.length ?? 0}`}
          subtitle={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>Every exercise your branch has added — pick from these when building a program</span>
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
                  title="Dev-only: wipes the exercise library setup for testing"
                  onClick={() => {
                    if (window.confirm('[Dev only] Permanently delete this gym\'s exercise library setup? This does not delete any exercises already added.')) {
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
            <ScoreboardCta icon={Plus} onClick={() => setCreateExerciseOpen(true)}>
              Add Exercise
            </ScoreboardCta>
          }
        >
          <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 820 }}>
            <Input
              placeholder="Search exercises..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="h-8 w-56 text-xs"
            />
            <Select value={exerciseCategoryFilter || 'any'} onValueChange={(v) => setExerciseCategoryFilter(v === 'any' ? '' : v)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any category</SelectItem>
                {EXERCISE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={exerciseGoalFilter || 'any'} onValueChange={(v) => setExerciseGoalFilter(v === 'any' ? '' : v)}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Goal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any goal</SelectItem>
                {FITNESS_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={exerciseEquipmentFilter || 'any'} onValueChange={(v) => setExerciseEquipmentFilter(v === 'any' ? '' : v)}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Equipment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any equipment</SelectItem>
                {EQUIPMENT_TYPES.map((eq) => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={exerciseDifficultyFilter || 'any'} onValueChange={(v) => setExerciseDifficultyFilter(v === 'any' ? '' : v)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any difficulty</SelectItem>
                {EXERCISE_DIFFICULTY.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={exerciseMuscleFilter || 'any'} onValueChange={(v) => setExerciseMuscleFilter(v === 'any' ? '' : v)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Muscle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any muscle</SelectItem>
                {MUSCLE_GROUPS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={exerciseActiveFilter || 'any'} onValueChange={(v) => setExerciseActiveFilter(v === 'any' ? '' : v)}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <RowCardList
            isLoading={exercises.isLoading || libraryConfig.isLoading}
            isError={exercises.isError}
            onRetry={exercises.refetch}
            isEmpty={!exercises.isLoading && !exercises.isError && (filteredExercises?.length ?? 0) === 0}
            emptyMessage={exerciseSearch ? 'No exercises match your search.' : 'No exercises yet — click "Add Exercise" to create your first one.'}
          >
            {filteredExercises?.map((e) => (
              <RowCard key={e.id} columns="1.3fr 0.8fr 0.8fr 0.7fr 0.6fr auto">
                <div style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>{e.name}</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{e.category}</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{e.muscleGroup ?? '—'}</div>
                <div style={{ fontSize: 13.5, color: T.dim }}>{e.difficultyLevel ?? '—'}</div>
                <div style={{ fontSize: 13.5, color: e.isActive ? T.dim : T.signal }}>{e.isActive ? 'Active' : 'Inactive'}</div>
                <ScoreboardIconButton icon={Trash2} onClick={() => deleteExercise.mutate(e.id)} disabled={deletingExerciseId === e.id} />
              </RowCard>
            ))}
          </RowCardList>
        </ScoreCard>
      )}

      <AssignTrainingProgramDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        memberOptions={members}
        trainerOptions={trainers}
        programOptions={programs.data ?? []}
      />

      <CreateTrainingProgramDialog
        open={createProgramOpen}
        onClose={() => setCreateProgramOpen(false)}
        fixedBranchId={gymContext?.branchId ? Number(gymContext.branchId) : undefined}
        libraryCatalog={libraryConfig.data?.config.categories}
      />

      <CreateExerciseDialog
        open={createExerciseOpen}
        onClose={() => setCreateExerciseOpen(false)}
        libraryCatalog={libraryConfig.data?.config.categories}
      />

      <ConfigureExerciseLibraryDialog
        open={configureLibraryOpen}
        onClose={() => setConfigureLibraryOpen(false)}
        existingConfig={libraryConfig.data}
      />

      <ViewExerciseLibraryDialog
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
