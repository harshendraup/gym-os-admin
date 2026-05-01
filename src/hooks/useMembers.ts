import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi, type MemberFilters } from '@/api/members.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export const memberKeys = {
  all: (gymId: string) => ['members', gymId] as const,
  list: (gymId: string, filters: MemberFilters) => ['members', gymId, filters] as const,
  detail: (gymId: string, id: string) => ['members', gymId, id] as const,
  stats: (gymId: string, id: string) => ['member-stats', gymId, id] as const,
}

export function useMembers(filters: MemberFilters = {}) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!

  return useQuery({
    queryKey: memberKeys.list(gymId, filters),
    queryFn: () => membersApi.list(gymId, filters),
    enabled: !!gymId,
    staleTime: 30_000,
  })
}

export function useMember(id: string) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!

  return useQuery({
    queryKey: memberKeys.detail(gymId, id),
    queryFn: () => membersApi.get(gymId, id),
    enabled: !!gymId && !!id,
  })
}

export function useMemberStats(id: string) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!

  return useQuery({
    queryKey: memberKeys.stats(gymId, id),
    queryFn: () => membersApi.stats(gymId, id),
    enabled: !!gymId && !!id,
  })
}

export function useCreateMember() {
  const queryClient = useQueryClient()
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => membersApi.create(gymId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all(gymId) })
      toast.success('Member added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message ?? 'Failed to add member')
    },
  })
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient()
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => membersApi.update(gymId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(gymId, id) })
      queryClient.invalidateQueries({ queryKey: memberKeys.all(gymId) })
      toast.success('Member updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message ?? 'Failed to update member')
    },
  })
}

export function useDeleteMember() {
  const queryClient = useQueryClient()
  const gymId = useAuthStore((s) => s.gymContext?.gymId)!

  return useMutation({
    mutationFn: (id: string) => membersApi.delete(gymId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all(gymId) })
      toast.success('Member removed')
    },
    onError: () => {
      toast.error('Failed to remove member')
    },
  })
}
