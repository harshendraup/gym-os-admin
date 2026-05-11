import { api } from './client'

const requireBusinessId = (businessId: string) => {
  const id = (businessId ?? '').trim()
  if (!id) throw new Error('Business context is required. Please include businessId.')
  return id
}

export interface WorkoutModel {
  id: string
  business_id: string
  name: string
  description: string | null
  goal: 'fat_loss' | 'muscle_gain' | 'general_fitness' | 'rehab' | 'sports'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_weeks: number
  sessions_per_week: number
  status: 'draft' | 'active' | 'archived'
  version: number
  is_active: boolean
}

export const workoutModelsApi = {
  listModels: (businessId: string) =>
    api.get<WorkoutModel[]>(`/business-admin/businesses/${requireBusinessId(businessId)}/workout-models`),

  createModel: (businessId: string, payload: any) =>
    api.post<WorkoutModel>(`/business-admin/businesses/${requireBusinessId(businessId)}/workout-models`, payload),

  updateModel: (businessId: string, id: string, payload: any) =>
    api.put<WorkoutModel>(`/business-admin/businesses/${requireBusinessId(businessId)}/workout-models/${id}`, payload),

  deleteModel: (businessId: string, id: string) =>
    api.del(`/business-admin/businesses/${requireBusinessId(businessId)}/workout-models/${id}`),

  listAssignments: (businessId: string) =>
    api.get<any[]>(`/business-admin/businesses/${requireBusinessId(businessId)}/workout-assignments`),

  assignModel: (businessId: string, modelId: string, payload: any) =>
    api.post(`/business-admin/businesses/${requireBusinessId(businessId)}/workout-models/${modelId}/assign`, payload),
}
