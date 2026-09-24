import { useState } from 'react'
import {
  Dumbbell,
  Salad,
  UserCog,
  CalendarClock,
  TrendingDown,
  PartyPopper,
  ShieldAlert,
  Check,
  Play,
  LineChart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { ManagedUser } from '@/api/user-management.api'
import type { InsightContext } from './aiInsightsShared'
import { daysSince } from './aiInsightsShared'

interface ActionItem {
  label: string
  icon: typeof Dumbbell
}

interface MemberRecommendation {
  icon: typeof Dumbbell
  title: string
  detail: string
  action?: ActionItem
}

function buildMemberRecommendations(user: ManagedUser, ctx: InsightContext): MemberRecommendation[] {
  const name = user.firstName ?? 'there'
  const recs: MemberRecommendation[] = []
  const inactiveDays = daysSince(ctx.lastCheckInAt)

  if (ctx.injuries || ctx.physicalLimitations) {
    recs.push({
      icon: ShieldAlert,
      title: 'Your workout is adjusted for you',
      detail: `We've noted "${ctx.injuries || ctx.physicalLimitations}" on file — your trainer will keep exercises within a safe range while you build back up.`,
    })
  }

  if (inactiveDays === null) {
    recs.push({
      icon: CalendarClock,
      title: 'Start your fitness journey with your first check-in',
      detail: "You haven't logged your first visit yet. Start with a simple workout and build your weekly routine.",
      action: { label: 'Start Workout', icon: Play },
    })
  } else if (inactiveDays >= 14) {
    recs.push({
      icon: CalendarClock,
      title: "We've missed you",
      detail: `It's been ${inactiveDays} days since your last visit. A short 20-minute session can help you get back into rhythm — no pressure.`,
      action: { label: 'Plan a Visit', icon: CalendarClock },
    })
  } else if ((ctx.checkInStreak ?? 0) >= 3) {
    recs.push({
      icon: PartyPopper,
      title: `${ctx.checkInStreak}-day streak — keep it going`,
      detail: `Nice consistency, ${name}. Members who cross a 2-week streak are far more likely to hit their goals.`,
      action: { label: 'Track Progress', icon: LineChart },
    })
  }

  if (!ctx.hasTrainer) {
    recs.push({
      icon: UserCog,
      title: 'Book a session with a trainer',
      detail: 'A trainer can build a plan around your goals and keep you accountable — ask the front desk to get paired.',
      action: { label: 'Book Trainer Session', icon: UserCog },
    })
  }

  if (ctx.dietCount === 0) {
    recs.push({
      icon: Salad,
      title: 'Start your personalized diet plan',
      detail: ctx.nutritionGoal
        ? `Based on your ${ctx.nutritionGoal.toLowerCase()} goal, a structured meal plan will get you results faster.`
        : 'A simple starter meal plan pairs well with your training and is easy to follow.',
      action: { label: 'View Diet Tips', icon: Salad },
    })
  }

  if (ctx.weightTrendKg && ctx.nutritionGoal) {
    const wantsLoss = ctx.nutritionGoal.toLowerCase().includes('loss')
    const movingWrongWay = wantsLoss ? ctx.weightTrendKg > 0 : ctx.weightTrendKg < 0
    if (movingWrongWay) {
      recs.push({
        icon: TrendingDown,
        title: 'Track your progress',
        detail: `Your last two measurements moved ${ctx.weightTrendKg > 0 ? 'up' : 'down'} ${Math.abs(ctx.weightTrendKg)} kg, which is the opposite of your ${ctx.nutritionGoal.toLowerCase()} goal. Worth a quick review with your trainer.`,
        action: { label: 'Track Progress', icon: LineChart },
      })
    }
  }

  recs.push({
    icon: Dumbbell,
    title: 'Try a beginner strength routine',
    detail: '3-day full-body split recommended based on typical onboarding patterns for new members.',
    action: { label: 'View Routine', icon: Dumbbell },
  })

  return recs
}

interface MemberAIRecommendationsProps {
  user: ManagedUser
  ctx: InsightContext
}

export function MemberAIRecommendations({ user, ctx }: MemberAIRecommendationsProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const recommendations = buildMemberRecommendations(user, ctx)
  const name = user.firstName ?? 'there'

  const handleAction = (label: string) => {
    // Mock only — no backend call yet.
    setCompletedActions((prev) => new Set(prev).add(label))
    toast({ title: `${label} (mock)`, description: 'This action is not wired up yet.' })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Your AI Recommendation</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
          Hi {name} — here's what will help you the most right now, based on your recent activity.
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const done = rec.action ? completedActions.has(rec.action.label) : false
          return (
            <div key={rec.title} className="rounded-xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  <rec.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{rec.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{rec.detail}</p>
                  {rec.action && (
                    <Button
                      size="sm"
                      variant={done ? 'secondary' : 'default'}
                      className="mt-3"
                      onClick={() => handleAction(rec.action!.label)}
                      disabled={done}
                    >
                      {done ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <rec.action.icon className="mr-1.5 h-3.5 w-3.5" />}
                      {done ? `${rec.action.label} ✓` : rec.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
