import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Flame, Beef, Wheat, Droplet, GlassWater, Pill,
  CalendarDays, Sparkles, ListChecks, Info, Pencil, Check, Minus,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { FoodPicker } from './FoodPicker'
import { useCreateDietPlan, useUpdateDietPlan } from '@/hooks/useDietPlans'
import { cn } from '@/lib/utils'
import { suggestTargetsFromProfile } from '@/lib/nutrition-calc'
import type { BranchRecord } from '@/api/branches.api'
import type {
  DietPlanGoal, DietPlanRecord, PlanDayInput, MealInput, MealItemInput,
  MealAlternativeInput, SupplementInput, DietPlanMeta,
} from '@/api/diet-plans.api'
import type { NutritionAssessmentRecord, DietType } from '@/api/nutrition-assessments.api'
import type { ManagedUser } from '@/api/user-management.api'

const GOALS: DietPlanGoal[] = ['Weight Loss', 'Muscle Gain', 'Fat Loss', 'Fitness']
const MEAL_TYPES = ['Breakfast', 'Mid-Morning', 'Lunch', 'Pre-Workout', 'Post-Workout', 'Evening Snack', 'Dinner', 'Bedtime']
const DIET_TYPES: DietType[] = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan']
const FOOD_PREFERENCES = ['Home-cooked', 'Tiffin / Delivery Service', 'Eats Out Often', 'Meal Prep (Batch Cooked)', 'No Specific Preference']
const HYDRATION_SOURCES = ['Plain Water', 'Water + Coconut Water', 'Water + Fresh Fruit Juice', 'Water + Buttermilk / Lassi', 'Water + Electrolyte (ORS)']
const HYDRATION_PRESETS_ML = [2000, 2500, 3000, 4000]

// Priority order for picking a default N-meal spread (most essential meals
// first), independent of MEAL_TYPES' chronological display order — e.g. a
// 4-meal day should end up Breakfast/Lunch/Evening Snack/Dinner, not stop at
// Pre-Workout just because that's earlier in the day.
const DEFAULT_MEAL_PRIORITY = ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack', 'Mid-Morning', 'Post-Workout', 'Pre-Workout', 'Bedtime']

/** Auto-suggested starting name — the trainer can freely retype it; we only ever set this, never force it back. */
function suggestPlanName(goal: DietPlanGoal, member?: ManagedUser | null) {
  const who = member ? (member.fullName ?? member.firstName) : undefined
  return who ? `${goal} — ${who}` : `${goal} Plan`
}

let localId = -1
function nextLocalId() {
  return localId--
}

/** N empty meals for a fresh day, in chronological order, picked from DEFAULT_MEAL_PRIORITY. */
function buildDefaultMeals(count: number): BuilderMeal[] {
  const chosen = new Set(DEFAULT_MEAL_PRIORITY.slice(0, count))
  return MEAL_TYPES.filter((t) => chosen.has(t)).map((mealType) => ({
    localId: nextLocalId(),
    mealType,
    mealTime: '',
    items: [],
    alternatives: [],
  }))
}

interface BuilderMeal extends MealInput {
  localId: number
  items: (MealItemInput & { localId: number })[]
  alternatives: (MealAlternativeInput & { localId: number })[]
}
interface BuilderDay extends Omit<PlanDayInput, 'meals'> {
  localId: number
  meals: BuilderMeal[]
}

interface CreateDietPlanDialogProps {
  open: boolean
  onClose: () => void
  branchOptions?: BranchRecord[]
  fixedBranchId?: number
  plan?: DietPlanRecord | null
  /**
   * When creating a new plan (ignored while editing), prefills the Overview
   * tab's goal + macro targets from this assessment's BMR/TDEE estimate and
   * sends `assessmentId` with the create payload — see nutrition-calc.ts.
   * `member` supplies the age/gender the assessment itself doesn't carry.
   */
  assessment?: NutritionAssessmentRecord | null
  member?: ManagedUser | null
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

function inferDayModeFromPlan(days: DietPlanRecord['days'] = []) {
  if (!days || days.length <= 1) return 'same'

  const signature = (day: DietPlanRecord['days'][number]) => JSON.stringify({
    isRestDay: day.isRestDay,
    meals: day.meals.map((meal) => ({
      mealType: meal.mealType,
      mealName: meal.mealName,
      mealTime: meal.mealTime,
      sortOrder: meal.sortOrder,
      items: meal.items.map((item) => ({
        foodId: item.foodId,
        foodName: item.foodName,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
      alternatives: meal.alternatives.map((alt) => ({
        foodId: alt.foodId,
        foodName: alt.foodName,
        quantity: alt.quantity,
        unit: alt.unit,
        calories: alt.calories,
        protein: alt.protein,
        carbs: alt.carbs,
        fat: alt.fat,
      })),
    })),
  })

  const first = signature(days[0])
  const anyCustom = days.some((d) => signature(d) !== first)
  return anyCustom ? 'custom' : 'same'
}

/** Rescales a meal item/alternative's macros proportionally to a new quantity — same math FoodPicker uses when first adding an item. */
function scaleMealItem<T extends { quantity: number; calories: number; protein: number; carbs: number; fat: number }>(
  item: T,
  newQuantity: number
): T {
  const ratio = newQuantity / Number(item.quantity)
  return {
    ...item,
    quantity: newQuantity,
    calories: round1(Number(item.calories) * ratio),
    protein: round1(Number(item.protein) * ratio),
    carbs: round1(Number(item.carbs) * ratio),
    fat: round1(Number(item.fat) * ratio),
  }
}

function sum(items: { calories: string | number; protein: string | number; carbs: string | number; fat: string | number }[]) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  for (const i of items) {
    totals.calories += Number(i.calories)
    totals.protein += Number(i.protein)
    totals.carbs += Number(i.carbs)
    totals.fat += Number(i.fat)
  }
  return totals
}

/**
 * The full nutrition plan builder — Overview (header + targets), Days (the
 * day → meal → food-item/alternative tree), Extras (supplements +
 * hydration), and Review. Structural editing on an already-Active plan
 * creates a new version server-side (see DietPlanService.update) rather
 * than mutating history, so this dialog never needs its own versioning UI.
 */
export function CreateDietPlanDialog({ open, onClose, branchOptions, fixedBranchId, plan, assessment, member }: CreateDietPlanDialogProps) {
  const isEdit = !!plan
  const create = useCreateDietPlan()
  const update = useUpdateDietPlan(plan?.id ?? 0)
  const isPending = create.isPending || update.isPending

  // Only meaningful for a brand-new plan — editing keeps whatever
  // assessmentId (or none) the plan already has, never overwritten from an
  // unrelated assessment passed into the dialog.
  const suggestedFromAssessment = !isEdit && assessment
    ? suggestTargetsFromProfile({
        weightKg: assessment.currentWeight ? Number(assessment.currentWeight) : undefined,
        heightCm: assessment.height ? Number(assessment.height) : undefined,
        age: member?.age,
        gender: member?.gender,
        activityLevel: assessment.activityLevel,
        goal: assessment.goal,
      })
    : null

  const [tab, setTab] = useState('overview')
  const [branchId, setBranchId] = useState('')
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [goal, setGoal] = useState<DietPlanGoal>('Fitness')
  const [description, setDescription] = useState('')
  const [caloriesTarget, setCaloriesTarget] = useState('')
  const [proteinTarget, setProteinTarget] = useState('')
  const [carbsTarget, setCarbsTarget] = useState('')
  const [fatTarget, setFatTarget] = useState('')
  const [waterTarget, setWaterTarget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dietType, setDietType] = useState<DietType | ''>('')
  const [mealsPerDay, setMealsPerDay] = useState('')
  const [foodPreference, setFoodPreference] = useState('')

  const [days, setDays] = useState<BuilderDay[]>([])
  // 'same' = build one day once and repeat it repeatDays times; 'custom' = build each day separately (today's behavior).
  const [dayMode, setDayMode] = useState<'same' | 'custom'>('same')
  const [repeatDays, setRepeatDays] = useState('7')
  const [supplements, setSupplements] = useState<(SupplementInput & { localId: number })[]>([])
  const [hydrationMl, setHydrationMl] = useState('')
  const [hydrationSource, setHydrationSource] = useState('')
  const [reviewVisited, setReviewVisited] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTab('overview')
    setBranchId(plan ? String(plan.branchId) : fixedBranchId ? String(fixedBranchId) : '')
    const initialGoal = plan?.goal ?? (!isEdit && assessment ? assessment.goal : 'Fitness')
    setGoal(initialGoal)
    setName(plan?.name || (!isEdit ? suggestPlanName(initialGoal, member) : ''))
    setNameTouched(false)
    setDescription(plan?.description ?? '')
    setCaloriesTarget(plan?.caloriesTarget ?? (suggestedFromAssessment ? String(suggestedFromAssessment.calories) : ''))
    setProteinTarget(plan?.proteinTarget ?? (suggestedFromAssessment ? String(suggestedFromAssessment.protein) : ''))
    setCarbsTarget(plan?.carbsTarget ?? (suggestedFromAssessment ? String(suggestedFromAssessment.carbs) : ''))
    setFatTarget(plan?.fatTarget ?? (suggestedFromAssessment ? String(suggestedFromAssessment.fat) : ''))
    setWaterTarget(plan?.waterTarget ?? '')
    setStartDate(plan?.startDate?.slice(0, 10) ?? '')
    setEndDate(plan?.endDate?.slice(0, 10) ?? '')
    setDietType(plan?.metaDietPlan?.dietType ?? (!isEdit && assessment ? assessment.dietType : '') ?? '')
    setMealsPerDay(
      plan?.metaDietPlan?.mealsPerDay
        ? String(plan.metaDietPlan.mealsPerDay)
        : !isEdit && assessment?.mealsPerDay
          ? String(assessment.mealsPerDay)
          : ''
    )
    setFoodPreference(plan?.metaDietPlan?.foodPreference ?? (!isEdit ? assessment?.foodPreference ?? '' : ''))
    setError('')

    const loadedDays = (plan?.days ?? []).map((d) => ({
      localId: nextLocalId(),
      dayNumber: d.dayNumber,
      dayName: d.dayName ?? undefined,
      isRestDay: d.isRestDay,
      notes: d.notes ?? undefined,
      meals: d.meals.map((m) => ({
        localId: nextLocalId(),
        mealType: m.mealType,
        mealName: m.mealName ?? undefined,
        mealTime: m.mealTime ?? undefined,
        notes: m.notes ?? undefined,
        items: m.items.map((i) => ({
          localId: nextLocalId(),
          foodId: i.foodId ?? undefined,
          foodName: i.foodName,
          quantity: Number(i.quantity),
          unit: i.unit,
          calories: Number(i.calories),
          protein: Number(i.protein),
          carbs: Number(i.carbs),
          fat: Number(i.fat),
          sortOrder: i.sortOrder,
          notes: i.notes ?? undefined,
        })),
        alternatives: m.alternatives.map((a) => ({
          localId: nextLocalId(),
          foodId: a.foodId ?? undefined,
          foodName: a.foodName,
          quantity: Number(a.quantity),
          unit: a.unit,
          calories: Number(a.calories),
          protein: Number(a.protein),
          carbs: Number(a.carbs),
          fat: Number(a.fat),
          sortOrder: a.sortOrder,
        })),
      })),
    }))

    const inferredMode = inferDayModeFromPlan(plan?.days ?? [])
    setDayMode(inferredMode)
    setRepeatDays(inferredMode === 'same' ? String(Math.max(plan?.days?.length ?? 1, 1)) : '7')
    setDays(inferredMode === 'same' && loadedDays.length > 1 ? [loadedDays[0]] : loadedDays)
    setSupplements(
      (plan?.supplements ?? []).map((s) => ({
        localId: nextLocalId(),
        name: s.name,
        quantity: s.quantity,
        unit: s.unit ?? undefined,
        timing: s.timing ?? undefined,
        frequency: s.frequency ?? undefined,
        notes: s.notes ?? undefined,
        sortOrder: s.sortOrder,
      }))
    )
    setHydrationMl(plan?.hydration?.targetMl ?? '')
    setHydrationSource(plan?.hydration?.notes ?? '')
    setReviewVisited(false)
  }, [open, plan, fixedBranchId, isEdit, assessment, suggestedFromAssessment, member])

  const dayTotals = useMemo(
    () => days.map((d) => sum(d.meals.flatMap((m) => m.items))),
    [days]
  )
  const planTotals = useMemo(() => {
    if (dayTotals.length === 0) return null
    const t = dayTotals.reduce(
      (acc, d) => ({ calories: acc.calories + d.calories, protein: acc.protein + d.protein, carbs: acc.carbs + d.carbs, fat: acc.fat + d.fat }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
    return { calories: t.calories / dayTotals.length, protein: t.protein / dayTotals.length, carbs: t.carbs / dayTotals.length, fat: t.fat / dayTotals.length }
  }, [dayTotals])

  const addDay = () => {
    const requestedMeals = Math.min(8, Math.max(0, Math.round(Number(mealsPerDay) || 0)))
    setDays((prev) => [
      ...prev,
      {
        localId: nextLocalId(),
        dayNumber: prev.length + 1,
        dayName: `Day ${prev.length + 1}`,
        isRestDay: false,
        meals: requestedMeals > 0 ? buildDefaultMeals(requestedMeals) : [],
      },
    ])
  }
  const removeDay = (localId: number) => setDays((prev) => prev.filter((d) => d.localId !== localId).map((d, i) => ({ ...d, dayNumber: i + 1 })))

  // Switching to "same every day" only ever keeps one template day — extra
  // days built while in "custom" mode are dropped (with confirmation, since
  // that's real data loss) so there's never ambiguity about which day repeats.
  const handleDayModeChange = (mode: 'same' | 'custom') => {
    if (mode === 'same' && days.length > 1) {
      if (!window.confirm(`Switch to one repeating day? This keeps only "${days[0].dayName || 'Day 1'}" and discards the other ${days.length - 1} day(s) you've built.`)) {
        return
      }
      setDays((prev) => [{ ...prev[0], dayNumber: 1, dayName: 'Daily Plan' }])
    }
    setDayMode(mode)
  }
  const addMeal = (dayLocalId: number) => {
    setDays((prev) => prev.map((d) => d.localId === dayLocalId
      ? { ...d, meals: [...d.meals, { localId: nextLocalId(), mealType: 'Breakfast', mealTime: '', items: [], alternatives: [] }] }
      : d))
  }
  const removeMeal = (dayLocalId: number, mealLocalId: number) => {
    setDays((prev) => prev.map((d) => d.localId === dayLocalId ? { ...d, meals: d.meals.filter((m) => m.localId !== mealLocalId) } : d))
  }
  const updateMeal = (dayLocalId: number, mealLocalId: number, patch: Partial<BuilderMeal>) => {
    setDays((prev) => prev.map((d) => d.localId === dayLocalId
      ? { ...d, meals: d.meals.map((m) => m.localId === mealLocalId ? { ...m, ...patch } : m) }
      : d))
  }
  const addMealItem = (dayLocalId: number, mealLocalId: number, item: MealItemInput) => {
    setDays((prev) => prev.map((d) => d.localId === dayLocalId
      ? { ...d, meals: d.meals.map((m) => m.localId === mealLocalId ? { ...m, items: [...m.items, { ...item, localId: nextLocalId() }] } : m) }
      : d))
  }
  const removeMealItem = (dayLocalId: number, mealLocalId: number, itemLocalId: number) => {
    setDays((prev) => prev.map((d) => d.localId === dayLocalId
      ? { ...d, meals: d.meals.map((m) => m.localId === mealLocalId ? { ...m, items: m.items.filter((i) => i.localId !== itemLocalId) } : m) }
      : d))
  }
  const addMealAlternative = (dayLocalId: number, mealLocalId: number, alt: MealAlternativeInput) => {
    setDays((prev) => prev.map((d) => d.localId === dayLocalId
      ? { ...d, meals: d.meals.map((m) => m.localId === mealLocalId ? { ...m, alternatives: [...m.alternatives, { ...alt, localId: nextLocalId() }] } : m) }
      : d))
  }
  const removeMealAlternative = (dayLocalId: number, mealLocalId: number, altLocalId: number) => {
    setDays((prev) => prev.map((d) => d.localId === dayLocalId
      ? { ...d, meals: d.meals.map((m) => m.localId === mealLocalId ? { ...m, alternatives: m.alternatives.filter((a) => a.localId !== altLocalId) } : m) }
      : d))
  }
  // Rescales macros proportionally to the new quantity (relative to whatever
  // they currently are) rather than re-looking-up the food — works the same
  // whether the item came from the library or was typed in as a custom item.
  const updateMealItemQuantity = (dayLocalId: number, mealLocalId: number, itemLocalId: number, newQuantity: number) => {
    if (!newQuantity || newQuantity <= 0) return
    setDays((prev) => prev.map((d) => d.localId !== dayLocalId ? d : {
      ...d,
      meals: d.meals.map((m) => m.localId !== mealLocalId ? m : {
        ...m,
        items: m.items.map((i) => i.localId !== itemLocalId ? i : scaleMealItem(i, newQuantity)),
      }),
    }))
  }
  const updateMealAlternativeQuantity = (dayLocalId: number, mealLocalId: number, altLocalId: number, newQuantity: number) => {
    if (!newQuantity || newQuantity <= 0) return
    setDays((prev) => prev.map((d) => d.localId !== dayLocalId ? d : {
      ...d,
      meals: d.meals.map((m) => m.localId !== mealLocalId ? m : {
        ...m,
        alternatives: m.alternatives.map((a) => a.localId !== altLocalId ? a : scaleMealItem(a, newQuantity)),
      }),
    }))
  }

  // What the foods actually added so far add up to — a live readout, never
  // written into the target fields. The target (caloriesTarget/etc. state)
  // is a separate goal the trainer sets; this is just "where you are."
  const addedTotals = planTotals
    ? {
        calories: Math.round(planTotals.calories),
        protein: Math.round(planTotals.protein),
        carbs: Math.round(planTotals.carbs),
        fat: Math.round(planTotals.fat),
      }
    : null

  const targets = {
    calories: caloriesTarget ? Number(caloriesTarget) : null,
    protein: proteinTarget ? Number(proteinTarget) : null,
    carbs: carbsTarget ? Number(carbsTarget) : null,
    fat: fatTarget ? Number(fatTarget) : null,
  }

  // null when there's nothing to compare yet (no target, or no target for
  // that specific macro) — callers show "—" rather than a bogus number.
  const remaining = {
    calories: targets.calories !== null ? targets.calories - (addedTotals?.calories ?? 0) : null,
    protein: targets.protein !== null ? targets.protein - (addedTotals?.protein ?? 0) : null,
    carbs: targets.carbs !== null ? targets.carbs - (addedTotals?.carbs ?? 0) : null,
    fat: targets.fat !== null ? targets.fat - (addedTotals?.fat ?? 0) : null,
  }

  const hasAnyFood = days.some((d) => d.meals.some((m) => m.items.length > 0))
  const hasTarget = !!(caloriesTarget || proteinTarget || carbsTarget || fatTarget)

  const handleGoalChange = (v: DietPlanGoal) => {
    setGoal(v)
    if (!isEdit && !nameTouched) setName(suggestPlanName(v, member))
  }

  const addSupplement = () => setSupplements((prev) => [...prev, { localId: nextLocalId(), name: '', quantity: '' }])
  const updateSupplement = (localId: number, patch: Partial<SupplementInput>) =>
    setSupplements((prev) => prev.map((s) => (s.localId === localId ? { ...s, ...patch } : s)))
  const removeSupplement = (localId: number) => setSupplements((prev) => prev.filter((s) => s.localId !== localId))

  const buildMetaDietPlan = (): DietPlanMeta | undefined => {
    if (!dietType && !mealsPerDay && !foodPreference) return undefined
    return {
      dietType: dietType || undefined,
      mealsPerDay: mealsPerDay ? Number(mealsPerDay) : undefined,
      foodPreference: foodPreference || undefined,
    }
  }

  const buildPayload = () => ({
    branchId: branchId ? Number(branchId) : undefined,
    name,
    goal,
    assessmentId: !isEdit && assessment ? assessment.id : undefined,
    description: description || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    caloriesTarget: caloriesTarget ? Number(caloriesTarget) : undefined,
    proteinTarget: proteinTarget ? Number(proteinTarget) : undefined,
    carbsTarget: carbsTarget ? Number(carbsTarget) : undefined,
    fatTarget: fatTarget ? Number(fatTarget) : undefined,
    waterTarget: waterTarget ? Number(waterTarget) : undefined,
    metaDietPlan: buildMetaDietPlan(),
    planType: (days.length > 0 ? 'Custom' : 'Template') as 'Custom' | 'Template',
    // "Same every day" repeats the one template day dayMode/repeatDays times
    // rather than sending a single day — the backend has no concept of
    // repetition, so the expansion happens here, at submit time.
    days: (() => {
      const expanded = dayMode === 'same' && days.length === 1
        ? Array.from(
            { length: Math.min(31, Math.max(1, Math.round(Number(repeatDays)) || 1)) },
            (_, i) => ({ ...days[0], dayNumber: i + 1 })
          )
        : days
      return expanded.length > 0
        ? expanded.map((d) => ({
            dayNumber: d.dayNumber,
            dayName: d.dayName,
            isRestDay: d.isRestDay,
            notes: d.notes,
            meals: d.meals.map((m) => ({
              mealType: m.mealType,
              mealName: m.mealName,
              mealTime: m.mealTime,
              notes: m.notes,
              items: m.items.map(({ localId: _lid, ...i }) => i),
              alternatives: m.alternatives.map(({ localId: _lid, ...a }) => a),
            })),
          }))
        : undefined
    })(),
    supplements: supplements.length > 0
      ? supplements.filter((s) => s.name).map(({ localId: _lid, ...s }) => s)
      : undefined,
    hydration: hydrationMl ? { targetMl: Number(hydrationMl), notes: hydrationSource || undefined } : undefined,
  })

  const onSubmit = () => {
    setError('')
    if (!isEdit && !branchId) return setError('Select a branch')
    if (!name.trim()) return setError('Plan name is required')
    if (!hasTarget) return setError('Set at least a calorie target in Daily Macro Targets before creating the plan.')
    if (!hasAnyFood) return setError('Add at least one food to a meal before creating the plan — see Days & Meals.')
    if (!reviewVisited) return setError('Open the Review tab and check the plan before creating it.')

    const payload = buildPayload()
    if (isEdit) {
      update.mutate(payload, { onSuccess: onClose })
    } else {
      create.mutate({ ...payload, branchId: Number(branchId) }, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit "${plan?.name}"` : 'Create Diet Plan'}</DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a daily target, then add days, meals and foods — you'll see Added/Remaining as you go, and review before creating.
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => { setTab(v); if (v === 'review') setReviewVisited(true) }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-6 py-2.5">
            <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
              <BuilderTab value="overview" icon={Info} label="Overview & Targets" />
              <BuilderTab value="days" icon={CalendarDays} label="Days & Meals" count={days.length} />
              <BuilderTab value="extras" icon={Sparkles} label="Supplements & Hydration" />
              <BuilderTab value="review" icon={ListChecks} label="Review" />
            </TabsList>
          </div>

          {hasTarget && <TargetSummaryBar added={addedTotals} targets={targets} remaining={remaining} />}

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="overview" className="mt-0 space-y-5">
              {suggestedFromAssessment && (
                <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-slate-600">
                  Goal and targets below are suggested from {member?.fullName ?? member?.firstName ?? 'the member'}'s
                  nutrition assessment — adjust anything as needed.
                </p>
              )}
              <FormSection title="Basics" description="What this plan is called and who it's for.">
                {!fixedBranchId && (
                  <div className="space-y-1.5">
                    <Label>Branch</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger><SelectValue placeholder="Select a branch..." /></SelectTrigger>
                      <SelectContent>
                        {branchOptions?.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.branchName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Plan Name</Label>
                  <Input
                    placeholder="Fat Loss — Priya"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameTouched(true) }}
                  />
                  {!isEdit && !nameTouched && (
                    <p className="text-[11px] text-slate-400">Suggested from the goal below — edit freely.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Goal</Label>
                  <Select value={goal} onValueChange={(v) => handleGoalChange(v as DietPlanGoal)}>
                    <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>{GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea placeholder="General instructions..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </FormSection>

              <FormSection title="Diet Type & Preferences" description="How the member eats — used to guide which foods and meal timing make sense for this plan.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Diet Type</Label>
                    <Select value={dietType || undefined} onValueChange={(v) => setDietType(v as DietType)}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>{DIET_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meals / Day</Label>
                    <Input type="number" min={1} max={8} placeholder="4" value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} />
                    <p className="text-[11px] text-slate-400">"Add Day" pre-creates this many meal slots for you.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Food Preference</Label>
                    <Select value={foodPreference || undefined} onValueChange={setFoodPreference}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>{FOOD_PREFERENCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Schedule" description="Optional — when this plan starts and ends for the member.">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Daily Macro Targets"
                description="Set a daily goal — see Added/Remaining below as you build meals in Days & Meals."
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs text-slate-500"><Flame className="h-3.5 w-3.5" /> Calories</Label>
                    <Input type="number" placeholder="1800" value={caloriesTarget} onChange={(e) => setCaloriesTarget(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs text-slate-500"><Beef className="h-3.5 w-3.5" /> Protein (g)</Label>
                    <Input type="number" placeholder="150" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs text-slate-500"><Wheat className="h-3.5 w-3.5" /> Carbs (g)</Label>
                    <Input type="number" placeholder="120" value={carbsTarget} onChange={(e) => setCarbsTarget(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs text-slate-500"><Droplet className="h-3.5 w-3.5" /> Fat (g)</Label>
                    <Input type="number" placeholder="50" value={fatTarget} onChange={(e) => setFatTarget(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs text-slate-500"><GlassWater className="h-3.5 w-3.5" /> Water (L)</Label>
                    <Input type="number" placeholder="3" value={waterTarget} onChange={(e) => setWaterTarget(e.target.value)} />
                  </div>
                </div>
              </FormSection>
            </TabsContent>

            <TabsContent value="days" className="space-y-3 mt-0">
              <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="dayMode"
                      className="h-3.5 w-3.5 accent-primary"
                      checked={dayMode === 'same'}
                      onChange={() => handleDayModeChange('same')}
                    />
                    Same plan every day
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="dayMode"
                      className="h-3.5 w-3.5 accent-primary"
                      checked={dayMode === 'custom'}
                      onChange={() => handleDayModeChange('custom')}
                    />
                    Different plan per day
                  </label>
                  {dayMode === 'same' && (
                    <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
                      Repeat for
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        className="h-7 w-16 text-xs"
                        value={repeatDays}
                        onChange={(e) => setRepeatDays(e.target.value)}
                      />
                      days
                    </label>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {dayMode === 'same'
                    ? 'This plan follows the same daily diet for every scheduled day.'
                    : 'Add each day separately and build different meals for each — e.g. a weekly plan that varies day to day.'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {dayMode === 'same'
                    ? 'Build one day\'s meals below — it\'ll be used for every day of the plan.'
                    : 'Add each day separately and build different meals for each — e.g. a weekly plan that varies day to day.'}
                </p>
              </div>

              <p className="text-xs text-slate-500">
                {dayMode === 'same'
                  ? 'Add meals to this day, then search or type in the foods that make it up — every plan needs at least one food added here.'
                  : 'Add a day, then meals inside it, then search or type in the foods that make up each meal — every plan needs at least one food added here.'}
              </p>
              {days.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
                  <CalendarDays className="h-6 w-6 text-slate-300" />
                  <p className="text-sm text-slate-400">No days yet — add one to start building this plan's meals.</p>
                </div>
              )}
              {days.map((day, dayIndex) => (
                <DayCard
                  key={day.localId}
                  day={day}
                  dayMode={dayMode}
                  dayTotal={dayTotals[dayIndex]}
                  target={hasTarget ? { calories: targets.calories ?? 0, protein: targets.protein ?? 0, carbs: targets.carbs ?? 0, fat: targets.fat ?? 0 } : null}
                  onRemove={() => removeDay(day.localId)}
                  hideRemove={dayMode === 'same'}
                  onAddMeal={() => addMeal(day.localId)}
                  onRemoveMeal={(mealId) => removeMeal(day.localId, mealId)}
                  onUpdateMeal={(mealId, patch) => updateMeal(day.localId, mealId, patch)}
                  onAddItem={(mealId, item) => addMealItem(day.localId, mealId, item)}
                  onRemoveItem={(mealId, itemId) => removeMealItem(day.localId, mealId, itemId)}
                  onUpdateItemQuantity={(mealId, itemId, qty) => updateMealItemQuantity(day.localId, mealId, itemId, qty)}
                  onAddAlternative={(mealId, alt) => addMealAlternative(day.localId, mealId, alt)}
                  onRemoveAlternative={(mealId, altId) => removeMealAlternative(day.localId, mealId, altId)}
                  onUpdateAlternativeQuantity={(mealId, altId, qty) => updateMealAlternativeQuantity(day.localId, mealId, altId, qty)}
                />
              ))}
              {(dayMode === 'custom' || days.length === 0) && (
                <Button variant="outline" size="sm" onClick={addDay}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> {dayMode === 'same' ? 'Add This Day' : 'Add Day'}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="extras" className="mt-0 space-y-5">
              <FormSection title="Hydration" description="Optional — a precise ml figure, shown to the member instead of the plain liters target from Overview.">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Target (ml)</Label>
                    <Input className="max-w-xs" type="number" placeholder="3000" value={hydrationMl} onChange={(e) => setHydrationMl(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Source</Label>
                    <Select value={hydrationSource || undefined} onValueChange={setHydrationSource}>
                      <SelectTrigger className="w-56"><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>{HYDRATION_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HYDRATION_PRESETS_ML.map((ml) => (
                    <Button
                      key={ml}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => setHydrationMl(String(ml))}
                    >
                      {ml / 1000}L
                    </Button>
                  ))}
                </div>
              </FormSection>

              <FormSection title="Supplements" description="What the member should take, and when.">
                {supplements.length > 0 && (
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-1.5 gap-y-2 text-xs font-medium text-slate-400">
                    <span>Name</span><span>Quantity</span><span>Timing</span><span />
                    {supplements.map((s) => (
                      <Fragment key={s.localId}>
                        <Input className="h-8 text-xs" placeholder="Whey Protein" value={s.name} onChange={(e) => updateSupplement(s.localId, { name: e.target.value })} />
                        <Input className="h-8 text-xs" placeholder="1 scoop" value={s.quantity} onChange={(e) => updateSupplement(s.localId, { quantity: e.target.value })} />
                        <Input className="h-8 text-xs" placeholder="Post-workout" value={s.timing ?? ''} onChange={(e) => updateSupplement(s.localId, { timing: e.target.value })} />
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => removeSupplement(s.localId)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </Fragment>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={addSupplement}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Supplement
                </Button>
              </FormSection>
            </TabsContent>

            <TabsContent value="review" className="mt-0 space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">{name || 'Untitled plan'}</h4>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{goal}</span>
                </div>
                {(startDate || endDate) && (
                  <p className="mt-1 text-sm text-slate-500">{startDate || '—'} → {endDate || 'ongoing'}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-sm">
                  {caloriesTarget && <Stat icon={Flame} label={`${caloriesTarget} kcal`} />}
                  {proteinTarget && <Stat icon={Beef} label={`${proteinTarget}g protein`} />}
                  {carbsTarget && <Stat icon={Wheat} label={`${carbsTarget}g carbs`} />}
                  {fatTarget && <Stat icon={Droplet} label={`${fatTarget}g fat`} />}
                  {(waterTarget || hydrationMl) && <Stat icon={GlassWater} label={hydrationMl ? `${hydrationMl}ml water` : `${waterTarget}L water`} />}
                  {supplements.length > 0 && <Stat icon={Pill} label={`${supplements.length} supplement${supplements.length === 1 ? '' : 's'}`} />}
                </div>
              </div>

              {days.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {dayMode === 'same'
                      ? `1 day, repeated for ${Math.min(31, Math.max(1, Math.round(Number(repeatDays)) || 1))} days · ${days[0].meals.length} meals/day`
                      : `${days.length} day${days.length === 1 ? '' : 's'} · ${days.reduce((a, d) => a + d.meals.length, 0)} meals total`}
                  </p>
                  {days
                    .filter((_day, idx) => dayMode !== 'same' || idx === 0)
                    .map((day) => (
                      <div key={day.localId} className="rounded-lg border border-slate-100 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {dayMode === 'same' ? 'Every day' : (day.dayName || `Day ${day.dayNumber}`)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {day.meals.length === 0 ? 'No meals added' : day.meals.map((m) => m.mealType).join(' · ')}
                        </p>
                      </div>
                    ))}
                </div>
              )}
              {!hasTarget && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  No daily target set yet — go to Overview & Targets and set at least a calorie goal.
                </p>
              )}
              {!hasAnyFood && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  This plan has no foods yet — go to Days & Meals and add at least one before creating it.
                </p>
              )}
              {hasTarget && hasAnyFood && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  Looks good — you can create the plan now.
                </p>
              )}

              {isEdit && plan?.status === 'Active' && days.length > 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  This plan is currently Active and assigned. Saving structural changes will create Version {plan.version + 1} and archive the current version — history is preserved, nothing is lost.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="shrink-0 flex-col items-end gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {error ? <p className="text-xs text-red-600">{error}</p> : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={onSubmit} disabled={isPending || !hasTarget || !hasAnyFood || !reviewVisited}>
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Diet Plan'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BuilderTab({ value, icon: Icon, label, count }: { value: string; icon: any; label: string; count?: number }) {
  return (
    <TabsTrigger
      value={value}
      className="gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm sm:text-sm"
    >
      <Icon className="h-3.5 w-3.5" /> {label} {!!count && <span className="text-slate-400">({count})</span>}
    </TabsTrigger>
  )
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}

function Stat({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-700">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </span>
  )
}

function DayCard({
  day, dayMode, dayTotal, target, onRemove, hideRemove, onAddMeal, onRemoveMeal, onUpdateMeal,
  onAddItem, onRemoveItem, onUpdateItemQuantity, onAddAlternative, onRemoveAlternative, onUpdateAlternativeQuantity,
}: {
  day: BuilderDay
  dayMode: 'same' | 'custom'
  dayTotal: { calories: number; protein: number; carbs: number; fat: number }
  /** The plan-wide target (its own daily average once foods exist) — used to show this day's own % progress toward it. */
  target: { calories: number; protein: number; carbs: number; fat: number } | null
  onRemove: () => void
  /** Hides the remove-day button — used in "same every day" mode where there's always exactly one template day. */
  hideRemove?: boolean
  onAddMeal: () => void
  onRemoveMeal: (mealLocalId: number) => void
  onUpdateMeal: (mealLocalId: number, patch: Partial<BuilderMeal>) => void
  onAddItem: (mealLocalId: number, item: MealItemInput) => void
  onRemoveItem: (mealLocalId: number, itemLocalId: number) => void
  onUpdateItemQuantity: (mealLocalId: number, itemLocalId: number, quantity: number) => void
  onAddAlternative: (mealLocalId: number, alt: MealAlternativeInput) => void
  onRemoveAlternative: (mealLocalId: number, altLocalId: number) => void
  onUpdateAlternativeQuantity: (mealLocalId: number, altLocalId: number, quantity: number) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const visibleDayLabel = dayMode === 'same' ? 'Every day' : (day.dayName || `Day ${day.dayNumber}`)
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-l-4 border-primary bg-primary/5 px-3 py-2.5">
        <button type="button" className="flex flex-1 items-center gap-2 text-left" onClick={() => setExpanded((e) => !e)}>
          {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" /> : <ChevronDown className="h-4 w-4 shrink-0 text-primary" />}
          <span className="text-sm font-bold text-slate-900">{visibleDayLabel}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
            {Math.round(dayTotal.calories)} kcal · {Math.round(dayTotal.protein)}g protein
          </span>
        </button>
        {!hideRemove && (
          <Button size="sm" variant="ghost" className="h-7 px-2 hover:bg-white hover:text-red-500" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {expanded && (
        <div className="space-y-3 bg-white p-3">
          {target && <DayProgress dayTotal={dayTotal} target={target} />}
          {day.meals.length === 0 && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">No meals in this day yet.</p>
          )}
          {day.meals.map((meal) => (
            <MealCard
              key={meal.localId}
              meal={meal}
              onRemove={() => onRemoveMeal(meal.localId)}
              onUpdate={(patch) => onUpdateMeal(meal.localId, patch)}
              onAddItem={(item) => onAddItem(meal.localId, item)}
              onRemoveItem={(itemId) => onRemoveItem(meal.localId, itemId)}
              onUpdateItemQuantity={(itemId, qty) => onUpdateItemQuantity(meal.localId, itemId, qty)}
              onAddAlternative={(alt) => onAddAlternative(meal.localId, alt)}
              onRemoveAlternative={(altId) => onRemoveAlternative(meal.localId, altId)}
              onUpdateAlternativeQuantity={(altId, qty) => onUpdateAlternativeQuantity(meal.localId, altId, qty)}
            />
          ))}
          <Button variant="outline" size="sm" onClick={onAddMeal}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Meal
          </Button>
        </div>
      )}
    </div>
  )
}

const PROGRESS_MACROS = [
  { key: 'calories', label: 'Cal', suffix: '' },
  { key: 'protein', label: 'Protein', suffix: 'g' },
  { key: 'carbs', label: 'Carbs', suffix: 'g' },
  { key: 'fat', label: 'Fat', suffix: 'g' },
] as const

/** One macro's progress bar — a value against an optional target, with an optional remaining/over readout. Shared by DayProgress (day vs. plan target) and TargetSummaryBar (added-so-far vs. target, dialog-wide). */
function MacroBar({
  label, suffix, actualValue, targetValue, remainingValue,
}: {
  label: string
  suffix: string
  actualValue: number
  targetValue: number | null
  remainingValue?: number | null
}) {
  const pct = targetValue !== null && targetValue > 0 ? Math.round((actualValue / targetValue) * 100) : null
  const offTarget = pct !== null && (pct < 85 || pct > 115)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span className={offTarget ? 'text-amber-600' : 'text-slate-500'}>{pct === null ? '—' : `${pct}%`}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn('h-full rounded-full', offTarget ? 'bg-amber-500' : 'bg-primary')}
          style={{ width: `${pct === null ? 0 : Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400">
        {Math.round(actualValue)}{suffix}{targetValue !== null && ` / ${Math.round(targetValue)}${suffix}`}
        {remainingValue !== undefined && remainingValue !== null && (
          remainingValue > 0
            ? ` · ${Math.round(remainingValue)}${suffix} left`
            : remainingValue < 0
              ? ` · ${Math.round(-remainingValue)}${suffix} over`
              : ' · done'
        )}
      </p>
    </div>
  )
}

/** This day's own totals vs. the plan's target — meaningful once a plan has more than one day, since days can vary from the plan's overall average. */
function DayProgress({
  dayTotal, target,
}: {
  dayTotal: { calories: number; protein: number; carbs: number; fat: number }
  target: { calories: number; protein: number; carbs: number; fat: number }
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 sm:grid-cols-4">
      {PROGRESS_MACROS.map(({ key, label, suffix }) => (
        <MacroBar key={key} label={label} suffix={suffix} actualValue={dayTotal[key]} targetValue={target[key]} />
      ))}
    </div>
  )
}

/** Persistent Added-so-far / Target / Remaining strip, visible on every tab of the builder — lives outside TabsContent so it doesn't disappear when switching tabs. */
function TargetSummaryBar({
  added, targets, remaining,
}: {
  added: { calories: number; protein: number; carbs: number; fat: number } | null
  targets: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null }
  remaining: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null }
}) {
  return (
    <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-2.5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PROGRESS_MACROS.map(({ key, label, suffix }) => (
          <MacroBar
            key={key}
            label={label}
            suffix={suffix}
            actualValue={added ? added[key] : 0}
            targetValue={targets[key]}
            remainingValue={remaining[key]}
          />
        ))}
      </div>
    </div>
  )
}

/** Rounds a quantity to the nearest 50g/ml and never below 50 — steppers and typed values both land on whole 50s, never fractional grams. */
function roundQuantity(value: number) {
  return Math.max(50, Math.round(value / 50) * 50)
}

/** One added food/alternative row — a compact display by default, with a pencil toggle into a ±50 stepper (and free-typed, rounded-on-commit input) for correcting the quantity without deleting and re-adding the item. */
function MealItemRow({
  prefix, item, onUpdateQuantity, onRemove,
}: {
  prefix?: string
  item: { localId: number; foodName: string; quantity: number; unit: string; calories: number }
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(item.quantity))

  const commit = (value: number) => {
    const rounded = roundQuantity(value)
    setDraft(String(rounded))
    onUpdateQuantity(rounded)
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-xs">
      <span className="text-slate-700">
        {prefix}{item.foodName} <span className="text-slate-400">— {item.quantity}{item.unit}</span>
      </span>
      <div className="flex items-center gap-1.5">
        {editing ? (
          <>
            <button type="button" className="rounded border border-slate-200 bg-white p-0.5 text-slate-500 hover:text-primary" onClick={() => commit(item.quantity - 50)}>
              <Minus className="h-3 w-3" />
            </button>
            <Input
              type="number"
              step={50}
              min={50}
              className="h-6 w-16 px-1 text-xs"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commit(Number(draft) || item.quantity)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(Number(draft) || item.quantity) }}
            />
            <button type="button" className="rounded border border-slate-200 bg-white p-0.5 text-slate-500 hover:text-primary" onClick={() => commit(item.quantity + 50)}>
              <Plus className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-primary hover:text-primary/80">
              <Check className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="font-medium text-slate-500">{item.calories} kcal</span>
            <button
              type="button"
              onClick={() => { setDraft(String(item.quantity)); setEditing(true) }}
              className="text-slate-300 hover:text-primary"
              title="Edit quantity"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </>
        )}
        <button type="button" onClick={onRemove} className="text-slate-300 hover:text-red-500">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function MealCard({
  meal, onRemove, onUpdate, onAddItem, onRemoveItem, onUpdateItemQuantity, onAddAlternative, onRemoveAlternative, onUpdateAlternativeQuantity,
}: {
  meal: BuilderMeal
  onRemove: () => void
  onUpdate: (patch: Partial<BuilderMeal>) => void
  onAddItem: (item: MealItemInput) => void
  onRemoveItem: (itemLocalId: number) => void
  onUpdateItemQuantity: (itemLocalId: number, quantity: number) => void
  onAddAlternative: (alt: MealAlternativeInput) => void
  onRemoveAlternative: (altLocalId: number) => void
  onUpdateAlternativeQuantity: (altLocalId: number, quantity: number) => void
}) {
  const totals = sum(meal.items)
  const [showAlternatives, setShowAlternatives] = useState(meal.alternatives.length > 0)

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Meal</span>
          <Select value={meal.mealType} onValueChange={(v) => onUpdate({ mealType: v })}>
            <SelectTrigger className="h-8 w-40 bg-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{MEAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Time</span>
          <Input
            className="h-8 w-28 bg-white text-xs"
            type="time"
            value={meal.mealTime ?? ''}
            onChange={(e) => onUpdate({ mealTime: e.target.value })}
          />
        </div>
        <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          {Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g protein
        </span>
        <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-white hover:text-red-500" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {meal.items.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-white p-1.5">
          {meal.items.map((item) => (
            <MealItemRow
              key={item.localId}
              item={item}
              onUpdateQuantity={(qty) => onUpdateItemQuantity(item.localId, qty)}
              onRemove={() => onRemoveItem(item.localId)}
            />
          ))}
        </div>
      )}

      <div className="mt-2"><FoodPicker onAdd={onAddItem} /></div>

      <button
        type="button"
        className={cn(
          'mt-2 flex items-center gap-1 text-xs font-medium',
          showAlternatives ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
        )}
        onClick={() => setShowAlternatives((v) => !v)}
      >
        {showAlternatives ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Alternatives {meal.alternatives.length > 0 && `(${meal.alternatives.length})`}
      </button>

      {showAlternatives && (
        <div className="mt-2 space-y-2 rounded-lg border border-dashed border-violet-200 bg-violet-50/40 p-2">
          <p className="text-[11px] text-violet-500">A member can swap the main foods above for one of these instead.</p>
          {meal.alternatives.map((alt) => (
            <MealItemRow
              key={alt.localId}
              prefix="OR "
              item={alt}
              onUpdateQuantity={(qty) => onUpdateAlternativeQuantity(alt.localId, qty)}
              onRemove={() => onRemoveAlternative(alt.localId)}
            />
          ))}
          <FoodPicker asAlternative onAdd={onAddAlternative} />
        </div>
      )}
    </div>
  )
}
