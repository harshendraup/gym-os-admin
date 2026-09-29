import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useCreateNutritionAssessment, useUpdateNutritionAssessment } from '@/hooks/useNutritionAssessments'
import type {
  NutritionGoal, ActivityLevel, DietType, NutritionAssessmentRecord,
} from '@/api/nutrition-assessments.api'
import type { ManagedUser } from '@/api/user-management.api'

const GOALS: NutritionGoal[] = ['Weight Loss', 'Muscle Gain', 'Fat Loss', 'Fitness']
const ACTIVITY_LEVELS: ActivityLevel[] = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']
const DIET_TYPES: DietType[] = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan']

const schema = z.object({
  goal: z.enum(['Weight Loss', 'Muscle Gain', 'Fat Loss', 'Fitness']),
  activityLevel: z.enum(['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']),
  workoutFrequency: z.string().optional(),
  workoutTime: z.string().optional(),
  wakeTime: z.string().optional(),
  sleepTime: z.string().optional(),
  dietType: z.enum(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan']),
  mealsPerDay: z.string().optional(),
  foodPreference: z.string().optional(),
  cookingPreference: z.string().optional(),
  budgetPreference: z.string().optional(),
  waterIntake: z.string().optional(),
  allergies: z.string().optional(),
  foodRestrictions: z.string().optional(),
  foodsLiked: z.string().optional(),
  foodsDisliked: z.string().optional(),
  dietNotes: z.string().optional(),
  additionalNotes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface NutritionAssessmentDialogProps {
  open: boolean
  onClose: () => void
  member: ManagedUser
  assessment?: NutritionAssessmentRecord | null
  onSaved?: (saved: NutritionAssessmentRecord) => void
}

/**
 * The trainer-facing verbal-intake form — what the trainer records while
 * talking to the member, before a diet plan is built. Sectioned rather
 * than a hard multi-step wizard so a trainer can jump around freely while
 * the member talks, but grouped the same way a wizard's steps would be.
 */
export function NutritionAssessmentDialog({ open, onClose, member, assessment, onSaved }: NutritionAssessmentDialogProps) {
  const isEdit = !!assessment
  const create = useCreateNutritionAssessment()
  const update = useUpdateNutritionAssessment(assessment?.id ?? 0)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!open) return
    reset({
      goal: assessment?.goal ?? 'Fitness',
      activityLevel: assessment?.activityLevel ?? 'Moderate',
      workoutFrequency: assessment?.workoutFrequency ? String(assessment.workoutFrequency) : '',
      workoutTime: assessment?.workoutTime ?? '',
      wakeTime: assessment?.wakeTime ?? '',
      sleepTime: assessment?.sleepTime ?? '',
      dietType: assessment?.dietType ?? 'Vegetarian',
      mealsPerDay: assessment?.mealsPerDay ? String(assessment.mealsPerDay) : '4',
      foodPreference: assessment?.foodPreference ?? '',
      cookingPreference: assessment?.cookingPreference ?? '',
      budgetPreference: assessment?.budgetPreference ?? '',
      waterIntake: assessment?.waterIntake ?? '',
      allergies: assessment?.allergies ?? '',
      foodRestrictions: assessment?.foodRestrictions ?? '',
      foodsLiked: assessment?.foodsLiked ?? '',
      foodsDisliked: assessment?.foodsDisliked ?? '',
      dietNotes: assessment?.dietNotes ?? '',
      additionalNotes: assessment?.additionalNotes ?? '',
    })
  }, [open, assessment, reset])

  const goal = watch('goal')
  const activityLevel = watch('activityLevel')
  const dietType = watch('dietType')
  const onSubmit = (values: FormValues, status: 'Draft' | 'Completed') => {
    const payload = {
      goal: values.goal,
      activityLevel: values.activityLevel,
      workoutFrequency: values.workoutFrequency ? Number(values.workoutFrequency) : undefined,
      workoutTime: values.workoutTime || undefined,
      wakeTime: values.wakeTime || undefined,
      sleepTime: values.sleepTime || undefined,
      dietType: values.dietType,
      mealsPerDay: values.mealsPerDay ? Number(values.mealsPerDay) : undefined,
      foodPreference: values.foodPreference || undefined,
      cookingPreference: values.cookingPreference || undefined,
      budgetPreference: values.budgetPreference || undefined,
      waterIntake: values.waterIntake ? Number(values.waterIntake) : undefined,
      allergies: values.allergies || undefined,
      foodRestrictions: values.foodRestrictions || undefined,
      foodsLiked: values.foodsLiked || undefined,
      foodsDisliked: values.foodsDisliked || undefined,
      dietNotes: values.dietNotes || undefined,
      additionalNotes: values.additionalNotes || undefined,
      status,
    }

    if (isEdit) {
      update.mutate(payload, { onSuccess: (result) => { onSaved?.(result); onClose() } })
    } else {
      create.mutate({ ...payload, memberId: Number(member.id) }, { onSuccess: (result) => { onSaved?.(result); onClose() } })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nutrition Assessment — {member.fullName ?? member.firstName}</DialogTitle>
          <DialogDescription>Record what the member tells you verbally, section by section.</DialogDescription>
        </DialogHeader>

        <form className="flex-1 space-y-6 overflow-y-auto pr-1" onSubmit={(e) => e.preventDefault()}>
          <Section title="Nutrition Summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Goal">
                <Select value={goal} onValueChange={(v) => setValue('goal', v as NutritionGoal)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">Physical metrics are maintained in Progress. Record a measurement there when they change.</p>
          </Section>

          <Section title="Lifestyle & Activity">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Activity Level">
                <Select value={activityLevel} onValueChange={(v) => setValue('activityLevel', v as ActivityLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIVITY_LEVELS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Workouts / Week"><Input type="number" {...register('workoutFrequency')} /></Field>
              <Field label="Workout Time"><Input placeholder="6:00 AM" {...register('workoutTime')} /></Field>
              <Field label="Wake Time"><Input placeholder="5:30 AM" {...register('wakeTime')} /></Field>
              <Field label="Sleep Time"><Input placeholder="10:30 PM" {...register('sleepTime')} /></Field>
            </div>
          </Section>

          <Section title="Diet Type & Preferences">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Diet Type">
                <Select value={dietType} onValueChange={(v) => setValue('dietType', v as DietType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIET_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Meals / Day"><Input type="number" {...register('mealsPerDay')} /></Field>
              <Field label="Water Intake (L)"><Input type="number" {...register('waterIntake')} /></Field>
              <Field label="Food Preference"><Input placeholder="Home-cooked, spicy..." {...register('foodPreference')} /></Field>
              <Field label="Cooking Preference"><Input placeholder="Self-cook, tiffin..." {...register('cookingPreference')} /></Field>
              <Field label="Budget"><Input placeholder="Moderate" {...register('budgetPreference')} /></Field>
            </div>
          </Section>

          <Section title="Current Eating Pattern">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Foods Liked"><Textarea rows={2} {...register('foodsLiked')} /></Field>
              <Field label="Foods Disliked"><Textarea rows={2} {...register('foodsDisliked')} /></Field>
              <Field label="Allergies"><Textarea rows={2} {...register('allergies')} /></Field>
              <Field label="Food Restrictions"><Textarea rows={2} {...register('foodRestrictions')} /></Field>
            </div>
            <Field label="Diet Notes"><Textarea rows={2} {...register('dietNotes')} /></Field>
            <Field label="Additional Notes"><Textarea rows={2} {...register('additionalNotes')} /></Field>
          </Section>

          {errors.goal && <p className="text-xs text-red-600">Goal is required</p>}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={handleSubmit((v) => onSubmit(v, 'Draft'))}>
            Save Draft
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSubmit((v) => onSubmit(v, 'Completed'))}>
            {isPending ? 'Saving...' : 'Save & Continue to Plan'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

