import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms'
import { useExercises } from '@/hooks/useExercises'
import type { TrainingProgramRecord } from '@/api/training-programs.api'
import type { ExerciseRecord } from '@/api/exercises.api'

export default function TrainerLibrariesPage() {
  const [search, setSearch] = useState('')
  const programs = useTrainingPrograms()
  const exercises = useExercises()
  const query = search.trim().toLowerCase()
  const filteredExercises = useMemo(() => !query ? exercises.data : exercises.data?.filter((exercise) => [exercise.name, exercise.category, exercise.muscleGroup].filter(Boolean).some((value) => value!.toLowerCase().includes(query))), [exercises.data, query])
  const programColumns: ColumnDef<TrainingProgramRecord>[] = [
    { header: 'Program', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { header: 'Goal', cell: ({ row }) => row.original.goal },
    { header: 'Difficulty', cell: ({ row }) => row.original.difficultyLevel },
    { header: 'Duration', cell: ({ row }) => row.original.durationWeeks ? `${row.original.durationWeeks} weeks` : '—' },
    { header: 'Days', cell: ({ row }) => row.original.days.length },
  ]
  const exerciseColumns: ColumnDef<ExerciseRecord>[] = [
    { header: 'Exercise', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { header: 'Category', cell: ({ row }) => row.original.category },
    { header: 'Muscle group', cell: ({ row }) => row.original.muscleGroup ?? '—' },
    { header: 'Difficulty', cell: ({ row }) => row.original.difficultyLevel ?? '—' },
  ]

  return (
    <Tabs defaultValue="programs" className="space-y-4">
      <TabsList><TabsTrigger value="programs">Training Programs</TabsTrigger><TabsTrigger value="exercises">Exercise Library</TabsTrigger></TabsList>
      <TabsContent value="programs">
        <EntityListPage title="Training Programs" description="Programs available for members in your branch." columns={programColumns} data={programs.data} isLoading={programs.isLoading} isError={programs.isError} onRetry={() => void programs.refetch()} emptyMessage="No training programs are available." />
      </TabsContent>
      <TabsContent value="exercises">
        <EntityListPage title="Exercise Library" description="Exercises available for coaching and assigned programs." columns={exerciseColumns} data={filteredExercises} isLoading={exercises.isLoading} isError={exercises.isError} onRetry={() => void exercises.refetch()} emptyMessage="No exercises are available." toolbar={<Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exercises" className="max-w-xs" />} />
      </TabsContent>
    </Tabs>
  )
}