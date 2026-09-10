import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { StepLabel } from '@/components/entity/StepLabel'
import { AssignTrainingProgramDialog } from '@/components/entity/AssignTrainingProgramDialog'
import { CreateTrainingProgramDialog } from '@/components/entity/CreateTrainingProgramDialog'
import { CreateExerciseDialog } from '@/components/entity/CreateExerciseDialog'
import { ExerciseLibrarySetupPrompt } from '@/components/entity/ExerciseLibrarySetupPrompt'
import { ConfigureExerciseLibraryDialog } from '@/components/entity/ConfigureExerciseLibraryDialog'
import { ViewExerciseLibraryDialog } from '@/components/entity/ViewExerciseLibraryDialog'
import { useProgramAssignments, useDeleteProgramAssignment, useUpdateProgramAssignment } from '@/hooks/useProgramAssignments'
import { useTrainingPrograms, useDeleteTrainingProgram } from '@/hooks/useTrainingPrograms'
import { useExercises, useDeleteExercise } from '@/hooks/useExercises'
import { useExerciseLibraryConfig, useDeleteExerciseLibraryConfig } from '@/hooks/useExerciseLibraryConfig'
import { useUsersByRole } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useBranches } from '@/hooks/useBranches'
import { useAuthStore } from '@/store/auth.store'
import type { ProgramAssignmentRecord, ProgramAssignmentStatus } from '@/api/program-assignments.api'
import type { TrainingProgramRecord } from '@/api/training-programs.api'
import type { ExerciseRecord } from '@/api/exercises.api'
import type { ManagedUser } from '@/api/user-management.api'

const STATUSES: ProgramAssignmentStatus[] = ['active', 'paused', 'completed', 'cancelled']

function findUser(users: ManagedUser[], id: number | null) {
  if (!id) return undefined
  return users.find((u) => u.id === String(id))
}

function assignmentColumns(
  memberName: (id: number) => string,
  trainerName: (id: number | null) => string,
  programName: (id: number) => string,
  onStatusChange: (a: ProgramAssignmentRecord, status: ProgramAssignmentStatus) => void,
  onDelete: (a: ProgramAssignmentRecord) => void,
  deletingId: number | null
): ColumnDef<ProgramAssignmentRecord>[] {
  return [
    { header: 'Program', cell: ({ row }) => <span className="font-medium text-slate-900">{programName(row.original.trainingProgramId)}</span> },
    { header: 'Member', cell: ({ row }) => memberName(row.original.memberId) },
    { header: 'Trainer', cell: ({ row }) => trainerName(row.original.trainerId) },
    { header: 'Start', cell: ({ row }) => row.original.startDate.slice(0, 10) },
    { header: 'End', cell: ({ row }) => row.original.endDate?.slice(0, 10) ?? '—' },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Select value={row.original.status} onValueChange={(v) => onStatusChange(row.original, v as ProgramAssignmentStatus)}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
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

function programColumns(
  onDelete: (p: TrainingProgramRecord) => void,
  deletingId: number | null
): ColumnDef<TrainingProgramRecord>[] {
  return [
    { header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
    { header: 'Goal', cell: ({ row }) => row.original.goal },
    { header: 'Difficulty', cell: ({ row }) => row.original.difficultyLevel },
    { header: 'Duration', cell: ({ row }) => row.original.durationWeeks ? `${row.original.durationWeeks} wks` : '—' },
    { header: 'Days', cell: ({ row }) => row.original.days.length },
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

function exerciseColumns(
  onDelete: (e: ExerciseRecord) => void,
  deletingId: number | null
): ColumnDef<ExerciseRecord>[] {
  return [
    { header: 'Name', cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span> },
    { header: 'Category', cell: ({ row }) => row.original.category },
    { header: 'Muscle Group', cell: ({ row }) => row.original.muscleGroup ?? '—' },
    { header: 'Difficulty', cell: ({ row }) => row.original.difficultyLevel ?? '—' },
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

export default function AdminTrainingProgramsPage() {
  const gymContext = useAuthStore((s) => s.gymContext)
  const { memberRole, trainerRole } = useRoles()
  const { data: members = [] } = useUsersByRole(memberRole?.id)
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)
  const { data: branches = [] } = useBranches(gymContext?.businessId)

  const assignments = useProgramAssignments()
  const programs = useTrainingPrograms()
  const exercises = useExercises()
  const libraryConfig = useExerciseLibraryConfig()

  const deleteAssignment = useDeleteProgramAssignment()
  const updateAssignment = useUpdateProgramAssignment()
  const deleteProgram = useDeleteTrainingProgram()
  const deleteExercise = useDeleteExercise()
  const deleteLibrary = useDeleteExerciseLibraryConfig()

  const [assignOpen, setAssignOpen] = useState(false)
  const [createProgramOpen, setCreateProgramOpen] = useState(false)
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false)
  const [configureLibraryOpen, setConfigureLibraryOpen] = useState(false)
  const [viewLibraryOpen, setViewLibraryOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')

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

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase()
    if (!q) return exercises.data
    return exercises.data?.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.muscleGroup?.toLowerCase().includes(q)
    )
  }, [exercises.data, exerciseSearch])

  return (
    <div className="relative -m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden lg:-m-8 lg:h-[calc(100%+4rem)]">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/videos/gym-training.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-50/75" aria-hidden="true" />
      <div className="relative z-10 flex-1 overflow-auto p-6">
        {/* <Header title="Training Programs" /> */}
        <Tabs defaultValue="exercises" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exercises">
              <StepLabel step={1} label="Exercise Library" done={!!libraryConfig.data} />
            </TabsTrigger>
            {libraryConfig.data && (
              <>
                <TabsTrigger value="programs">
                  <StepLabel step={2} label="Programs" done={(programs.data?.length ?? 0) > 0} />
                </TabsTrigger>
                <TabsTrigger value="assignments">
                  <StepLabel step={3} label="Assigned Programs" done={(assignments.data?.length ?? 0) > 0} />
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="exercises">
            {!libraryConfig.isLoading && !libraryConfig.data ? (
              <ExerciseLibrarySetupPrompt onConfigure={() => setConfigureLibraryOpen(true)} />
            ) : (
              <EntityListPage
                title="Exercise Library"
                description="Every exercise your gym has added — pick from these when building a training program."
                columns={exerciseColumns(
                  (e) => deleteExercise.mutate(e.id),
                  deleteExercise.isPending ? (deleteExercise.variables ?? null) : null
                )}
                data={filteredExercises}
                isLoading={exercises.isLoading || libraryConfig.isLoading}
                isError={exercises.isError}
                onRetry={exercises.refetch}
                emptyMessage={exerciseSearch ? 'No exercises match your search.' : 'No exercises yet — click "Add Exercise" to create your first one.'}
                actions={
                  <Button size="sm" onClick={() => setCreateExerciseOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add Exercise
                  </Button>
                }
                toolbar={
                  <>
                    <div className="relative w-56">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search exercises..."
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
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
                        title="Dev-only: wipes the exercise library setup for testing"
                        onClick={() => {
                          if (window.confirm('[Dev only] Permanently delete this gym\'s exercise library setup? This does not delete any exercises already added.')) {
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

          {libraryConfig.data && (
            <>
              <TabsContent value="programs">
                <EntityListPage
                  title="Programs"
                  description="Reusable workout templates for your gym. Build one here, then assign it to specific members from Assigned Programs."
                  columns={programColumns(
                    (p) => deleteProgram.mutate(p.id),
                    deleteProgram.isPending ? (deleteProgram.variables ?? null) : null
                  )}
                  data={programs.data}
                  isLoading={programs.isLoading}
                  isError={programs.isError}
                  onRetry={programs.refetch}
                  emptyMessage="No training programs yet — create one to start building workouts for your members."
                  actions={
                    <Button size="sm" onClick={() => setCreateProgramOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Create Program
                    </Button>
                  }
                />
              </TabsContent>

              <TabsContent value="assignments">
                <EntityListPage
                  title="Assigned Programs"
                  description="Which members are currently following a training program, and since when."
                  columns={assignmentColumns(
                    memberName,
                    trainerName,
                    programName,
                    (a, status) => updateAssignment.mutate({ id: a.id, data: { status } }),
                    (a) => deleteAssignment.mutate(a.id),
                    deleteAssignment.isPending ? (deleteAssignment.variables ?? null) : null
                  )}
                  data={assignments.data}
                  isLoading={assignments.isLoading || programs.isLoading}
                  isError={assignments.isError}
                  onRetry={assignments.refetch}
                  emptyMessage="No members are on a program yet — assign your first training program."
                  actions={
                    <Button size="sm" onClick={() => setAssignOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Assign to a Member
                    </Button>
                  }
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

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
        branchOptions={branches}
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
    </div>
  )
}
