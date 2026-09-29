import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  workoutTrackingApi,
  type CreateFitnessAssessmentPayload,
} from '@/api/workout-tracking.api'
import { programAssignmentKeys } from '@/hooks/useProgramAssignments'

export const workoutTrackingKeys = {
  sessions: (memberId: number) => ['workout-sessions', 'member', memberId] as const,
  summary: (memberId: number) => ['workout-progress', memberId] as const,
  assessments: (memberId: number) => ['fitness-assessments', 'member', memberId] as const,
}

export function useWorkoutSessionsForMember(memberId: number | undefined) {
  return useQuery({
    queryKey: workoutTrackingKeys.sessions(memberId ?? 0),
    queryFn: () => workoutTrackingApi.sessionsForMember(memberId!),
    enabled: !!memberId,
    staleTime: 30_000,
  })
}

export function useWorkoutProgressSummary(memberId: number | undefined) {
  return useQuery({
    queryKey: workoutTrackingKeys.summary(memberId ?? 0),
    queryFn: () => workoutTrackingApi.progressSummary(memberId!),
    enabled: !!memberId,
    staleTime: 30_000,
  })
}

export function useFitnessAssessments(memberId: number | undefined) {
  return useQuery({
    queryKey: workoutTrackingKeys.assessments(memberId ?? 0),
    queryFn: () => workoutTrackingApi.fitnessAssessments(memberId!),
    enabled: !!memberId,
    staleTime: 30_000,
  })
}

export function useCreateFitnessAssessment(memberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CreateFitnessAssessmentPayload, 'memberId'>) =>
      workoutTrackingApi.createFitnessAssessment({ ...payload, memberId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutTrackingKeys.assessments(memberId) })
      toast.success('Fitness assessment recorded')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to record fitness assessment')),
  })
}

export function useScheduleWorkoutSession(memberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, programDayId, scheduledDate }: {
      assignmentId: number
      programDayId: number
      scheduledDate: string
    }) => workoutTrackingApi.scheduleSession(assignmentId, { programDayId, scheduledDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutTrackingKeys.sessions(memberId) })
      queryClient.invalidateQueries({ queryKey: workoutTrackingKeys.summary(memberId) })
      queryClient.invalidateQueries({ queryKey: programAssignmentKeys.all() })
      toast.success('Workout scheduled')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to schedule workout')),
  })
}

export function useRescheduleWorkoutSession(memberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, scheduledDate, rescheduleReason }: {
      sessionId: number
      scheduledDate: string
      rescheduleReason: string
    }) => workoutTrackingApi.updateSession(sessionId, { scheduledDate, rescheduleReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutTrackingKeys.sessions(memberId) })
      queryClient.invalidateQueries({ queryKey: workoutTrackingKeys.summary(memberId) })
      toast.success('Workout rescheduled')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to reschedule workout')),
  })
}