import catalog from './foodsData.json'

export interface CatalogFood {
  name: string
  serving_size: number
  serving_unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

export interface CatalogFoodGroup {
  group_id: string
  group_name: string
  foods: CatalogFood[]
}

export interface CatalogFoodCategory {
  category_id: string
  category_name: string
  description: string
  groups: CatalogFoodGroup[]
}

export interface LibraryFood {
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

const CATALOG_CATEGORIES = catalog.food_categories as CatalogFoodCategory[]

function findCatalogGroup(categoryId?: string, groupId?: string): CatalogFoodGroup | undefined {
  if (!categoryId || !groupId) return undefined
  return CATALOG_CATEGORIES.find((c) => c.category_id === categoryId)?.groups.find((g) => g.group_id === groupId)
}

/** Level 1 of the cascade: every category in the catalog. */
export function getCatalogCategories(): { id: string; name: string }[] {
  return CATALOG_CATEGORIES.map((c) => ({ id: c.category_id, name: c.category_name }))
}

/** Level 2: groups belonging to the selected category. */
export function getCatalogGroups(categoryId?: string): { id: string; name: string }[] {
  if (!categoryId) return []
  const cat = CATALOG_CATEGORIES.find((c) => c.category_id === categoryId)
  return (cat?.groups ?? []).map((g) => ({ id: g.group_id, name: g.group_name }))
}

/** Level 3: foods belonging to the selected category + group. */
export function getCatalogFoods(categoryId?: string, groupId?: string): CatalogFood[] {
  return findCatalogGroup(categoryId, groupId)?.foods ?? []
}

export function resolveLibraryFood(categoryId: string, groupId: string, foodName: string): LibraryFood | undefined {
  const group = findCatalogGroup(categoryId, groupId)
  const food = group?.foods.find((f) => f.name === foodName)
  if (!group || !food) return undefined
  return {
    name: food.name,
    servingSize: food.serving_size,
    servingUnit: food.serving_unit,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
  }
}

// Flat, alphabetized list of every catalog food — powers a free-text name
// autocomplete as an alternative to the cascading picker.
export const FOOD_LIBRARY: LibraryFood[] = CATALOG_CATEGORIES.flatMap((cat) =>
  cat.groups.flatMap((group) =>
    group.foods.map((f) => ({
      name: f.name,
      servingSize: f.serving_size,
      servingUnit: f.serving_unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber,
    }))
  )
).sort((a, b) => a.name.localeCompare(b.name))

export function findLibraryFood(name: string): LibraryFood | undefined {
  return FOOD_LIBRARY.find((f) => f.name === name)
}
