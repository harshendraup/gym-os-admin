import { useQuery } from '@tanstack/react-query'
import { trainerMembersApi, type TrainerMemberFilters } from '@/api/trainer-members.api'

export const trainerMemberKeys = {
  all: () => ['trainer-members'] as const,
  list: (filters: TrainerMemberFilters) => ['trainer-members', filters] as const,
  detail: (memberId: string) => ['trainer-members', memberId] as const,
}

export function useTrainerMembers(filters: TrainerMemberFilters = {}) {
  return useQuery({
    queryKey: trainerMemberKeys.list(filters),
    queryFn: () => trainerMembersApi.list(filters),
    staleTime: 30_000,
  })
}

export function useTrainerMember(memberId: string) {
  return useQuery({
    queryKey: trainerMemberKeys.detail(memberId),
    queryFn: () => trainerMembersApi.get(memberId),
    enabled: !!memberId,
  })
}