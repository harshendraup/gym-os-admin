import type { GymLibraryFoodCategory, GymLibraryFoodGroup } from '@/api/food-library-config.api'
import type { LibraryFood } from './foodLibrary'

function findConfiguredGroup(
  categories: GymLibraryFoodCategory[],
  categoryId?: string,
  groupId?: string
): GymLibraryFoodGroup | undefined {
  if (!categoryId || !groupId) return undefined
  return categories.find((c) => c.id === categoryId)?.groups.find((g) => g.id === groupId)
}

export function listConfiguredCategories(categories: GymLibraryFoodCategory[]): { id: string; name: string }[] {
  return categories.map((c) => ({ id: c.id, name: c.name }))
}

export function listConfiguredGroups(categories: GymLibraryFoodCategory[], categoryId?: string): { id: string; name: string }[] {
  if (!categoryId) return []
  const category = categories.find((c) => c.id === categoryId)
  return (category?.groups ?? []).map((g) => ({ id: g.id, name: g.name }))
}

export function listConfiguredFoods(categories: GymLibraryFoodCategory[], categoryId?: string, groupId?: string) {
  return findConfiguredGroup(categories, categoryId, groupId)?.foods ?? []
}

/** Everything the group already carries is fully resolved — no mapping needed. */
export function resolveConfiguredFood(
  categories: GymLibraryFoodCategory[],
  categoryId: string,
  groupId: string,
  foodName: string
): LibraryFood | undefined {
  const group = findConfiguredGroup(categories, categoryId, groupId)
  const food = group?.foods.find((f) => f.name === foodName)
  if (!group || !food) return undefined
  return {
    name: food.name,
    category: food.category,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    altServingSize: food.altServingSize,
    altServingUnit: food.altServingUnit,
    preparationState: food.preparationState,
    dietType: food.dietType,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
  }
}
