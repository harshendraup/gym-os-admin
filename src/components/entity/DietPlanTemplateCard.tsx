import { Flame, Beef, ChevronRight, Utensils, CalendarRange, Copy, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DietPlanRecord, DietPlanGoal } from '@/api/diet-plans.api'

const GOAL_ACCENT: Record<DietPlanGoal, { stripe: string; text: string; chipBg: string }> = {
  'Weight & Fat Loss': { stripe: 'from-emerald-400 to-green-500', text: 'text-emerald-600', chipBg: 'bg-emerald-50' },
  'Muscle Building': { stripe: 'from-sky-400 to-blue-500', text: 'text-blue-600', chipBg: 'bg-blue-50' },
  'Body Recomposition': { stripe: 'from-orange-400 to-amber-500', text: 'text-orange-600', chipBg: 'bg-orange-50' },
  'Weight Maintenance': { stripe: 'from-teal-400 to-cyan-500', text: 'text-teal-600', chipBg: 'bg-teal-50' },
  'General Health & Fitness': { stripe: 'from-primary to-violet-500', text: 'text-primary', chipBg: 'bg-primary/5' },
  'Sports Performance': { stripe: 'from-rose-400 to-pink-500', text: 'text-rose-600', chipBg: 'bg-rose-50' },
  'Healthy Aging': { stripe: 'from-indigo-400 to-purple-500', text: 'text-indigo-600', chipBg: 'bg-indigo-50' },
}

const STATUS_VARIANT = { Draft: 'secondary', Active: 'success', Archived: 'outline' } as const

interface DietPlanTemplateCardProps {
  plan: DietPlanRecord
  onOpen: (plan: DietPlanRecord) => void
  onDuplicate?: (plan: DietPlanRecord) => void
  onArchive?: (plan: DietPlanRecord) => void
}

/**
 * Compact, clickable card for the Diet Plan Library grid. Click opens
 * DietPlanDetailDialog for the full view; Duplicate/Archive are quick
 * actions that don't require opening the detail dialog first.
 */
export function DietPlanTemplateCard({ plan, onOpen, onDuplicate, onArchive }: DietPlanTemplateCardProps) {
  const accent = GOAL_ACCENT[plan.goal]
  const num = (value: string) => Number(value)
  const mealCount = plan.days.reduce((acc, d) => acc + d.meals.length, 0)

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
        plan.status === 'Archived' && 'opacity-60'
      )}
    >
      <button type="button" onClick={() => onOpen(plan)} className="flex flex-1 flex-col text-left">
        <div className={cn('h-1.5 w-full bg-gradient-to-r', accent.stripe)} />
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <span className={cn('inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide', accent.chipBg, accent.text)}>
              {plan.goal}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[plan.status]} className="text-[10px]">{plan.status}</Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </div>
          </div>

          <h3 className="mt-2 text-base font-bold leading-tight text-slate-900">
            {plan.name} {plan.version > 1 && <span className="text-xs font-medium text-slate-400">v{plan.version}</span>}
          </h3>
          {plan.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{plan.description}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
            {plan.caloriesTarget && (
              <span className="flex items-center gap-1"><Flame className={cn('h-3.5 w-3.5', accent.text)} /> {num(plan.caloriesTarget)} cal</span>
            )}
            {plan.proteinTarget && (
              <span className="flex items-center gap-1"><Beef className={cn('h-3.5 w-3.5', accent.text)} /> {num(plan.proteinTarget)}g</span>
            )}
            {mealCount > 0 && (
              <span className="flex items-center gap-1"><Utensils className={cn('h-3.5 w-3.5', accent.text)} /> {mealCount} meals</span>
            )}
            {plan.startDate && (
              <span className="flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5 text-slate-400" /> {plan.startDate.slice(0, 10)}{plan.endDate ? ` → ${plan.endDate.slice(0, 10)}` : ''}</span>
            )}
          </div>

          <span className="mt-2 text-[11px] text-slate-400">
            {plan.days.length === 0 ? 'Macro-only plan' : `${plan.days.length} day${plan.days.length === 1 ? '' : 's'} scheduled`} · {plan.planType}
          </span>
        </div>
      </button>

      {(onDuplicate || onArchive) && (
        <div className="flex gap-2 border-t border-slate-100 px-5 py-2.5">
          {onDuplicate && (
            <Button size="sm" variant="ghost" className="h-7 flex-1 text-xs" onClick={(e) => { e.stopPropagation(); onDuplicate(plan) }}>
              <Copy className="mr-1 h-3 w-3" /> Duplicate
            </Button>
          )}
          {onArchive && plan.status !== 'Archived' && (
            <Button size="sm" variant="ghost" className="h-7 flex-1 text-xs" onClick={(e) => { e.stopPropagation(); onArchive(plan) }}>
              <Archive className="mr-1 h-3 w-3" /> Archive
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
