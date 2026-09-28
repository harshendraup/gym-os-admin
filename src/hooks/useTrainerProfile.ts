import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trainerAuthApi } from '@/api/trainer-auth.api'
import { toast } from 'sonner'

export function useTrainerProfile() {
  return useQuery({
    queryKey: ['trainer-profile'],
    queryFn: trainerAuthApi.me,
    staleTime: 60_000,
  })
}

export function useUpdateTrainerProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => trainerAuthApi.updateMe(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trainer-profile'] }); toast.success('Profile updated') },
    onError: () => toast.error('Unable to update your profile'),
  })
}