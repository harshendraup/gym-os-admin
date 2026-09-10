import { Flame, Pencil, Trash2, UserPlus, Copy, GlassWater, Pill, Utensils } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DietPlanRecord, DietPlanGoal } from '@/api/diet-plans.api'

const GOAL_ACCENT: Record<DietPlanGoal, { gradient: string; text: string; chipBg: string }> = {
  'Weight Loss': { gradient: 'from-emerald-400 to-green-500', text: 'text-emerald-600', chipBg: 'bg-emerald-50' },
  'Muscle Gain': { gradient: 'from-sky-400 to-blue-500', text: 'text-blue-600', chipBg: 'bg-blue-50' },
  'Fat Loss': { gradient: 'from-orange-400 to-amber-500', text: 'text-orange-600', chipBg: 'bg-orange-50' },
  'Fitness': { gradient: 'from-primary to-violet-500', text: 'text-primary', chipBg: 'bg-primary/5' },
}

interface DietPlanDetailDialogProps {
  open: boolean
  onClose: () => void
  plan: DietPlanRecord | null
  onEdit: (plan: DietPlanRecord) => void
  onDelete: (plan: DietPlanRecord) => void
  onAssign: (plan: DietPlanRecord) => void
  onDuplicate?: (plan: DietPlanRecord) => void
  deleting?: boolean
}

/** The full view of one diet plan template: macro summary, full day/meal schedule (if built), supplements, hydration. */
export function DietPlanDetailDialog({
  open, onClose, plan, onEdit, onDelete, onAssign, onDuplicate, deleting,
}: DietPlanDetailDialogProps) {
  if (!plan) return null
  const accent = GOAL_ACCENT[plan.goal]

  const num = (value: string) => Number(value)
  const calories = plan.caloriesTarget ? num(plan.caloriesTarget) : null
  const protein = plan.proteinTarget ? num(plan.proteinTarget) : 0
  const carbs = plan.carbsTarget ? num(plan.carbsTarget) : 0
  const fat = plan.fatTarget ? num(plan.fatTarget) : 0

  const macroKcal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 }
  const totalMacroKcal = macroKcal.protein + macroKcal.carbs + macroKcal.fat
  const macroBar = totalMacroKcal > 0
    ? [
        { key: 'protein', label: 'Protein', grams: protein, pct: (macroKcal.protein / totalMacroKcal) * 100, dot: 'bg-rose-400' },
        { key: 'carbs', label: 'Carbs', grams: carbs, pct: (macroKcal.carbs / totalMacroKcal) * 100, dot: 'bg-amber-400' },
        { key: 'fat', label: 'Fat', grams: fat, pct: (macroKcal.fat / totalMacroKcal) * 100, dot: 'bg-sky-400' },
      ].filter((m) => m.grams > 0)
    : []

  const isMacroOnly = plan.days.length === 0

  const normalizeRepeatedDays = () => {
    if (!plan.days || plan.days.length <= 1) return plan.days

    const canonical = JSON.stringify({
      meals: plan.days[0].meals.map((meal) => ({
        mealType: meal.mealType,
        mealName: meal.mealName,
        mealTime: meal.mealTime,
        notes: meal.notes,
        items: meal.items.map((item) => ({
          foodName: item.foodName,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          notes: item.notes,
        })),
        alternatives: meal.alternatives.map((alt) => ({
          foodName: alt.foodName,
          quantity: alt.quantity,
          unit: alt.unit,
          calories: alt.calories,
          protein: alt.protein,
          carbs: alt.carbs,
          fat: alt.fat,
        })),
      })),
    })

    const allSame = plan.days.every((day) => {
      const current = JSON.stringify({
        meals: day.meals.map((meal) => ({
          mealType: meal.mealType,
          mealName: meal.mealName,
          mealTime: meal.mealTime,
          notes: meal.notes,
          items: meal.items.map((item) => ({
            foodName: item.foodName,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            notes: item.notes,
          })),
          alternatives: meal.alternatives.map((alt) => ({
            foodName: alt.foodName,
            quantity: alt.quantity,
            unit: alt.unit,
            calories: alt.calories,
            protein: alt.protein,
            carbs: alt.carbs,
            fat: alt.fat,
          })),
        })),
      })
      return current === canonical
    })

    return allSame ? [plan.days[0]] : plan.days
  }

  const displayDays = normalizeRepeatedDays()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">{plan.name}</DialogTitle>
        <div className={cn('shrink-0 bg-gradient-to-br px-6 pb-6 pt-7', accent.gradient)}>
          <div className="flex items-center gap-2">
            <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              {plan.goal}
            </span>
            <Badge variant="secondary" className="border-white/30 bg-white/20 text-white">{plan.status}</Badge>
            {plan.version > 1 && <span className="text-xs text-white/80">Version {plan.version}</span>}
          </div>
          <h2 className="mt-2.5 text-2xl font-extrabold leading-tight text-white">{plan.name}</h2>
          {plan.description && <p className="mt-1.5 text-sm text-white/85">{plan.description}</p>}
          {(plan.startDate || plan.endDate) && (
            <p className="mt-1 text-xs text-white/70">{plan.startDate?.slice(0, 10)} → {plan.endDate?.slice(0, 10) ?? 'ongoing'}</p>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isMacroOnly && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              This is a macro-only plan — no meal schedule has been built yet. Edit it to add days and meals.
            </div>
          )}

          {calories !== null && (
            <div className="flex items-baseline gap-1.5">
              <Flame className={cn('h-5 w-5', accent.text)} />
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">{calories}</span>
              <span className="text-sm font-medium text-slate-400">kcal / day target</span>
            </div>
          )}

          {macroBar.length > 0 && (
            <div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                {macroBar.map((m) => <div key={m.key} className={m.dot} style={{ width: `${m.pct}%` }} />)}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {macroBar.map((m) => (
                  <div key={m.key} className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className={cn('h-2 w-2 rounded-full', m.dot)} />
                    {m.label} <span className="font-semibold text-slate-900">{m.grams}g</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(plan.hydration || plan.waterTarget) && (
            <div className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">
              <GlassWater className="h-4 w-4" />
              Water target: <span className="font-semibold">
                {plan.hydration ? `${num(plan.hydration.targetMl)}ml / day` : `${num(plan.waterTarget!)}L / day`}
              </span>
            </div>
          )}

          {displayDays.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Utensils className="h-4 w-4 text-slate-400" /> Meal Schedule
              </h4>
              {displayDays.map((day) => (
                <div key={day.id} className="rounded-lg border border-slate-100">
                  <div className="bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    {displayDays.length === 1 && plan.days.length > 1 ? 'Every day' : (day.dayName || `Day ${day.dayNumber}`)}
                    {day.isRestDay && <span className="ml-1.5 text-slate-400">(Rest day)</span>}
                  </div>
                  <div className="divide-y divide-slate-50">
                    {day.meals.map((meal) => (
                      <div key={meal.id} className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">{meal.mealType}{meal.mealTime && <span className="ml-1.5 text-xs font-normal text-slate-400">{meal.mealTime}</span>}</span>
                          {meal.caloriesTarget && <span className="text-xs text-slate-400">{Math.round(Number(meal.caloriesTarget))} kcal</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {meal.items.map((i) => `${i.foodName} ${i.quantity}${i.unit}`).join(', ')}
                        </p>
                        {meal.alternatives.length > 0 && (
                          <p className="mt-0.5 text-xs text-violet-500">
                            OR {meal.alternatives.map((a) => `${a.foodName} ${a.quantity}${a.unit}`).join(' / ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {plan.supplements.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Pill className="h-4 w-4 text-slate-400" /> Supplements
              </h4>
              <div className="mt-1.5 space-y-1">
                {plan.supplements.map((s) => (
                  <p key={s.id} className="text-xs text-slate-600">
                    {s.name} — {s.quantity} {s.timing && `· ${s.timing}`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {calories === null && macroBar.length === 0 && !plan.waterTarget && plan.days.length === 0 && (
            <p className="text-sm text-slate-400">No nutrition targets set for this plan.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row">
          <Button className="flex-1" onClick={() => onAssign(plan)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Assign to Member
          </Button>
          <Button variant="outline" onClick={() => onEdit(plan)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          {onDuplicate && (
            <Button variant="outline" onClick={() => onDuplicate(plan)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
            </Button>
          )}
          <Button variant="destructive" onClick={() => onDelete(plan)} disabled={deleting}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
