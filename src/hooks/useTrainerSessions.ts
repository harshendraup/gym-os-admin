import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trainerSessionsApi, type TrainerSessionRecord } from '@/api/trainer-sessions.api'
import { toast } from 'sonner'

export const trainerSessionKeys = { all: () => ['trainer-sessions'] as const }

export function useTrainerSessions() {
  return useQuery({ queryKey: trainerSessionKeys.all(), queryFn: trainerSessionsApi.list, staleTime: 30_000 })
}

export function useUpdateTrainerSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TrainerSessionRecord> }) => trainerSessionsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: trainerSessionKeys.all() }); toast.success('Session updated') },
  })
}