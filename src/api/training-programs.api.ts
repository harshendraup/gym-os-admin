import { get, post, put, del } from './client'
import type { ExerciseCategory } from './exercises.api'

/**
 * The real `/training-programs` resource (gym-os-api). A program is a
 * business+branch template (Day 1 / Day 2 / ... structure), not tied to a
 * member yet — see program-assignments.api.ts for the "assign this
 * program to a member" step.
 */
export type TrainingProgramGoal =
  | 'Weight & Fat Loss'
  | 'Muscle Building'
  | 'Body Toning & Recomposition'
  | 'Strength & Power'
  | 'General Health & Fitness'
  | 'Endurance & Cardio'
  | 'Mobility & Posture'
  | 'Athletic & Sports Performance'
  | 'Weight Maintenance'
  | 'Rehab & Joint Recovery'
export type TrainingProgramDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface ProgramExerciseRecord {
  id: number
  exerciseId: number
  exerciseName: string | null
  exerciseCategory: ExerciseCategory | null
  sets: number | null
  reps: string | null
  restSeconds: number | null
  tempo: string | null
  weightGuidance: string | null
  orderIndex: number
  notes: string | null
}

export interface ProgramDayRecord {
  id: number
  dayNumber: number
  dayOfWeek: number | null
  dayName: string | null
  restDay: boolean
  orderIndex: number
  exercises: ProgramExerciseRecord[]
}

export interface TrainingProgramRecord {
  id: number
  businessId: number
  branchId: number
  createdBy: number | null
  createdByRole: 'superadmin' | 'admin' | 'sub_admin'
  name: string
  description: string | null
  goal: TrainingProgramGoal
  durationWeeks: number | null
  difficultyLevel: TrainingProgramDifficulty
  isActive: boolean
  createdAt: string
  updatedAt: string
  days: ProgramDayRecord[]
}

export interface ProgramExerciseInput {
  exerciseId: number
  sets?: number
  reps?: string
  restSeconds?: number
  tempo?: string
  weightGuidance?: string
  orderIndex?: number
  notes?: string
}

export interface ProgramDayInput {
  dayNumber: number
  dayOfWeek?: number
  dayName?: string
  restDay?: boolean
  orderIndex?: number
  exercises?: ProgramExerciseInput[]
}

export interface CreateTrainingProgramPayload {
  branchId: number
  name: string
  description?: string
  goal: TrainingProgramGoal
  durationWeeks?: number
  difficultyLevel?: TrainingProgramDifficulty
  isActive?: boolean
  days?: ProgramDayInput[]
}

export type UpdateTrainingProgramPayload = Partial<Omit<CreateTrainingProgramPayload, 'branchId'>>

export const trainingProgramsApi = {
  list: () => get<TrainingProgramRecord[]>('/training-programs'),

  get: (id: number) => get<TrainingProgramRecord>(`/training-programs/${id}`),

  create: (data: CreateTrainingProgramPayload) =>
    post<TrainingProgramRecord>('/training-programs', data),

  update: (id: number, data: UpdateTrainingProgramPayload) =>
    put<TrainingProgramRecord>(`/training-programs/${id}`, data),

  delete: (id: number) => del<void>(`/training-programs/${id}`),
}
