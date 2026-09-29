import { get, post, patch } from './client'

export type WorkoutSessionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'partially_completed'
  | 'skipped'
  | 'missed'
  | 'cancelled'

export interface WorkoutSetRecord {
  id: number
  setNumber: number
  targetReps: number | null
  targetWeight: string | null
  actualReps: number | null
  actualWeight: string | null
  durationSeconds: number | null
  distance: string | null
  intensity: string | null
  restSeconds: number | null
  status: 'completed' | 'skipped'
  notes: string | null
}

export interface WorkoutSessionExerciseRecord {
  id: number
  exerciseId: number
  exerciseName: string | null
  exerciseCategory: 'Strength' | 'Cardio' | 'Mobility' | 'Flexibility' | 'Balance' | null
  orderIndex: number
  targetSets: number | null
  targetReps: string | null
  targetWeight: string | null
  status: 'pending' | 'completed' | 'partially_completed' | 'skipped'
  durationSeconds: number | null
  distance: string | null
  intensity: string | null
  memberNotes: string | null
  trainerNotes: string | null
  sets: WorkoutSetRecord[]
}

export interface WorkoutSessionRecord {
  id: number
  programAssignmentId: number
  programDayId: number
  programDayName: string | null
  programName: string | null
  memberId: number
  scheduledDate: string
  originalScheduledDate: string | null
  rescheduledAt: string | null
  rescheduleReason: string | null
  status: WorkoutSessionStatus
  startedAt: string | null
  completedAt: string | null
  durationSeconds: number | null
  memberNotes: string | null
  trainerNotes: string | null
  exercises: WorkoutSessionExerciseRecord[]
}

export interface WorkoutProgressSummary {
  workoutCount: number
  completedCount: number
  partialCount: number
  skippedCount: number
  missedCount: number
  adherencePercentage: number | null
  currentWorkoutStreak: number
  lastWorkoutDate: string | null
}

export type AssessmentLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface FitnessAssessmentRecord {
  id: number
  memberId: number
  trainerId: number | null
  assessmentDate: string
  assessmentType: string | null
  strengthLevel: AssessmentLevel | null
  cardioLevel: AssessmentLevel | null
  mobilityLevel: AssessmentLevel | null
  overallFitnessLevel: AssessmentLevel | null
  goalsReviewed: string[] | null
  recommendations: string | null
  notes: string | null
}

export interface CreateFitnessAssessmentPayload {
  memberId: number
  assessmentDate: string
  assessmentType?: string
  strengthLevel?: AssessmentLevel
  cardioLevel?: AssessmentLevel
  mobilityLevel?: AssessmentLevel
  overallFitnessLevel?: AssessmentLevel
  goalsReviewed?: string[]
  recommendations?: string
  notes?: string
}

export const workoutTrackingApi = {
  sessionsForMember: (memberId: number) =>
    get<WorkoutSessionRecord[]>(`/workout-sessions/member/${memberId}`),
  progressSummary: (memberId: number) =>
    get<WorkoutProgressSummary>(`/workout-progress/${memberId}`),
  fitnessAssessments: (memberId: number) =>
    get<FitnessAssessmentRecord[]>(`/fitness-assessments/member/${memberId}`),
  createFitnessAssessment: (payload: CreateFitnessAssessmentPayload) =>
    post<FitnessAssessmentRecord>('/fitness-assessments', payload),
  scheduleSession: (assignmentId: number, payload: { programDayId: number; scheduledDate: string }) =>
    post<WorkoutSessionRecord>(`/program-assignments/${assignmentId}/sessions`, payload),
  updateSession: (id: number, payload: { status?: WorkoutSessionStatus; scheduledDate?: string; rescheduleReason?: string; memberNotes?: string; trainerNotes?: string }) =>
    patch<WorkoutSessionRecord>(`/workout-sessions/${id}`, payload),
}