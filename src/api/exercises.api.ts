import { get, post, put, del } from './client'
import type { FitnessGoal, EquipmentType, TrackingMetric } from '@/components/constants'

/**
 * The real `/exercises` resource (gym-os-api) — a business's own reusable
 * exercise library, referenced by training program days. businessId is
 * derived server-side from the acting admin/sub_admin, never sent.
 */
export type ExerciseCategory = 'Strength' | 'Cardio' | 'Mobility' | 'Flexibility' | 'Balance'
export type MuscleGroup =
  | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Full Body' | 'Cardio'
export type ExerciseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface ExerciseRecord {
  id: number
  businessId: number
  createdBy: number | null
  name: string
  category: ExerciseCategory
  muscleGroup: MuscleGroup | null
  secondaryMuscleGroups: MuscleGroup[] | null
  difficultyLevel: ExerciseDifficulty | null
  equipment: string | null
  equipmentTags: EquipmentType[] | null
  trackingMetric: TrackingMetric | null
  isActive: boolean
  goals: FitnessGoal[]
  videoUrl: string | null
  instructions: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateExercisePayload {
  name: string
  category: ExerciseCategory
  muscleGroup?: MuscleGroup
  secondaryMuscleGroups?: MuscleGroup[]
  difficultyLevel?: ExerciseDifficulty
  equipment?: string
  equipmentTags?: EquipmentType[]
  trackingMetric?: TrackingMetric
  isActive?: boolean
  goals?: FitnessGoal[]
  videoUrl?: string
  instructions?: string
}

export type UpdateExercisePayload = Partial<CreateExercisePayload>

export interface ExerciseFilters {
  search?: string
  category?: ExerciseCategory
  muscleGroup?: MuscleGroup
  difficultyLevel?: ExerciseDifficulty
  equipment?: EquipmentType
  goal?: FitnessGoal
  isActive?: boolean
}

function toQueryString(filters?: ExerciseFilters) {
  if (!filters) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const exercisesApi = {
  list: (filters?: ExerciseFilters) => get<ExerciseRecord[]>(`/exercises${toQueryString(filters)}`),

  get: (id: number) => get<ExerciseRecord>(`/exercises/${id}`),

  create: (data: CreateExercisePayload) => post<ExerciseRecord>('/exercises', data),

  update: (id: number, data: UpdateExercisePayload) => put<ExerciseRecord>(`/exercises/${id}`, data),

  delete: (id: number) => del<void>(`/exercises/${id}`),
}
