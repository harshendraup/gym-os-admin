import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workoutModelsApi } from '@/api/workoutModels.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from './use-toast'

const getBusinessId = () => {
  const auth = useAuthStore.getState()
  const context = (auth.gymContext ?? {}) as any
  const user = (auth.user ?? {}) as any
  return (context.businessId || context.business_id || user.businessId || user.business_id || '').trim()
}

const keys = {
  models: (businessId: string) => ['workout-models', businessId] as const,
  assignments: (businessId: string) => ['workout-assignments', businessId] as const,
}

export function useWorkoutModels() {
  const businessId = getBusinessId()
  return useQuery({
    queryKey: keys.models(businessId),
    queryFn: () => workoutModelsApi.listModels(businessId),
    enabled: !!businessId,
  })
}

export function useCreateWorkoutModel() {
  const businessId = getBusinessId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => workoutModelsApi.createModel(businessId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.models(businessId) })
      toast({ title: 'Workout model created' })
    },
    onError: () => toast({ title: 'Failed to create workout model', variant: 'destructive' }),
  })
}

export function useDeleteWorkoutModel() {
  const businessId = getBusinessId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workoutModelsApi.deleteModel(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.models(businessId) })
      toast({ title: 'Workout model archived' })
    },
    onError: () => toast({ title: 'Failed to delete workout model', variant: 'destructive' }),
  })
}

export function useUpdateWorkoutModel() {
  const businessId = getBusinessId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      workoutModelsApi.updateModel(businessId, id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.models(businessId) })
      toast({ title: 'Workout model updated' })
    },
    onError: () => toast({ title: 'Failed to update workout model', variant: 'destructive' }),
  })
}

export function useWorkoutAssignments() {
  const businessId = getBusinessId()
  return useQuery({
    queryKey: keys.assignments(businessId),
    queryFn: () => workoutModelsApi.listAssignments(businessId),
    enabled: !!businessId,
  })
}

export function useAssignWorkoutModel() {
  const businessId = getBusinessId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ modelId, payload }: { modelId: string; payload: any }) =>
      workoutModelsApi.assignModel(businessId, modelId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.assignments(businessId) })
      toast({ title: 'Model assigned to member' })
    },
    onError: () => toast({ title: 'Failed to assign workout model', variant: 'destructive' }),
  })
}
