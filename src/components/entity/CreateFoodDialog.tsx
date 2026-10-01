import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useCreateFood } from '@/hooks/useFoods'
import { getCatalogCategories, getCatalogGroups, getCatalogFoods, resolveLibraryFood } from '@/data/foodLibrary'
import { listConfiguredCategories, listConfiguredGroups, listConfiguredFoods, resolveConfiguredFood } from '@/data/gymFoodLibrary'
import type { GymLibraryFoodCategory } from '@/api/food-library-config.api'
import { SERVING_UNITS, FOOD_CATEGORIES, PREPARATION_STATES, DIET_TYPES } from '@/components/constants'

const schema = z.object({
  name: z.string().min(1, 'Food name is required'),
  category: z.string().optional(),
  servingSize: z.string().min(1, 'Serving size is required'),
  servingUnit: z.enum(SERVING_UNITS),
  altServingSize: z.string().optional(),
  altServingUnit: z.enum(SERVING_UNITS).optional(),
  preparationState: z.enum(PREPARATION_STATES).optional(),
  dietType: z.enum(DIET_TYPES).optional(),
  calories: z.string().min(1, 'Calories is required'),
  protein: z.string().min(1, 'Protein is required'),
  carbs: z.string().min(1, 'Carbs is required'),
  fat: z.string().min(1, 'Fat is required'),
  fiber: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface CreateFoodDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: (foodId: number) => void
  /**
   * When provided, the picker is scoped to this business's configured food
   * library instead of the full master catalog — the flow used by the gated
   * "Food Library" tab.
   */
  libraryCatalog?: GymLibraryFoodCategory[]
}

export function CreateFoodDialog({ open, onClose, onCreated, libraryCatalog }: CreateFoodDialogProps) {
  const create = useCreateFood()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Cascading library picker: Category -> Group -> Food.
  // Each level's options are derived from foodsData.json, never hardcoded.
  const [pickCategory, setPickCategory] = useState('')
  const [pickGroup, setPickGroup] = useState('')
  const [pickFood, setPickFood] = useState('')
  const [category, setCategory] = useState('')
  const [dietType, setDietType] = useState('')
  const [servingUnit, setServingUnit] = useState('g')
  const [altServingUnit, setAltServingUnit] = useState('')
  const [preparationState, setPreparationState] = useState('')

  const catalogCategories = libraryCatalog ? listConfiguredCategories(libraryCatalog) : getCatalogCategories()
  const catalogGroups = libraryCatalog ? listConfiguredGroups(libraryCatalog, pickCategory) : getCatalogGroups(pickCategory)
  const catalogFoods = libraryCatalog
    ? listConfiguredFoods(libraryCatalog, pickCategory, pickGroup)
    : getCatalogFoods(pickCategory, pickGroup).map((f) => ({ name: f.name }))

  const resetPicker = () => {
    setPickCategory('')
    setPickGroup('')
    setPickFood('')
  }

  const handlePickCategory = (id: string) => {
    setPickCategory(id)
    setPickGroup('')
    setPickFood('')
  }

  const handlePickGroup = (id: string) => {
    setPickGroup(id)
    setPickFood('')
  }

  const handlePickFood = (name: string) => {
    setPickFood(name)
    const match = libraryCatalog
      ? resolveConfiguredFood(libraryCatalog, pickCategory, pickGroup, name)
      : resolveLibraryFood(pickCategory, pickGroup, name)
    if (match) {
      setValue('name', match.name)
      setValue('category', match.category || '')
      setValue('servingSize', String(match.servingSize))
      setValue('servingUnit', match.servingUnit as any)
      setValue('altServingSize', match.altServingSize !== undefined ? String(match.altServingSize) : '')
      setValue('altServingUnit', match.altServingUnit as any)
      setValue('preparationState', match.preparationState as any)
      setValue('dietType', match.dietType as any)
      setValue('calories', String(match.calories))
      setValue('protein', String(match.protein))
      setValue('carbs', String(match.carbs))
      setValue('fat', String(match.fat))
      setValue('fiber', match.fiber !== undefined ? String(match.fiber) : '')
    }
  }

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        category: '',
        servingSize: '100',
        servingUnit: 'g',
        altServingSize: '',
        altServingUnit: undefined,
        preparationState: undefined,
        dietType: undefined,
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
      })
      setCategory('')
      setDietType('')
      setServingUnit('g')
      setAltServingUnit('')
      setPreparationState('')
      resetPicker()
    }
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        name: values.name,
        category: values.category,
        servingSize: Number(values.servingSize),
        servingUnit: values.servingUnit,
        altServingSize: values.altServingSize ? Number(values.altServingSize) : undefined,
        altServingUnit: values.altServingUnit,
        preparationState: values.preparationState,
        dietType: values.dietType,
        calories: Number(values.calories),
        protein: Number(values.protein),
        carbs: Number(values.carbs),
        fat: Number(values.fat),
        fiber: values.fiber ? Number(values.fiber) : undefined,
      },
      {
        onSuccess: (created) => {
          onCreated?.(created.id)
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Food</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3 rounded-md border border-dashed border-input p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {libraryCatalog ? "Browse Your Gym's Food Library (optional)" : 'Browse Food Library (optional)'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={pickCategory || undefined} onValueChange={handlePickCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {catalogCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Group</Label>
                <Select value={pickGroup || undefined} onValueChange={handlePickGroup} disabled={!pickCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={pickCategory ? 'Select group' : 'Select category first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogGroups.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">No groups available</p>
                    ) : (
                      catalogGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Food</Label>
              <Select value={pickFood || undefined} onValueChange={handlePickFood} disabled={!pickGroup}>
                <SelectTrigger>
                  <SelectValue placeholder={!pickGroup ? 'Select group first' : 'Select food'} />
                </SelectTrigger>
                <SelectContent>
                  {catalogFoods.length === 0 ? (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">No foods found for this group</p>
                  ) : (
                    catalogFoods.map((f) => (
                      <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Food Name</Label>
            <Input placeholder="Paneer" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category || undefined} onValueChange={(v) => { setCategory(v); setValue('category', v) }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {FOOD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Diet Type</Label>
              <Select value={dietType || undefined} onValueChange={(v) => { setDietType(v); setValue('dietType', v as any) }}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {DIET_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Serving Size</Label>
              <Input type="number" placeholder="100" {...register('servingSize')} />
              {errors.servingSize && <p className="text-xs text-red-600">{errors.servingSize.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Serving Unit</Label>
              <Select value={servingUnit} onValueChange={(v) => { setServingUnit(v); setValue('servingUnit', v as any) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVING_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.servingUnit && <p className="text-xs text-red-600">{errors.servingUnit.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Alt Serving Size (optional)</Label>
              <Input type="number" placeholder="e.g. 1 piece ≈ 40g" {...register('altServingSize')} />
            </div>
            <div className="space-y-1.5">
              <Label>Alt Serving Unit (optional)</Label>
              <Select value={altServingUnit || undefined} onValueChange={(v) => { setAltServingUnit(v); setValue('altServingUnit', v as any) }}>
                <SelectTrigger><SelectValue placeholder="e.g. piece" /></SelectTrigger>
                <SelectContent>
                  {SERVING_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Preparation State</Label>
            <Select value={preparationState || undefined} onValueChange={(v) => { setPreparationState(v); setValue('preparationState', v as any) }}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {PREPARATION_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Calories</Label>
              <Input type="number" {...register('calories')} />
              {errors.calories && <p className="text-xs text-red-600">{errors.calories.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Protein (g)</Label>
              <Input type="number" {...register('protein')} />
              {errors.protein && <p className="text-xs text-red-600">{errors.protein.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Carbs (g)</Label>
              <Input type="number" {...register('carbs')} />
              {errors.carbs && <p className="text-xs text-red-600">{errors.carbs.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fat (g)</Label>
              <Input type="number" {...register('fat')} />
              {errors.fat && <p className="text-xs text-red-600">{errors.fat.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Fiber (g)</Label>
              <Input type="number" placeholder="Optional" {...register('fiber')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Adding...' : 'Add Food'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
