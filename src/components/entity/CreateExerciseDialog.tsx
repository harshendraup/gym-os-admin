import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useCreateExercise } from '@/hooks/useExercises'
import type { ExerciseCategory, MuscleGroup, ExerciseDifficulty } from '@/api/exercises.api'
import {
  getCatalogCategories, getCatalogGroups, getCatalogEquipment, getCatalogExercises,
  getCategoryForGroup, resolveLibraryExercise,
} from '@/data/exerciseLibrary'
import {
  listConfiguredCategories, listConfiguredGroups, listConfiguredEquipment, listConfiguredExercises,
  getConfiguredCategoryForGroup, resolveConfiguredExercise,
} from '@/data/gymExerciseLibrary'
import type { GymLibraryCategory } from '@/api/exercise-library-config.api'
import {
  MUSCLE_GROUPS, EXERCISE_DIFFICULTY as DIFFICULTIES, TRACKING_METRICS, TRACKING_METRIC_LABELS,
} from '../constants'

const schema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  category: z.enum(['Strength', 'Cardio', 'Mobility', 'Flexibility', 'Balance']),
  muscleGroup: z.string().optional(),
  difficultyLevel: z.string().optional(),
  equipment: z.string().optional(),
  videoUrl: z.string().optional(),
  instructions: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface CreateExerciseDialogProps {
  open: boolean
  onClose: () => void
  /** When added from inside the program builder, hand the new exercise back so it can be added to the day immediately. */
  onCreated?: (exerciseId: number) => void
  /**
   * When provided, the picker is scoped to this business's configured
   * exercise library instead of the full master catalog — the flow used by
   * the gated "Exercise Library" tab. Omitted everywhere else (e.g. the
   * program builder's quick-add), which keeps browsing the full catalog.
   */
  libraryCatalog?: GymLibraryCategory[]
}

export function CreateExerciseDialog({ open, onClose, onCreated, libraryCatalog }: CreateExerciseDialogProps) {
  const create = useCreateExercise()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const muscleGroup = watch('muscleGroup')
  const difficultyLevel = watch('difficultyLevel')
  const [trackingMetric, setTrackingMetric] = useState<string>('weight_reps')
  const [isActive, setIsActive] = useState(true)

  // Cascading library picker: Category -> Group -> Equipment -> Exercise.
  // Each level's options are derived from exercisesData.json, never hardcoded.
  const [pickCategory, setPickCategory] = useState('')
  const [pickGroup, setPickGroup] = useState('')
  const [pickEquipment, setPickEquipment] = useState('')
  const [pickExercise, setPickExercise] = useState('')

  const catalogCategories = libraryCatalog ? listConfiguredCategories(libraryCatalog) : getCatalogCategories()
  const catalogGroups = libraryCatalog ? listConfiguredGroups(libraryCatalog, pickCategory) : getCatalogGroups(pickCategory)
  const catalogEquipment = libraryCatalog
    ? listConfiguredEquipment(libraryCatalog, pickCategory, pickGroup)
    : getCatalogEquipment(pickCategory, pickGroup)
  const catalogExercises = libraryCatalog
    ? listConfiguredExercises(libraryCatalog, pickCategory, pickGroup).map((ex) => ({ name: ex.name, target_muscle: ex.targetMuscle }))
    : getCatalogExercises(pickCategory, pickGroup)

  const resetPicker = () => {
    setPickCategory('')
    setPickGroup('')
    setPickEquipment('')
    setPickExercise('')
  }

  const handlePickCategory = (id: string) => {
    setPickCategory(id)
    setPickGroup('')
    setPickEquipment('')
    setPickExercise('')
  }

  const handlePickGroup = (id: string) => {
    setPickGroup(id)
    setPickEquipment('')
    setPickExercise('')
    const groupCategory = libraryCatalog
      ? getConfiguredCategoryForGroup(libraryCatalog, pickCategory, id)
      : getCategoryForGroup(pickCategory, id)
    if (groupCategory) setValue('category', groupCategory)
  }

  const handlePickEquipment = (name: string) => {
    setPickEquipment(name)
    setValue('equipment', name)
  }

  const handlePickExercise = (name: string) => {
    setPickExercise(name)
    const match = libraryCatalog
      ? resolveConfiguredExercise(libraryCatalog, pickCategory, pickGroup, name, pickEquipment || undefined)
      : resolveLibraryExercise(pickCategory, pickGroup, name, pickEquipment || undefined)
    if (match) {
      setValue('name', match.name)
      setValue('category', match.category)
      if (match.muscleGroup) setValue('muscleGroup', match.muscleGroup)
      if (match.equipment) setValue('equipment', match.equipment)
    }
  }

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        category: 'Strength',
        muscleGroup: '',
        difficultyLevel: '',
        equipment: '',
        videoUrl: '',
        instructions: '',
      })
      resetPicker()
      setTrackingMetric('weight_reps')
      setIsActive(true)
    }
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        name: values.name,
        category: values.category as ExerciseCategory,
        muscleGroup: (values.muscleGroup || undefined) as MuscleGroup | undefined,
        difficultyLevel: (values.difficultyLevel || undefined) as ExerciseDifficulty | undefined,
        equipment: values.equipment || undefined,
        trackingMetric: trackingMetric as any,
        isActive,
        videoUrl: values.videoUrl || undefined,
        instructions: values.instructions || undefined,
      },
      {
        onSuccess: (created) => {
          onCreated?.(created.id)
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3 rounded-md border border-dashed border-input p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {libraryCatalog ? "Browse Your Gym's Exercise Library (optional)" : 'Browse Exercise Library (optional)'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={pickCategory || undefined} onValueChange={handlePickCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {catalogCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Group</Label>
                <Select value={pickGroup || undefined} onValueChange={handlePickGroup} disabled={!pickCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={pickCategory ? 'Select group' : 'Select category first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogGroups.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">No groups available</p>
                    ) : (
                      catalogGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Equipment</Label>
                <Select value={pickEquipment || undefined} onValueChange={handlePickEquipment} disabled={!pickGroup}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !pickGroup ? 'Select group first' : catalogEquipment.length === 0 ? 'No equipment listed' : 'Any equipment'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogEquipment.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">No equipment listed for this group</p>
                    ) : (
                      catalogEquipment.map((eq) => (
                        <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Exercise</Label>
                <Select value={pickExercise || undefined} onValueChange={handlePickExercise} disabled={!pickGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder={!pickGroup ? 'Select group first' : 'Select exercise'} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogExercises.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">No exercises found for this group</p>
                    ) : (
                      catalogExercises.map((ex) => (
                        <SelectItem key={ex.name} value={ex.name}>{ex.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Exercise Name</Label>
            <Input placeholder="Barbell Bench Press" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Muscle Group</Label>
              <Select value={muscleGroup || undefined} onValueChange={(v) => setValue('muscleGroup', v)}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficultyLevel || undefined} onValueChange={(v) => setValue('difficultyLevel', v)}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tracking Metric</Label>
              <Select value={trackingMetric} onValueChange={setTrackingMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRACKING_METRICS.map((m) => (
                    <SelectItem key={m} value={m}>{TRACKING_METRIC_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <label className="flex h-9 items-center gap-2 text-sm">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-input" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active (selectable in Program Builder)
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Video URL</Label>
            <Input placeholder="https://..." {...register('videoUrl')} />
          </div>

          <div className="space-y-1.5">
            <Label>Instructions</Label>
            <Textarea placeholder="Form cues, setup notes..." {...register('instructions')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Adding...' : 'Add Exercise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
