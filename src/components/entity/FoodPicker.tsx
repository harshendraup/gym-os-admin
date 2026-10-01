import { useMemo, useState } from 'react'
import { Search, Plus, Globe2, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFoods } from '@/hooks/useFoods'
import type { FoodRecord } from '@/api/foods.api'
import type { MealItemInput } from '@/api/diet-plans.api'
import { SERVING_UNITS } from '@/components/constants'

interface FoodPickerProps {
  onAdd: (item: MealItemInput) => void
  /** Compact "add as alternative" mode — same picker, different button label. */
  asAlternative?: boolean
}

/**
 * Searchable food library picker used inside the diet plan builder to add
 * meal items/alternatives. Quantity defaults to the food's own serving size
 * and nutrition values scale proportionally — the trainer can still tweak
 * the quantity before adding, and can also add a food that isn't in the
 * library at all via the free-text fallback row.
 */
export function FoodPicker({ onAdd, asAlternative }: FoodPickerProps) {
  const { data: foods = [], isLoading } = useFoods()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FoodRecord | null>(null)
  const [quantity, setQuantity] = useState('')
  const [customName, setCustomName] = useState('')
  const [customUnit, setCustomUnit] = useState('g')
  const [customCalories, setCustomCalories] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customFat, setCustomFat] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return foods.slice(0, 8)
    const q = query.toLowerCase()
    return foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8)
  }, [foods, query])

  const scale = selected && quantity ? Number(quantity) / Number(selected.servingSize) : 1

  const addSelected = () => {
    if (!selected || !quantity) return
    onAdd({
      foodId: selected.id,
      foodName: selected.name,
      quantity: Number(quantity),
      unit: selected.servingUnit,
      calories: round1(Number(selected.calories) * scale),
      protein: round1(Number(selected.protein) * scale),
      carbs: round1(Number(selected.carbs) * scale),
      fat: round1(Number(selected.fat) * scale),
    })
    setSelected(null)
    setQuantity('')
    setQuery('')
  }

  const addCustom = () => {
    if (!customName || !customCalories) return
    onAdd({
      foodName: customName,
      quantity: Number(quantity || 1),
      unit: customUnit,
      calories: Number(customCalories || 0),
      protein: Number(customProtein || 0),
      carbs: Number(customCarbs || 0),
      fat: Number(customFat || 0),
    })
    setCustomName('')
    setCustomCalories('')
    setCustomProtein('')
    setCustomCarbs('')
    setCustomFat('')
    setQuantity('')
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          className="h-8 pl-8 text-sm"
          placeholder="Search food library..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
          }}
        />
      </div>

      {!selected && query && (
        <div className="mt-2 max-h-40 space-y-0.5 overflow-y-auto rounded-lg bg-white p-1">
          {isLoading && <p className="px-2 py-1.5 text-xs text-slate-400">Loading...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-slate-400">No matches — add a custom item below.</p>
          )}
          {filtered.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setSelected(f)
                setQuantity(f.servingSize)
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white"
            >
              <span className="flex items-center gap-1.5 truncate">
                {f.isGlobal ? (
                  <Globe2 className="h-3 w-3 shrink-0 text-slate-400" />
                ) : (
                  <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                )}
                <span className="truncate font-medium text-slate-800">{f.name}</span>
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {Number(f.calories)} kcal / {f.servingSize}{f.servingUnit}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-white px-2 py-1.5">
          <span className="flex-1 truncate text-sm font-medium text-slate-800">{selected.name}</span>
          <Input
            className="h-7 w-16 text-xs"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <span className="text-xs text-slate-400">{selected.servingUnit}</span>
          <span className="text-xs font-medium text-slate-500">
            {quantity ? round1(Number(selected.calories) * scale) : 0} kcal
          </span>
          <Button size="sm" className="h-7 px-2" onClick={addSelected} disabled={!quantity}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <details className="mt-2 group">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
          + Add a custom food not in the library
        </summary>
        <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
          <MiniField label="Food name" className="col-span-2">
            <Input className="h-7 text-xs" placeholder="e.g. Homemade sabzi" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </MiniField>
          <div className="grid grid-cols-2 gap-2">
            <MiniField label="Quantity">
              <Input className="h-7 text-xs" placeholder="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </MiniField>
            <MiniField label="Unit">
              <select
                className="h-7 text-xs rounded border border-slate-200 bg-white px-2 py-1"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
              >
                {SERVING_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </MiniField>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniField label="Calories">
              <Input className="h-7 text-xs" type="number" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} />
            </MiniField>
            <MiniField label="Protein (g)">
              <Input className="h-7 text-xs" type="number" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} />
            </MiniField>
            <MiniField label="Carbs (g)">
              <Input className="h-7 text-xs" type="number" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} />
            </MiniField>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniField label="Fat (g)">
              <Input className="h-7 text-xs" type="number" value={customFat} onChange={(e) => setCustomFat(e.target.value)} />
            </MiniField>
          </div>
          <Button size="sm" variant="outline" className={cn('h-7 w-full text-xs')} onClick={addCustom} disabled={!customName || !customCalories}>
            <Plus className="mr-1 h-3 w-3" /> Add {asAlternative ? 'alternative' : 'item'}
          </Button>
        </div>
      </details>
    </div>
  )
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

function MiniField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </div>
  )
}
