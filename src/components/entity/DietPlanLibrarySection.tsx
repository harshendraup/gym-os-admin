import { useState } from 'react'
import { ChevronDown, Plus, Salad, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DietPlanTemplateCard } from './DietPlanTemplateCard'
import type { DietPlanRecord } from '@/api/diet-plans.api'

interface DietPlanLibrarySectionProps {
  data: DietPlanRecord[] | undefined
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  onCreate: () => void
  onOpenPlan: (plan: DietPlanRecord) => void
  onDuplicatePlan?: (plan: DietPlanRecord) => void
  onArchivePlan?: (plan: DietPlanRecord) => void
  defaultOpen?: boolean
}

/**
 * A collapsible panel holding the full diet plan library — collapsed by
 * default so the page opens on "Assigned Diet Plans" (what's actually
 * happening day to day), with the reusable templates one click away.
 * Plain useState expand/collapse — this codebase has no Collapsible/
 * Accordion primitive yet, and one isn't worth adding for a single use.
 */
export function DietPlanLibrarySection({
  data,
  isLoading,
  isError,
  onRetry,
  onCreate,
  onOpenPlan,
  onDuplicatePlan,
  onArchivePlan,
  defaultOpen = false,
}: DietPlanLibrarySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const count = data?.length ?? 0

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Salad className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Diet Plan Library <span className="font-medium text-slate-400">· {count} plan{count === 1 ? '' : 's'}</span>
            </h2>
            <p className="text-xs text-slate-500">Reusable nutrition templates — create as many as you need, assign them anytime.</p>
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 px-5 py-5">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={onCreate}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Plan
              </Button>
            </div>

            {isError ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/60 py-12">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">Couldn't load the diet plan library.</p>
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
                  </Button>
                )}
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                ))}
              </div>
            ) : count === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
                <p className="text-sm text-slate-500">No diet plans yet — create your first reusable template.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data!.map((plan) => (
                  <DietPlanTemplateCard
                    key={plan.id}
                    plan={plan}
                    onOpen={onOpenPlan}
                    onDuplicate={onDuplicatePlan}
                    onArchive={onArchivePlan}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
