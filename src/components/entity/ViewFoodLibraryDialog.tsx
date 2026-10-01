import { useState } from 'react'
import { ChevronDown, ChevronRight, Apple } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { categoryIcon } from '@/data/foodLibraryIcons'
import type { FoodLibraryConfigRecord } from '@/api/food-library-config.api'

interface ViewFoodLibraryDialogProps {
  open: boolean
  onClose: () => void
  config: FoodLibraryConfigRecord | null | undefined
  onEdit: () => void
}

/** Read-only look at what's currently configured — the "see" counterpart to ConfigureFoodLibraryDialog's "update". */
export function ViewFoodLibraryDialog({ open, onClose, config, onEdit }: ViewFoodLibraryDialogProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const categories = config?.config.categories ?? []
  const totalGroups = categories.reduce((sum, c) => sum + c.groups.length, 0)
  const totalFoods = categories.reduce((sum, c) => sum + c.groups.reduce((s, g) => s + g.foods.length, 0), 0)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Food Library</DialogTitle>
        </DialogHeader>

        {categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing configured yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Badge variant="default">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</Badge>
              <Badge variant="default">{totalGroups} group{totalGroups === 1 ? '' : 's'}</Badge>
              <Badge variant="default">{totalFoods} food{totalFoods === 1 ? '' : 's'}</Badge>
            </div>

            <div className="space-y-2.5">
              {categories.map((cat) => {
                const catExpanded = expanded.has(cat.id)
                const Icon = categoryIcon(cat.id)
                return (
                  <div key={cat.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      onClick={() => toggle(cat.id)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-slate-900">{cat.name}</span>
                      {cat.source === 'custom' && <Badge variant="secondary">custom</Badge>}
                      <span className="text-xs text-slate-400">{cat.groups.length} group{cat.groups.length === 1 ? '' : 's'}</span>
                      {catExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </button>

                    {catExpanded && (
                      <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                        {cat.groups.map((group) => (
                          <div key={group.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">{group.name}</span>
                              {group.source === 'custom' && <Badge variant="secondary">custom</Badge>}
                            </div>
                            <div>
                              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <Apple className="h-3 w-3" /> Foods ({group.foods.length})
                              </p>
                              <ul className="space-y-0.5 text-xs text-slate-700">
                                {group.foods.map((f) => (
                                  <li key={f.name} className="flex justify-between">
                                    <span>{f.name}</span>
                                    <span className="text-slate-400">{f.calories} kcal / {f.servingSize}{f.servingUnit}</span>
                                  </li>
                                ))}
                              </ul>
                              {(group.foods.some((f) => f.altServingSize || f.preparationState || f.dietType)) && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
                                  <ul className="space-y-0.5 text-xs text-slate-600">
                                    {group.foods.filter((f) => f.altServingSize || f.preparationState || f.dietType).map((f) => (
                                      <li key={`${f.name}-details`} className="flex flex-wrap gap-x-2 gap-y-0.5">
                                        <span className="font-medium">{f.name}:</span>
                                        {f.altServingSize && <span>Alt: {f.altServingSize}{f.altServingUnit}</span>}
                                        {f.preparationState && <span>({f.preparationState})</span>}
                                        {f.dietType && <span>{f.dietType}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button type="button" onClick={onEdit}>Edit Setup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
