import { useEffect, useMemo } from 'react'
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ExerciseMultiSelect } from './ExerciseMultiSelect'
import { useSaveMemberFitnessPreferences } from '@/hooks/useMemberFitnessPreferences'
import { useBodyMeasurementsForMember } from '@/hooks/useBodyMeasurements'
import type {
  FitnessLevel, GymExperienceLevel, FitnessGoal, MemberFitnessPreferenceRecord,
} from '@/api/member-fitness-preferences.api'
import type { ManagedUser } from '@/api/user-management.api'

const FITNESS_LEVELS: FitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced']
const GYM_EXPERIENCE_LEVELS: GymExperienceLevel[] = ['Less than 6 months', '6-12 months', '1-3 years', '3+ years']
const FITNESS_GOALS: FitnessGoal[] = [
  'Weight Loss', 'Fat Loss', 'Muscle Gain', 'Strength', 'Bodybuilding',
  'General Fitness', 'Endurance', 'Mobility/Flexibility', 'Sports Performance', 'Weight Maintenance',
]
const GOAL_TIMELINES = ['1 Month', '3 Months', '6 Months', '1 Year', 'Ongoing']
const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Functional', 'Mobility', 'Flexibility', 'Bodybuilding']
const DURATIONS = [30, 45, 60, 75, 90]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const HEALTH_FIELDS = [
  { key: 'injuries', label: 'Injuries' },
  { key: 'physicalLimitations', label: 'Physical Limitations' },
  { key: 'exerciseRestrictions', label: 'Exercise Restrictions' },
  { key: 'mobilityLimitations', label: 'Mobility Limitations' },
] as const

const schema = z.object({
  // Goals
  primaryGoal: z.string().optional(),
  secondaryGoals: z.array(z.string()).optional(),
  targetWeight: z.string().optional(),
  targetBodyFatPercentage: z.string().optional(),
  goalTimeline: z.string().optional(),
  // Level & experience
  fitnessLevel: z.string().optional(),
  gymExperienceLevel: z.string().optional(),
  workoutFrequency: z.string().optional(),
  previousGymExperience: z.string().optional(),
  // Workout preferences
  preferredWorkoutTypes: z.array(z.string()).optional(),
  favoriteExercises: z.array(z.string()).optional(),
  avoidExercises: z.array(z.string()).optional(),
  // Training schedule
  preferredDays: z.array(z.string()).optional(),
  preferredDuration: z.string().optional(),
  preferredTime: z.string().optional(),
  // Health & limitations
  injuries: z.string().optional(),
  physicalLimitations: z.string().optional(),
  exerciseRestrictions: z.string().optional(),
  mobilityLimitations: z.string().optional(),
  // Fitness assessment
  strengthLevel: z.string().optional(),
  cardioLevel: z.string().optional(),
  mobilityLevel: z.string().optional(),
  overallFitnessLevel: z.string().optional(),
  fitnessAssessmentNotes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface EditFitnessPreferencesDialogProps {
  open: boolean
  onClose: () => void
  member: ManagedUser
  preferences?: MemberFitnessPreferenceRecord | null
}

/**
 * Fitness-scoped counterpart to NutritionAssessmentDialog. Reuses the
 * business's real Exercise Library (via ExerciseMultiSelect + the configured
 * equipment list) rather than free-typed exercise/equipment text, and shows
 * the member's latest recorded body measurement read-only rather than
 * duplicating that history here.
 */
export function EditFitnessPreferencesDialog({ open, onClose, member, preferences }: EditFitnessPreferencesDialogProps) {
  const save = useSaveMemberFitnessPreferences()
  const measurements = useBodyMeasurementsForMember(Number(member.id))
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!open) return
    reset({
      primaryGoal: preferences?.primaryGoal ?? undefined,
      secondaryGoals: preferences?.secondaryGoals ?? [],
      targetWeight: preferences?.targetWeight ?? '',
      targetBodyFatPercentage: preferences?.targetBodyFatPercentage ?? '',
      goalTimeline: preferences?.goalTimeline ?? undefined,
      fitnessLevel: preferences?.fitnessLevel ?? undefined,
      gymExperienceLevel: preferences?.gymExperienceLevel ?? undefined,
      workoutFrequency: preferences?.workoutFrequency ? String(preferences.workoutFrequency) : '',
      previousGymExperience: preferences?.previousGymExperience ?? '',
      preferredWorkoutTypes: preferences?.preferredWorkoutTypes ?? [],
      favoriteExercises: preferences?.favoriteExercises ?? [],
      avoidExercises: preferences?.avoidExercises ?? [],
      preferredDays: preferences?.preferredDays ?? [],
      preferredDuration: preferences?.preferredDuration ? String(preferences.preferredDuration) : undefined,
      preferredTime: preferences?.preferredTime ?? '',
      injuries: preferences?.injuries ?? '',
      physicalLimitations: preferences?.physicalLimitations ?? '',
      exerciseRestrictions: preferences?.exerciseRestrictions ?? '',
      mobilityLimitations: preferences?.mobilityLimitations ?? '',
      strengthLevel: preferences?.strengthLevel ?? undefined,
      cardioLevel: preferences?.cardioLevel ?? undefined,
      mobilityLevel: preferences?.mobilityLevel ?? undefined,
      overallFitnessLevel: preferences?.overallFitnessLevel ?? undefined,
      fitnessAssessmentNotes: preferences?.fitnessAssessmentNotes ?? '',
    })
  }, [open, preferences, reset])

  const primaryGoal = watch('primaryGoal')
  const secondaryGoals = watch('secondaryGoals') ?? []
  const goalTimeline = watch('goalTimeline')
  const fitnessLevel = watch('fitnessLevel')
  const gymExperienceLevel = watch('gymExperienceLevel')
  const workoutTypes = watch('preferredWorkoutTypes') ?? []
  const favoriteExercises = watch('favoriteExercises') ?? []
  const avoidExercises = watch('avoidExercises') ?? []
  const preferredDays = watch('preferredDays') ?? []
  const preferredDuration = watch('preferredDuration')
  const strengthLevel = watch('strengthLevel')
  const cardioLevel = watch('cardioLevel')
  const mobilityLevel = watch('mobilityLevel')
  const overallFitnessLevel = watch('overallFitnessLevel')

  const toggleInArray = (field: keyof FormValues, value: string) => {
    const current = (watch(field) as string[] | undefined) ?? []
    setValue(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }

  const latestMeasurement = useMemo(() => {
    const list = measurements.data ?? []
    if (list.length === 0) return undefined
    return [...list].sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))[0]
  }, [measurements.data])

  const onSubmit = (values: FormValues) => {
    save.mutate(
      {
        memberId: Number(member.id),
        primaryGoal: (values.primaryGoal || undefined) as FitnessGoal | undefined,
        secondaryGoals: values.secondaryGoals?.length ? (values.secondaryGoals as FitnessGoal[]) : undefined,
        targetWeight: values.targetWeight ? Number(values.targetWeight) : undefined,
        targetBodyFatPercentage: values.targetBodyFatPercentage ? Number(values.targetBodyFatPercentage) : undefined,
        goalTimeline: values.goalTimeline || undefined,
        fitnessLevel: (values.fitnessLevel || undefined) as FitnessLevel | undefined,
        gymExperienceLevel: (values.gymExperienceLevel || undefined) as GymExperienceLevel | undefined,
        workoutFrequency: values.workoutFrequency ? Number(values.workoutFrequency) : undefined,
        previousGymExperience: values.previousGymExperience || undefined,
        preferredWorkoutTypes: values.preferredWorkoutTypes?.length ? values.preferredWorkoutTypes : undefined,
        favoriteExercises: values.favoriteExercises?.length ? values.favoriteExercises : undefined,
        avoidExercises: values.avoidExercises?.length ? values.avoidExercises : undefined,
        preferredDays: values.preferredDays?.length ? values.preferredDays : undefined,
        preferredDuration: values.preferredDuration ? Number(values.preferredDuration) : undefined,
        preferredTime: values.preferredTime || undefined,
        injuries: values.injuries || undefined,
        physicalLimitations: values.physicalLimitations || undefined,
        exerciseRestrictions: values.exerciseRestrictions || undefined,
        mobilityLimitations: values.mobilityLimitations || undefined,
        strengthLevel: (values.strengthLevel || undefined) as FitnessLevel | undefined,
        cardioLevel: (values.cardioLevel || undefined) as FitnessLevel | undefined,
        mobilityLevel: (values.mobilityLevel || undefined) as FitnessLevel | undefined,
        overallFitnessLevel: (values.overallFitnessLevel || undefined) as FitnessLevel | undefined,
        fitnessAssessmentNotes: values.fitnessAssessmentNotes || undefined,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fitness Profile — {member.fullName ?? member.firstName}</DialogTitle>
        </DialogHeader>

        <form className="flex-1 space-y-6 overflow-y-auto pr-1" onSubmit={(e) => e.preventDefault()}>

          <Section title="Fitness Goals">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Primary Goal" hint="Recommended">
                <Select value={primaryGoal} onValueChange={(v) => setValue('primaryGoal', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FITNESS_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Target Weight (kg)"><Input type="number" {...register('targetWeight')} /></Field>
              <Field label="Target Body Fat %"><Input type="number" {...register('targetBodyFatPercentage')} /></Field>
              <Field label="Goal Timeline">
                <Select value={goalTimeline} onValueChange={(v) => setValue('goalTimeline', v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{GOAL_TIMELINES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Secondary Goals">
              <div className="flex flex-wrap gap-1.5">
                {FITNESS_GOALS.filter((g) => g !== primaryGoal).map((goal) => (
                  <Chip key={goal} label={goal} selected={secondaryGoals.includes(goal)} onClick={() => toggleInArray('secondaryGoals', goal)} />
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Fitness Level & Experience">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Fitness Level" hint="Recommended">
                <Select value={fitnessLevel} onValueChange={(v) => setValue('fitnessLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FITNESS_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Gym Experience">
                <Select value={gymExperienceLevel} onValueChange={(v) => setValue('gymExperienceLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GYM_EXPERIENCE_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Workouts / Week"><Input type="number" min={0} max={14} {...register('workoutFrequency')} /></Field>
            </div>
            <Field label="Additional Experience" hint="Optional — anything not covered above">
              <Input placeholder="e.g. Trained for a marathon in 2022" {...register('previousGymExperience')} />
            </Field>
          </Section>

          <Section title="Current Fitness Status">
            {measurements.isLoading ? (
              <p className="text-xs text-slate-400">Loading...</p>
            ) : !latestMeasurement ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                No measurements recorded yet — record one from the Progress tab to see it here.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Height" value={latestMeasurement.height ? `${latestMeasurement.height} cm` : '—'} />
                <Stat label="Weight" value={latestMeasurement.weight ? `${latestMeasurement.weight} kg` : '—'} />
                <Stat label="BMI" value={latestMeasurement.bmi ?? '—'} />
                <Stat label="Body Fat %" value={latestMeasurement.bodyFatPercentage ? `${latestMeasurement.bodyFatPercentage}%` : '—'} />
              </div>
            )}
          </Section>

          <Section title="Workout Preferences">
            <Field label="Workout Types">
              <div className="flex flex-wrap gap-1.5">
                {WORKOUT_TYPES.map((type) => (
                  <Chip key={type} label={type} selected={workoutTypes.includes(type)} onClick={() => toggleInArray('preferredWorkoutTypes', type)} />
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Favorite Exercises">
                <ExerciseMultiSelect selected={favoriteExercises} onChange={(v) => setValue('favoriteExercises', v)} />
              </Field>
              <Field label="Exercises to Avoid">
                <ExerciseMultiSelect selected={avoidExercises} onChange={(v) => setValue('avoidExercises', v)} placeholder="Search exercises to avoid..." />
              </Field>
            </div>
          </Section>

          <Section title="Training Schedule">
            <Field label="Preferred Days">
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => (
                  <Chip key={day} label={day} selected={preferredDays.includes(day)} onClick={() => toggleInArray('preferredDays', day)} />
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preferred Duration">
                <Select value={preferredDuration} onValueChange={(v) => setValue('preferredDuration', v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Preferred Time">
                <Input type="time" {...register('preferredTime')} />
              </Field>
            </div>
          </Section>

          <Section title="Health & Limitations">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {HEALTH_FIELDS.map(({ key, label }) => (
                <HealthField
                  key={key}
                  label={label}
                  value={watch(key) ?? ''}
                  onChange={(v) => setValue(key, v)}
                />
              ))}
            </div>
          </Section>

          <Section title="Fitness Assessment">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Strength Level">
                <Select value={strengthLevel} onValueChange={(v) => setValue('strengthLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FITNESS_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Cardio Level">
                <Select value={cardioLevel} onValueChange={(v) => setValue('cardioLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FITNESS_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Mobility Level">
                <Select value={mobilityLevel} onValueChange={(v) => setValue('mobilityLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FITNESS_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Overall Fitness Level">
                <Select value={overallFitnessLevel} onValueChange={(v) => setValue('overallFitnessLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FITNESS_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Trainer Assessment Notes" hint="Optional — free-form observations">
              <Textarea rows={2} {...register('fitnessAssessmentNotes')} />
            </Field>
          </Section>

          {errors.fitnessLevel && <p className="text-xs text-red-600">Invalid fitness level</p>}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={save.isPending} onClick={handleSubmit(onSubmit)}>
            {save.isPending ? 'Saving...' : 'Save Fitness Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs">
        {label}
        {hint && <span className="font-normal text-slate-400">({hint})</span>}
      </Label>
      {children}
    </div>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        selected ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

/** None / Yes — specify toggle so a trainer never has to type "None" by hand. */
function HealthField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hasValue = value.trim().length > 0

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1.5">
        <Chip label="None" selected={!hasValue} onClick={() => onChange('')} />
        <Chip label="Yes — specify" selected={hasValue} onClick={() => { if (!hasValue) onChange(' ') }} />
      </div>
      {hasValue && (
        <Input
          className="mt-1.5"
          placeholder={`Describe ${label.toLowerCase()}...`}
          value={value.trim()}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
