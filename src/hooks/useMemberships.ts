import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membershipsApi, type MembershipPlan, type SubscribePayload } from '@/api/memberships.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from './use-toast'

const keys = {
  plans: (gymId: string) => ['memberships', 'plans', gymId] as const,
  expiring: (gymId: string, days: number) => ['memberships', 'expiring', gymId, days] as const,
  memberHistory: (gymId: string, memberId: string) => ['memberships', 'history', gymId, memberId] as const,
}

export function useMembershipPlans() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  return useQuery({
    queryKey: keys.plans(gymId),
    queryFn: () => membershipsApi.listPlans(gymId),
    enabled: !!gymId,
  })
}

export function useExpiringMemberships(days: number = 7) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  return useQuery({
    queryKey: keys.expiring(gymId, days),
    queryFn: () => membershipsApi.expiring(gymId, days),
    enabled: !!gymId,
  })
}

export function useMemberSubscriptions(memberId: string) {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  return useQuery({
    queryKey: keys.memberHistory(gymId, memberId),
    queryFn: () => membershipsApi.memberHistory(gymId, memberId),
    enabled: !!gymId && !!memberId,
  })
}

export function useCreateMembershipPlan() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<MembershipPlan>) => membershipsApi.createPlan(gymId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans(gymId) })
      toast({ title: 'Plan created', variant: 'default' })
    },
    onError: () => toast({ title: 'Failed to create plan', variant: 'destructive' }),
  })
}

export function useUpdateMembershipPlan() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Partial<MembershipPlan> }) =>
      membershipsApi.updatePlan(gymId, planId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans(gymId) })
      toast({ title: 'Plan updated' })
    },
    onError: () => toast({ title: 'Failed to update plan', variant: 'destructive' }),
  })
}

export function useSubscribeMember() {
  const gymId = useAuthStore((s) => s.gymContext?.gymId ?? '')
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: SubscribePayload) => membershipsApi.subscribe(gymId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: keys.memberHistory(gymId, variables.gymMemberId) })
      toast({ title: 'Subscription created', variant: 'default' })
    },
    onError: () => toast({ title: 'Subscription failed', variant: 'destructive' }),
  })
}
