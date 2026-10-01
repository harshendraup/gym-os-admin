import { get, post, put, del } from './client'

export interface FoodRecord {
  id: number
  businessId: number | null
  createdBy: number | null
  name: string
  category: string | null
  servingSize: string
  servingUnit: string
  altServingSize: string | null
  altServingUnit: string | null
  preparationState: string | null
  dietType: string | null
  calories: string
  protein: string
  carbs: string
  fat: string
  fiber: string | null
  isGlobal: boolean
  isActive: boolean
  metaFood: unknown | null
  createdAt: string
  updatedAt: string
}

export interface CreateFoodPayload {
  name: string
  category?: string
  servingSize: number
  servingUnit: string
  altServingSize?: number
  altServingUnit?: string
  preparationState?: string
  dietType?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  isActive?: boolean
}

export type UpdateFoodPayload = Partial<CreateFoodPayload>

export const foodsApi = {
  list: () => get<FoodRecord[]>('/foods'),
  get: (id: number) => get<FoodRecord>(`/foods/${id}`),
  create: (data: CreateFoodPayload) => post<FoodRecord>('/foods', data),
  update: (id: number, data: UpdateFoodPayload) => put<FoodRecord>(`/foods/${id}`, data),
  delete: (id: number) => del<void>(`/foods/${id}`),
}
