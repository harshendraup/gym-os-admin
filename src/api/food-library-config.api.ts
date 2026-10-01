import { get, put, del } from './client'

/**
 * A gym's own curated subset of the master food catalog
 * (src/data/foodsData.json) — system categories/groups/foods it selected,
 * plus any custom ones it created. Fully resolved: every food already
 * carries its serving size/unit and macros, so nothing downstream needs to
 * re-map it.
 */
export interface GymLibraryFood {
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
}

export interface GymLibraryFoodGroup {
  id: string
  name: string
  source: 'system' | 'custom'
  foods: GymLibraryFood[]
}

export interface GymLibraryFoodCategory {
  id: string
  name: string
  source: 'system' | 'custom'
  groups: GymLibraryFoodGroup[]
}

export interface FoodLibraryConfigRecord {
  id: number
  businessId: number
  config: { categories: GymLibraryFoodCategory[] }
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

export const foodLibraryConfigApi = {
  /** null means the business hasn't configured its food library yet. */
  get: () => get<FoodLibraryConfigRecord | null>('/food-library-config'),

  save: (categories: GymLibraryFoodCategory[]) =>
    put<FoodLibraryConfigRecord>('/food-library-config', { categories }),

  /** Permanently deletes the business's food library configuration — reverts it to NOT_CONFIGURED. */
  delete: () => del<void>('/food-library-config'),
}
