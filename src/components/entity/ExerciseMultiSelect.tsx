import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useExercises } from '@/hooks/useExercises'

interface ExerciseMultiSelectProps {
  selected: string[]
  onChange: (names: string[]) => void
  placeholder?: string
}

/**
 * Search-then-pick multi-select over the business's real exercise library
 * (same `useExercises()` list Training Programs already uses) — same
 * search-then-pick interaction as FoodPicker.tsx, toggling chips instead of
 * add-with-quantity. Stores plain exercise names, matching the field's
 * existing string[] shape (no new backend concept).
 */
export function ExerciseMultiSelect({ selected, onChange, placeholder }: ExerciseMultiSelectProps) {
  const { data: exercises = [] } = useExercises()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises
    return pool.filter((e) => !selected.includes(e.name)).slice(0, 8)
  }, [exercises, query, selected])

  const add = (name: string) => {
    onChange([...selected, name])
    setQuery('')
  }
  const remove = (name: string) => onChange(selected.filter((n) => n !== name))

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2">
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <span key={name} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {name}
              <button type="button" onClick={() => remove(name)} className="text-primary/70 hover:text-primary">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          className="h-8 bg-white pl-8 text-xs"
          placeholder={placeholder ?? 'Search exercises...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {query && (
        <div className="mt-1.5 max-h-36 space-y-0.5 overflow-y-auto rounded-lg bg-white p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-slate-400">No matches in your exercise library.</p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => add(e.name)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">{e.name}</span>
                <span className="text-slate-400">{e.category}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
