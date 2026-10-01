import type { ActivityLevel, NutritionGoal } from '@/api/nutrition-assessments.api'

/**
 * BMR/TDEE/macro-target suggestions for the diet plan builder — Mifflin-St
 * Jeor plus fixed, non-clinical constants (activity multiplier, goal
 * adjustment, g/kg protein). Always a starting point the trainer edits, never
 * auto-applied or persisted on its own — see NutritionAssessmentDialog and
 * CreateDietPlanDialog for where the result is shown/prefilled.
 */

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  Light: 1.375,
  Moderate: 1.55,
  Active: 1.725,
  'Very Active': 1.9,
}

// Loss goals map to a cut; Muscle Building to a surplus; Body Recomposition
// a slight cut; maintenance/performance/aging goals get no adjustment.
const GOAL_CALORIE_ADJUSTMENT: Record<NutritionGoal, number> = {
  'Weight & Fat Loss': -0.2,
  'Muscle Building': 0.12,
  'Body Recomposition': -0.1,
  'Weight Maintenance': 0,
  'General Health & Fitness': 0,
  'Sports Performance': 0.05,
  'Healthy Aging': 0,
}

const GOAL_PROTEIN_PER_KG: Record<NutritionGoal, number> = {
  'Weight & Fat Loss': 2.0,
  'Muscle Building': 1.8,
  'Body Recomposition': 1.8,
  'Weight Maintenance': 1.6,
  'General Health & Fitness': 1.4,
  'Sports Performance': 1.8,
  'Healthy Aging': 1.6,
}

const FAT_SHARE_OF_CALORIES = 0.25

export interface BmrInput {
  weightKg: number
  heightCm: number
  age: number
  gender: string | null | undefined
}

/** Mifflin-St Jeor. Unspecified/other gender averages the male/female constant rather than guessing which applies. */
export function calculateBmr({ weightKg, heightCm, age, gender }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const normalizedGender = gender?.trim().toLowerCase()
  if (normalizedGender === 'male' || normalizedGender === 'm') return base + 5
  if (normalizedGender === 'female' || normalizedGender === 'f') return base - 161
  return base + (5 + -161) / 2
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel]
}

export interface SuggestedTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface SuggestTargetsInput {
  tdee: number
  goal: NutritionGoal
  weightKg: number
}

/** Rounds calories to the nearest 10 and grams to the nearest 1 — suggestion precision, not clinical precision. */
export function suggestTargets({ tdee, goal, weightKg }: SuggestTargetsInput): SuggestedTargets {
  const calories = tdee * (1 + GOAL_CALORIE_ADJUSTMENT[goal])
  const protein = weightKg * GOAL_PROTEIN_PER_KG[goal]
  const fatCalories = calories * FAT_SHARE_OF_CALORIES
  const fat = fatCalories / 9
  const proteinCalories = protein * 4
  const carbs = Math.max(0, (calories - proteinCalories - fatCalories) / 4)

  return {
    calories: Math.round(calories / 10) * 10,
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  }
}

export interface SuggestTargetsFromProfileInput {
  weightKg: number | undefined
  heightCm: number | undefined
  age: number | null | undefined
  gender: string | null | undefined
  activityLevel: ActivityLevel
  goal: NutritionGoal
}

/**
 * End-to-end suggestion from raw profile fields — returns null when the
 * inputs needed for a meaningful estimate (weight, height, age) are missing,
 * so callers can show a "fill these in" prompt instead of a bogus number.
 */
export function suggestTargetsFromProfile(input: SuggestTargetsFromProfileInput): SuggestedTargets | null {
  const { weightKg, heightCm, age, gender, activityLevel, goal } = input
  if (!weightKg || !heightCm || !age) return null

  const bmr = calculateBmr({ weightKg, heightCm, age, gender })
  const tdee = calculateTdee(bmr, activityLevel)
  return suggestTargets({ tdee, goal, weightKg })
}
