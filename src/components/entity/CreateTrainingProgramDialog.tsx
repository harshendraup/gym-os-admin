import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from '@/components/ui/select'
import { CreateExerciseDialog } from './CreateExerciseDialog'
import { useExercises } from '@/hooks/useExercises'
import { useCreateTrainingProgram } from '@/hooks/useTrainingPrograms'
import type { BranchRecord } from '@/api/branches.api'
import type {
  TrainingProgramGoal, TrainingProgramDifficulty, ProgramDayInput,
} from '@/api/training-programs.api'
import type { ExerciseCategory } from '@/api/exercises.api'
import type { GymLibraryCategory } from '@/api/exercise-library-config.api'
import { FITNESS_GOALS, DIFFICULTY_LEVELS as DIFFICULTIES, EXERCISE_CATEGORIES as CATEGORY_ORDER, EQUIPMENT_TYPES, WEEKDAYS } from '../constants'

interface ExerciseDraft {
  key: string
  exerciseId: string
  sets: string
  reps: string
  restSeconds: string
  weightGuidance: string
  tempo: string
  notes: string
}

interface DayDraft {
  key: string
  dayName: string
  dayOfWeek: string
  restDay: boolean
  exercises: ExerciseDraft[]
}

let draftKeySeq = 0
const nextKey = () => String(draftKeySeq++)

function emptyExercise(): ExerciseDraft {
  return { key: nextKey(), exerciseId: '', sets: '', reps: '', restSeconds: '', weightGuidance: '', tempo: '', notes: '' }
}

function emptyDay(dayNumber: number): DayDraft {
  return { key: nextKey(), dayName: `Day ${dayNumber}`, dayOfWeek: '', restDay: false, exercises: [emptyExercise()] }
}

interface CreateTrainingProgramDialogProps {
  open: boolean
  onClose: () => void
  /** Branches the acting user may create a program for. Omit and pass fixedBranchId for a branch-locked role (sub_admin). */
  branchOptions?: BranchRecord[]
  fixedBranchId?: number
  /** The gym's Set Up Exercise Library selection — passed through to the embedded "+ New Exercise" dialog so it offers the same scoped list as everywhere else. */
  libraryCatalog?: GymLibraryCategory[]
}

/**
 * Builds a training program template — name/goal/duration plus a Day 1 /
 * Day 2 / ... structure, each day holding a set of exercises with their
 * prescription (sets/reps/rest/weight/tempo/instructions). Days live as
 * local draft state rather than react-hook-form's field arrays, since the
 * exercise-within-day nesting is two levels deep; the whole draft is
 * assembled into one payload on submit, matching what the backend's nested
 * `days` array expects.
 */
export function CreateTrainingProgramDialog({
  open,
  onClose,
  branchOptions,
  fixedBranchId,
  libraryCatalog,
}: CreateTrainingProgramDialogProps) {
  const { data: exercises = [] } = useExercises()
  const create = useCreateTrainingProgram()
  const [addExerciseForDay, setAddExerciseForDay] = useState<string | null>(null)
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set())

  const [branchId, setBranchId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState<TrainingProgramGoal>('General Health & Fitness')
  const [durationWeeks, setDurationWeeks] = useState('')
  const [difficultyLevel, setDifficultyLevel] = useState<TrainingProgramDifficulty>('Beginner')
  const [days, setDays] = useState<DayDraft[]>([emptyDay(1)])
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setBranchId(fixedBranchId ? String(fixedBranchId) : '')
      setName('')
      setDescription('')
      setGoal('General Health & Fitness')
      setDurationWeeks('')
      setDifficultyLevel('Beginner')
      setDays([emptyDay(1)])
      setError('')
      setExpandedDetails(new Set())
    }
  }, [open, fixedBranchId])

  // Goal/equipment/difficulty filters narrow the picker to help the trainer
  // find relevant exercises — they never hard-block a selection, and reset
  // to "Any" always still shows the full active library.
  const [pickerGoalFilter, setPickerGoalFilter] = useState('')
  const [pickerEquipmentFilter, setPickerEquipmentFilter] = useState('')
  const [pickerDifficultyFilter, setPickerDifficultyFilter] = useState('')

  // Grouped by category so a gym with a large library can scan by type
  // instead of hunting through one long alphabetical list. Inactive
  // exercises are never selectable here, regardless of filters.
  const groupedExercises = useMemo(() => {
    const filtered = exercises.filter((ex) => {
      if (ex.isActive === false) return false
      if (pickerGoalFilter && !ex.goals?.includes(pickerGoalFilter as any)) return false
      if (pickerEquipmentFilter && !(ex.equipmentTags ?? []).includes(pickerEquipmentFilter as any)) return false
      if (pickerDifficultyFilter && ex.difficultyLevel !== pickerDifficultyFilter) return false
      return true
    })
    const byCategory = new Map<ExerciseCategory, typeof exercises>()
    for (const ex of filtered) {
      const list = byCategory.get(ex.category) ?? []
      list.push(ex)
      byCategory.set(ex.category, list)
    }
    return CATEGORY_ORDER.map((category) => ({ category, items: byCategory.get(category) ?? [] })).filter(
      (g) => g.items.length > 0
    )
  }, [exercises, pickerGoalFilter, pickerEquipmentFilter, pickerDifficultyFilter])

  const updateDay = (key: string, patch: Partial<DayDraft>) =>
    setDays((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  const updateExercise = (dayKey: string, exKey: string, patch: Partial<ExerciseDraft>) =>
    setDays((prev) =>
      prev.map((d) =>
        d.key !== dayKey
          ? d
          : { ...d, exercises: d.exercises.map((e) => (e.key === exKey ? { ...e, ...patch } : e)) }
      )
    )

  const addDay = () => setDays((prev) => [...prev, emptyDay(prev.length + 1)])
  const removeDay = (key: string) => setDays((prev) => prev.filter((d) => d.key !== key))
  const addExercise = (dayKey: string) =>
    setDays((prev) =>
      prev.map((d) => (d.key === dayKey ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d))
    )
  const removeExercise = (dayKey: string, exKey: string) =>
    setDays((prev) =>
      prev.map((d) => (d.key === dayKey ? { ...d, exercises: d.exercises.filter((e) => e.key !== exKey) } : d))
    )
  const moveDay = (index: number, direction: -1 | 1) =>
    setDays((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  const toggleDetails = (exKey: string) =>
    setExpandedDetails((prev) => {
      const next = new Set(prev)
      next.has(exKey) ? next.delete(exKey) : next.add(exKey)
      return next
    })

  // A brand-new exercise created via "+ New Exercise" is appended as its own
  // pre-filled row on the day that triggered it, rather than asking the user
  // to find it again in the picker they just left.
  const handleExerciseCreated = (exerciseId: number) => {
    if (!addExerciseForDay) return
    const dayKey = addExerciseForDay
    setDays((prev) =>
      prev.map((d) => (d.key !== dayKey ? d : { ...d, exercises: [...d.exercises, { ...emptyExercise(), exerciseId: String(exerciseId) }] }))
    )
    setAddExerciseForDay(null)
  }

  const onSubmit = () => {
    setError('')
    if (!branchId) return setError('Select a branch')
    if (!name.trim()) return setError('Program name is required')

    const payloadDays: ProgramDayInput[] = days.map((d, dayIndex) => ({
      dayNumber: dayIndex + 1,
      dayOfWeek: d.dayOfWeek ? Number(d.dayOfWeek) : undefined,
      dayName: d.dayName || undefined,
      restDay: d.restDay,
      orderIndex: dayIndex,
      exercises: d.restDay
        ? []
        : d.exercises
            .filter((e) => e.exerciseId)
            .map((e, exIndex) => ({
              exerciseId: Number(e.exerciseId),
              sets: e.sets ? Number(e.sets) : undefined,
              reps: e.reps || undefined,
              restSeconds: e.restSeconds ? Number(e.restSeconds) : undefined,
              weightGuidance: e.weightGuidance || undefined,
              tempo: e.tempo || undefined,
              notes: e.notes || undefined,
              orderIndex: exIndex,
            })),
    }))

    create.mutate(
      {
        branchId: Number(branchId),
        name: name.trim(),
        description: description || undefined,
        goal,
        durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
        difficultyLevel,
        days: payloadDays,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Training Program</DialogTitle>
          </DialogHeader>
          <p className="-mt-1 text-sm text-muted-foreground">
            Build a reusable workout template — give it a name and goal, lay out each training day, and pick the
            exercises for it. You'll assign it to specific members afterwards from Assigned Programs.
          </p>

          <div className="space-y-4">
            {!fixedBranchId && (
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="Select a branch..." /></SelectTrigger>
                  <SelectContent>
                    {branchOptions?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.branchName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Program Name</Label>
              <Input placeholder="Push Pull Legs" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Overview, notes for the coaching staff..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Goal</Label>
                <Select value={goal} onValueChange={(v) => setGoal(v as TrainingProgramGoal)}>
                  <SelectTrigger><SelectValue placeholder="Select Goal"/></SelectTrigger>
                  <SelectContent>
                    {FITNESS_GOALS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={difficultyLevel} onValueChange={(v) => setDifficultyLevel(v as TrainingProgramDifficulty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (weeks)</Label>
                <Input type="number" placeholder="8" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-base">Training Days</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addDay}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Day
                  </Button>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Add each training day — e.g. Push Day, Pull Day, Leg Day — and the exercises members should do on it.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-input p-2.5">
                <span className="text-xs font-medium text-muted-foreground">Exercise picker filters:</span>
                <Select value={pickerGoalFilter || 'any'} onValueChange={(v) => setPickerGoalFilter(v === 'any' ? '' : v)}>
                  <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="Goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any goal</SelectItem>
                    <SelectItem value={goal}>Program goal ({goal})</SelectItem>
                    {FITNESS_GOALS.filter((g) => g !== goal).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={pickerEquipmentFilter || 'any'} onValueChange={(v) => setPickerEquipmentFilter(v === 'any' ? '' : v)}>
                  <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Equipment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any equipment</SelectItem>
                    {EQUIPMENT_TYPES.map((eq) => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={pickerDifficultyFilter || 'any'} onValueChange={(v) => setPickerDifficultyFilter(v === 'any' ? '' : v)}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any difficulty</SelectItem>
                    {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(pickerGoalFilter || pickerEquipmentFilter || pickerDifficultyFilter) && (
                  <Button
                    type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                    onClick={() => { setPickerGoalFilter(''); setPickerEquipmentFilter(''); setPickerDifficultyFilter('') }}
                  >
                    Clear filters
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  Only active exercises are shown — filters narrow the list, they never block a manual pick.
                </span>
              </div>

              {days.map((day, dayIndex) => (
                <div key={day.key} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <Button type="button" size="icon" variant="ghost" className="h-4 w-6" disabled={dayIndex === 0} onClick={() => moveDay(dayIndex, -1)}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-4 w-6" disabled={dayIndex === days.length - 1} onClick={() => moveDay(dayIndex, 1)}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-14">Day {dayIndex + 1}</span>
                    <Input
                      className="min-w-32 flex-1"
                      placeholder="Push Day"
                      value={day.dayName}
                      onChange={(e) => updateDay(day.key, { dayName: e.target.value })}
                    />
                    <Select value={day.dayOfWeek || 'sequence'} onValueChange={(value) => updateDay(day.key, { dayOfWeek: value === 'sequence' ? '' : value })}>
                      <SelectTrigger className="h-9 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequence">Auto sequence</SelectItem>
                        {WEEKDAYS.map((weekday) => <SelectItem key={weekday.value} value={String(weekday.value)}>{weekday.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-input"
                        checked={day.restDay}
                        onChange={(e) => updateDay(day.key, { restDay: e.target.checked })}
                      />
                      Rest day
                    </label>
                    {days.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeDay(day.key)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {!day.restDay && (
                    <div className="space-y-2 pl-8">
                      {day.exercises.map((ex) => {
                        const detailsOpen = expandedDetails.has(ex.key)
                        return (
                          <div key={ex.key} className="space-y-1.5">
                            <div className="grid grid-cols-[1.6fr_0.6fr_0.7fr_0.7fr_auto_auto] gap-2 items-center">
                              <Select value={ex.exerciseId} onValueChange={(v) => updateExercise(day.key, ex.key, { exerciseId: v })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Exercise..." /></SelectTrigger>
                                <SelectContent>
                                  {groupedExercises.map(({ category, items }) => (
                                    <SelectGroup key={category}>
                                      <SelectLabel>{category}</SelectLabel>
                                      {items.map((x) => (
                                        <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input className="h-8 text-xs" placeholder="Sets" type="number" value={ex.sets} onChange={(e) => updateExercise(day.key, ex.key, { sets: e.target.value })} />
                              <Input className="h-8 text-xs" placeholder="Reps" value={ex.reps} onChange={(e) => updateExercise(day.key, ex.key, { reps: e.target.value })} />
                              <Input className="h-8 text-xs" placeholder="Rest (s)" type="number" value={ex.restSeconds} onChange={(e) => updateExercise(day.key, ex.key, { restSeconds: e.target.value })} />
                              <Button
                                type="button"
                                size="icon"
                                variant={detailsOpen ? 'secondary' : 'ghost'}
                                title="Weight, tempo & instructions"
                                onClick={() => toggleDetails(ex.key)}
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                              </Button>
                              <Button type="button" size="icon" variant="ghost" onClick={() => removeExercise(day.key, ex.key)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>

                            {detailsOpen && (
                              <div className="grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-2">
                                <Input
                                  className="h-8 bg-white text-xs"
                                  placeholder="Weight (e.g. 20kg or RPE 8)"
                                  value={ex.weightGuidance}
                                  onChange={(e) => updateExercise(day.key, ex.key, { weightGuidance: e.target.value })}
                                />
                                <Input
                                  className="h-8 bg-white text-xs"
                                  placeholder="Tempo (e.g. 3-1-1)"
                                  value={ex.tempo}
                                  onChange={(e) => updateExercise(day.key, ex.key, { tempo: e.target.value })}
                                />
                                <Input
                                  className="h-8 bg-white text-xs"
                                  placeholder="Instructions / form cues"
                                  value={ex.notes}
                                  onChange={(e) => updateExercise(day.key, ex.key, { notes: e.target.value })}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => addExercise(day.key)}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add Exercise
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setAddExerciseForDay(day.key)}>
                          + New Exercise (library)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={onSubmit} disabled={create.isPending}>
              {create.isPending ? 'Creating...' : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateExerciseDialog
        open={addExerciseForDay !== null}
        onClose={() => setAddExerciseForDay(null)}
        onCreated={handleExerciseCreated}
        libraryCatalog={libraryCatalog}
      />
    </>
  )
}
