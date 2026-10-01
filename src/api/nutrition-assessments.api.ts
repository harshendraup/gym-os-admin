import { get, post, put, del } from './client'

export type NutritionGoal =
  | 'Weight & Fat Loss'
  | 'Muscle Building'
  | 'Body Recomposition'
  | 'Weight Maintenance'
  | 'General Health & Fitness'
  | 'Sports Performance'
  | 'Healthy Aging'
export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active'
export type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Vegan'
export type NutritionAssessmentStatus = 'Draft' | 'Completed'

export interface NutritionAssessmentRecord {
  id: number
  businessId: number
  branchId: number
  memberId: number
  createdBy: number | null
  goal: NutritionGoal
  targetWeight: string | null
  currentWeight: string | null
  height: string | null
  waist: string | null
  bodyFatPercentage: string | null
  activityLevel: ActivityLevel
  workoutFrequency: number | null
  workoutTime: string | null
  wakeTime: string | null
  sleepTime: string | null
  dietType: DietType
  mealsPerDay: number
  foodPreference: string | null
  cookingPreference: string | null
  budgetPreference: string | null
  waterIntake: string | null
  allergies: string | null
  foodRestrictions: string | null
  foodsLiked: string | null
  foodsDisliked: string | null
  dietNotes: string | null
  additionalNotes: string | null
  status: NutritionAssessmentStatus
  createdAt: string
  updatedAt: string
}

export interface CreateNutritionAssessmentPayload {
  memberId: number
  goal: NutritionGoal
  targetWeight?: number
  currentWeight?: number
  height?: number
  waist?: number
  bodyFatPercentage?: number
  activityLevel: ActivityLevel
  workoutFrequency?: number
  workoutTime?: string
  wakeTime?: string
  sleepTime?: string
  dietType: DietType
  mealsPerDay?: number
  foodPreference?: string
  cookingPreference?: string
  budgetPreference?: string
  waterIntake?: number
  allergies?: string
  foodRestrictions?: string
  foodsLiked?: string
  foodsDisliked?: string
  dietNotes?: string
  additionalNotes?: string
  status?: NutritionAssessmentStatus
}

export type UpdateNutritionAssessmentPayload = Partial<
  Omit<CreateNutritionAssessmentPayload, 'memberId'>
>

export const nutritionAssessmentsApi = {
  list: () => get<NutritionAssessmentRecord[]>('/nutrition-assessments'),
  forMember: (memberId: number) =>
    get<NutritionAssessmentRecord[]>(`/nutrition/assessments/${memberId}`),
  get: (id: number) => get<NutritionAssessmentRecord>(`/nutrition-assessments/${id}`),
  create: (data: CreateNutritionAssessmentPayload) =>
    post<NutritionAssessmentRecord>('/nutrition-assessments', data),
  update: (id: number, data: UpdateNutritionAssessmentPayload) =>
    put<NutritionAssessmentRecord>(`/nutrition-assessments/${id}`, data),
  delete: (id: number) => del<void>(`/nutrition-assessments/${id}`),
}
