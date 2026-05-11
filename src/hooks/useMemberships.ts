import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membershipsApi, type MembershipPlan, type SubscribePayload } from '@/api/memberships.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from './use-toast'

const keys = {
  plans: (businessId: string) => ['memberships', 'plans', businessId] as const,
  expiring: (businessId: string, days: number) => ['memberships', 'expiring', businessId, days] as const,
  memberHistory: (businessId: string, memberId: string) => ['memberships', 'history', businessId, memberId] as const,
}

function resolveScopeId(overrideBusinessId?: string) {
  if ((overrideBusinessId ?? '').trim()) return (overrideBusinessId ?? '').trim()
  const authState = useAuthStore.getState()
  const context = (authState.gymContext ?? {}) as { businessId?: string; business_id?: string }
  const user = (authState.user ?? {}) as { businessId?: string | null; business_id?: string | null }
  return (context.businessId || context.business_id || user.businessId || user.business_id || '').trim()
}

export function useMembershipPlans(overrideBusinessId?: string) {
  const businessId = resolveScopeId(overrideBusinessId)
  return useQuery({
    queryKey: keys.plans(businessId),
    queryFn: () => membershipsApi.listPlans(businessId),
    enabled: !!businessId,
  })
}

export function useMembershipPlan(planId: string, overrideBusinessId?: string) {
  const businessId = resolveScopeId(overrideBusinessId)
  return useQuery({
    queryKey: ['memberships', 'plan', businessId, planId],
    queryFn: () => membershipsApi.showPlan(businessId, planId),
    enabled: !!businessId && !!planId,
  })
}

export function useExpiringMemberships(days: number = 7) {
  const businessId = resolveScopeId()
  return useQuery({
    queryKey: keys.expiring(businessId, days),
    queryFn: () => membershipsApi.expiring(businessId, days),
    enabled: !!businessId,
  })
}

export function useMemberSubscriptions(memberId: string) {
  const businessId = resolveScopeId()
  return useQuery({
    queryKey: keys.memberHistory(businessId, memberId),
    queryFn: () => membershipsApi.memberHistory(businessId, memberId),
    enabled: !!businessId && !!memberId,
  })
}

export function useCreateMembershipPlan(overrideBusinessId?: string) {
  const businessId = resolveScopeId(overrideBusinessId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<MembershipPlan>) => membershipsApi.createPlan(businessId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans(businessId) })
      toast({ title: 'Plan created', variant: 'default' })
    },
    onError: () => toast({ title: 'Failed to create plan', variant: 'destructive' }),
  })
}

export function useUpdateMembershipPlan(overrideBusinessId?: string) {
  const businessId = resolveScopeId(overrideBusinessId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Partial<MembershipPlan> }) =>
      membershipsApi.updatePlan(businessId, planId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans(businessId) })
      toast({ title: 'Plan updated' })
    },
    onError: () => toast({ title: 'Failed to update plan', variant: 'destructive' }),
  })
}

export function useSubscribeMember() {
  const businessId = resolveScopeId()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: SubscribePayload) => membershipsApi.subscribe(businessId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: keys.memberHistory(businessId, variables.gymMemberId) })
      toast({ title: 'Subscription created', variant: 'default' })
    },
    onError: () => toast({ title: 'Subscription failed', variant: 'destructive' }),
  })
}

export function useDeleteMembershipPlan(overrideBusinessId?: string) {
  const businessId = resolveScopeId(overrideBusinessId)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => membershipsApi.deletePlan(businessId, planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.plans(businessId) })
      toast({ title: 'Plan deleted' })
    },
    onError: () => toast({ title: 'Failed to delete plan', variant: 'destructive' }),
  })
}
