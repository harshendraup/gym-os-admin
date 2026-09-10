import { get, post, put, del } from './client'
import type { DietType } from './nutrition-assessments.api'

export type DietPlanGoal = 'Weight Loss' | 'Muscle Gain' | 'Fat Loss' | 'Fitness'
export type DietPlanStatus = 'Draft' | 'Active' | 'Archived'
export type DietPlanType = 'Template' | 'Custom'

/**
 * Free-form plan-level preferences (diet type, meal frequency, food/cooking
 * preference) — stored in the `metaDietPlan` jsonb column, which already
 * exists and is fully wired through the validator/service/transformer but
 * had no defined shape yet. No migration needed to add this.
 */
export interface DietPlanMeta {
  dietType?: DietType
  mealsPerDay?: number
  foodPreference?: string
}

export interface DietMealItem {
  id: number
  foodId: number | null
  foodName: string
  quantity: string
  unit: string
  calories: string
  protein: string
  carbs: string
  fat: string
  sortOrder: number
  notes: string | null
}

export interface DietMealAlternative {
  id: number
  foodId: number | null
  foodName: string
  quantity: string
  unit: string
  calories: string
  protein: string
  carbs: string
  fat: string
  sortOrder: number
}

export interface DietMeal {
  id: number
  mealType: string
  mealName: string | null
  mealTime: string | null
  sortOrder: number
  notes: string | null
  caloriesTarget: string | null
  proteinTarget: string | null
  carbsTarget: string | null
  fatTarget: string | null
  items: DietMealItem[]
  alternatives: DietMealAlternative[]
}

export interface DietPlanDay {
  id: number
  dayNumber: number
  dayName: string | null
  isRestDay: boolean
  orderIndex: number
  notes: string | null
  meals: DietMeal[]
}

export interface DietSupplement {
  id: number
  name: string
  quantity: string
  unit: string | null
  timing: string | null
  frequency: string | null
  notes: string | null
  sortOrder: number
}

export interface DietHydration {
  id: number
  targetMl: string
  reminderSchedule: string | null
  notes: string | null
}

export interface DietPlanRecord {
  id: number
  businessId: number
  branchId: number
  createdBy: number | null
  createdByRole: 'superadmin' | 'admin' | 'sub_admin'
  assessmentId: number | null
  parentPlanId: number | null
  name: string
  goal: DietPlanGoal
  description: string | null
  planType: DietPlanType
  status: DietPlanStatus
  version: number
  startDate: string | null
  endDate: string | null
  reviewDate: string | null
  caloriesTarget: string | null
  proteinTarget: string | null
  carbsTarget: string | null
  fatTarget: string | null
  waterTarget: string | null
  isActive: boolean
  metaDietPlan: DietPlanMeta | null
  createdAt: string
  updatedAt: string
  days: DietPlanDay[]
  supplements: DietSupplement[]
  hydration: DietHydration | null
}

export interface MealItemInput {
  foodId?: number
  foodName: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sortOrder?: number
  notes?: string
}

export interface MealAlternativeInput {
  foodId?: number
  foodName: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sortOrder?: number
}

export interface MealInput {
  mealType: string
  mealName?: string
  mealTime?: string
  sortOrder?: number
  notes?: string
  caloriesTarget?: number
  proteinTarget?: number
  carbsTarget?: number
  fatTarget?: number
  items?: MealItemInput[]
  alternatives?: MealAlternativeInput[]
}

export interface PlanDayInput {
  dayNumber: number
  dayName?: string
  isRestDay?: boolean
  orderIndex?: number
  notes?: string
  meals?: MealInput[]
}

export interface SupplementInput {
  name: string
  quantity: string
  unit?: string
  timing?: string
  frequency?: string
  notes?: string
  sortOrder?: number
}

export interface HydrationInput {
  targetMl: number
  reminderSchedule?: string
  notes?: string
}

export interface CreateDietPlanPayload {
  branchId: number
  assessmentId?: number
  name: string
  goal: DietPlanGoal
  description?: string
  planType?: DietPlanType
  status?: DietPlanStatus
  startDate?: string
  endDate?: string
  reviewDate?: string
  caloriesTarget?: number
  proteinTarget?: number
  carbsTarget?: number
  fatTarget?: number
  waterTarget?: number
  isActive?: boolean
  metaDietPlan?: DietPlanMeta
  days?: PlanDayInput[]
  supplements?: SupplementInput[]
  hydration?: HydrationInput
}

export type UpdateDietPlanPayload = Partial<CreateDietPlanPayload> & {
  createNewVersion?: boolean
}

export const dietPlansApi = {
  list: () => get<DietPlanRecord[]>('/diet-plans'),
  get: (id: number) => get<DietPlanRecord>(`/diet-plans/${id}`),
  getDetails: (id: number) => get<DietPlanRecord>(`/diet-plans/${id}/details`),
  create: (data: CreateDietPlanPayload) => post<DietPlanRecord>('/diet-plans', data),
  update: (id: number, data: UpdateDietPlanPayload) => put<DietPlanRecord>(`/diet-plans/${id}`, data),
  duplicate: (id: number) => post<DietPlanRecord>(`/diet-plans/${id}/duplicate`, {}),
  delete: (id: number) => del<void>(`/diet-plans/${id}`),
}
