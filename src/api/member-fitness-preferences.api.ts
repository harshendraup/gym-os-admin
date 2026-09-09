import { get, put } from './client'

export type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type GymExperienceLevel = 'Less than 6 months' | '6-12 months' | '1-3 years' | '3+ years'
export type FitnessGoal =
  | 'Weight Loss' | 'Fat Loss' | 'Muscle Gain' | 'Strength' | 'Bodybuilding'
  | 'General Fitness' | 'Endurance' | 'Mobility/Flexibility' | 'Sports Performance' | 'Weight Maintenance'

export interface MemberFitnessPreferenceRecord {
  id: number
  businessId: number
  branchId: number
  memberId: number
  updatedBy: number | null
  fitnessLevel: FitnessLevel | null
  gymExperienceLevel: GymExperienceLevel | null
  previousGymExperience: string | null
  workoutFrequency: number | null
  preferredDays: string[] | null
  preferredDuration: number | null
  preferredTime: string | null
  preferredWorkoutTypes: string[] | null
  favoriteExercises: string[] | null
  avoidExercises: string[] | null
  availableEquipment: string[] | null
  injuries: string | null
  physicalLimitations: string | null
  exerciseRestrictions: string | null
  mobilityLimitations: string | null
  fitnessAssessmentNotes: string | null
  primaryGoal: FitnessGoal | null
  secondaryGoals: FitnessGoal[] | null
  targetWeight: string | null
  targetBodyFatPercentage: string | null
  goalTimeline: string | null
  strengthLevel: FitnessLevel | null
  cardioLevel: FitnessLevel | null
  mobilityLevel: FitnessLevel | null
  overallFitnessLevel: FitnessLevel | null
  createdAt: string
  updatedAt: string
}

export interface SaveMemberFitnessPreferencePayload {
  memberId: number
  fitnessLevel?: FitnessLevel
  gymExperienceLevel?: GymExperienceLevel
  previousGymExperience?: string
  workoutFrequency?: number
  preferredDays?: string[]
  preferredDuration?: number
  preferredTime?: string
  preferredWorkoutTypes?: string[]
  favoriteExercises?: string[]
  avoidExercises?: string[]
  availableEquipment?: string[]
  injuries?: string
  physicalLimitations?: string
  exerciseRestrictions?: string
  mobilityLimitations?: string
  fitnessAssessmentNotes?: string
  primaryGoal?: FitnessGoal
  secondaryGoals?: FitnessGoal[]
  targetWeight?: number
  targetBodyFatPercentage?: number
  goalTimeline?: string
  strengthLevel?: FitnessLevel
  cardioLevel?: FitnessLevel
  mobilityLevel?: FitnessLevel
  overallFitnessLevel?: FitnessLevel
}

export const memberFitnessPreferencesApi = {
  /** null means this member has no fitness preferences saved yet. */
  forMember: (memberId: number) =>
    get<MemberFitnessPreferenceRecord | null>(`/member-fitness-preferences/${memberId}`),
  save: (data: SaveMemberFitnessPreferencePayload) =>
    put<MemberFitnessPreferenceRecord>('/member-fitness-preferences', data),
}
