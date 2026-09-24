import { useState } from 'react'
import {
  Send,
  Check,
  Salad,
  UserCog,
  MessageCircleWarning,
  TrendingUp,
  CalendarClock,
  Gift,
  ClipboardCheck,
  ShieldAlert,
  CreditCard,
  BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ManagedUser } from '@/api/user-management.api'
import type { InsightContext } from './aiInsightsShared'
import { daysSince } from './aiInsightsShared'

type Priority = 'high' | 'medium' | 'low'

interface ActionItem {
  label: string
  icon: typeof Send
}

interface AdminInsight {
  icon: typeof Send
  priority: Priority
  insight: string
  why: string
  recommendation: string
  metric?: string
  actions: ActionItem[]
}

const priorityBadge: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
}

const priorityLabel: Record<Priority, string> = {
  high: 'High Priority',
  medium: 'Medium',
  low: 'Low',
}

const priorityAccent: Record<Priority, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-blue-400',
}

const priorityIconWrap: Record<Priority, string> = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-blue-50 text-blue-600',
}

function buildAdminSummary(name: string, ctx: InsightContext): string {
  const inactiveDays = daysSince(ctx.lastCheckInAt)
  const parts: string[] = []

  if (inactiveDays === null) parts.push('no recorded visits')
  else if (inactiveDays >= 14) parts.push(`no check-ins for ${inactiveDays} days`)
  else parts.push('an active check-in history')

  parts.push(ctx.hasTrainer ? 'an assigned trainer' : 'no assigned trainer')
  parts.push(ctx.dietCount === 0 ? 'no diet plan' : 'an active diet plan')

  const joinedRecently = inactiveDays === null
  const opportunity = joinedRecently
    ? 'The primary opportunity is to establish engagement during the first few days.'
    : inactiveDays !== null && inactiveDays >= 14
      ? 'The primary opportunity is to re-engage this member before they churn.'
      : 'The primary opportunity is to deepen engagement through trainer and nutrition support.'

  return `${name} is a member with ${parts.join(', ')}. ${opportunity}`
}

function buildAdminInsights(user: ManagedUser, ctx: InsightContext): AdminInsight[] {
  const name = user.fullName ?? user.firstName ?? 'This member'
  const insights: AdminInsight[] = []
  const inactiveDays = daysSince(ctx.lastCheckInAt)

  if (inactiveDays === null) {
    insights.push({
      icon: MessageCircleWarning,
      priority: 'high',
      insight: `${name} has not checked in since joining`,
      why: 'New members who do not establish a regular attendance pattern in the first days are significantly more likely to disengage.',
      recommendation: 'Contact the member and encourage their first visit.',
      actions: [
        { label: 'Send Welcome Message', icon: Send },
        { label: 'Log Check-in', icon: CalendarClock },
      ],
    })
  } else if (inactiveDays >= 14) {
    insights.push({
      icon: MessageCircleWarning,
      priority: 'high',
      insight: `${name} hasn't checked in for ${inactiveDays} days`,
      why: 'Members inactive for 2+ weeks are significantly more likely to not renew their membership.',
      recommendation: 'Reach out with a personal follow-up before the re-engagement window closes.',
      metric: `${inactiveDays} days inactive`,
      actions: [{ label: 'Schedule Follow-up', icon: CalendarClock }],
    })
  }

  if (!ctx.hasTrainer) {
    insights.push({
      icon: UserCog,
      priority: 'high',
      insight: `${name} has no trainer assigned`,
      why: 'Unassigned members show a 35% higher drop-off rate in the first 60 days.',
      recommendation: 'Pair with a trainer this week to build accountability and a personalized plan.',
      metric: '35% higher drop-off risk',
      actions: [{ label: 'Assign Trainer', icon: UserCog }],
    })
  }

  if (ctx.dietCount === 0) {
    insights.push({
      icon: Salad,
      priority: 'medium',
      insight: `${name} has no diet plan created`,
      why: 'Nutrition guidance is one of the strongest retention levers and adds a regular touchpoint with the member.',
      recommendation: 'Create a diet plan to increase engagement and improve renewal likelihood.',
      actions: [{ label: 'Create Diet Plan', icon: Salad }],
    })
  }

  if (ctx.membershipStatus && ctx.membershipStatus !== 'Active') {
    insights.push({
      icon: CreditCard,
      priority: 'medium',
      insight: `Membership status: ${ctx.membershipStatus}`,
      why: `${name}'s membership isn't currently active, which puts continued training and diet commitments at risk.`,
      recommendation: 'Confirm renewal status and offer a membership renewal opportunity.',
      actions: [{ label: 'Review Membership', icon: CreditCard }],
    })
  }

  if (ctx.injuries || ctx.physicalLimitations) {
    insights.push({
      icon: ShieldAlert,
      priority: 'medium',
      insight: 'Health flag on file',
      why: `${name} has noted an injury or limitation ("${ctx.injuries || ctx.physicalLimitations}"). Programming that ignores this increases re-injury and drop-off risk.`,
      recommendation: 'Confirm the assigned trainer has reviewed this before further programming.',
      actions: [{ label: 'Log Note', icon: ClipboardCheck }],
    })
  }

  if (ctx.checkInStreak && ctx.checkInStreak >= 5) {
    insights.push({
      icon: TrendingUp,
      priority: 'low',
      insight: `${name} is on a ${ctx.checkInStreak}-day check-in streak`,
      why: 'Highly engaged members convert well on upgrades and add-on packages.',
      recommendation: 'Offer a personal training package or plan upgrade while engagement is high.',
      metric: `${ctx.checkInStreak}-day streak`,
      actions: [{ label: 'Send Upgrade Offer', icon: Gift }],
    })
  }

  insights.push({
    icon: BarChart3,
    priority: 'low',
    insight: 'Retention watch',
    why: 'Periodic check-ins catch satisfaction or renewal issues before they become churn.',
    recommendation: `Flag ${name} for a follow-up in 30 days to review satisfaction and renewal likelihood.`,
    actions: [{ label: 'Schedule Follow-up', icon: CalendarClock }],
  })

  return insights
}

interface AdminAIInsightsProps {
  user: ManagedUser
  ctx: InsightContext
}

export function AdminAIInsights({ user, ctx }: AdminAIInsightsProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const name = user.fullName ?? user.firstName ?? 'This member'
  const insights = buildAdminInsights(user, ctx)
  const counts = {
    high: insights.filter((i) => i.priority === 'high').length,
    medium: insights.filter((i) => i.priority === 'medium').length,
    low: insights.filter((i) => i.priority === 'low').length,
  }

  const handleAction = (label: string) => {
    // Mock only — no backend call yet.
    setCompletedActions((prev) => new Set(prev).add(label))
    toast({ title: `${label} (mock)`, description: 'This action is not wired up yet.' })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Member Summary</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{buildAdminSummary(name, ctx)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.high > 0 && <Badge className="border-none bg-red-100 text-red-700 hover:bg-red-100">{counts.high} High Priority</Badge>}
          {counts.medium > 0 && <Badge className="border-none bg-amber-100 text-amber-700 hover:bg-amber-100">{counts.medium} Medium</Badge>}
          {counts.low > 0 && <Badge className="border-none bg-blue-100 text-blue-700 hover:bg-blue-100">{counts.low} Low</Badge>}
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((item) => (
          <div
            key={item.insight}
            className={cn('rounded-xl border border-slate-200 border-l-4 bg-white/70 p-4 backdrop-blur-sm', priorityAccent[item.priority])}
          >
            <div className="flex items-start gap-3">
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', priorityIconWrap[item.priority])}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('shrink-0 border-none px-2 py-0.5 text-[10px] font-semibold', priorityBadge[item.priority])}>
                    {priorityLabel[item.priority]}
                  </Badge>
                  {item.metric && (
                    <Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {item.metric}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{item.insight}</p>

                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Why this matters</p>
                <p className="text-sm leading-relaxed text-slate-600">{item.why}</p>

                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended action</p>
                <p className="text-sm leading-relaxed text-slate-600">{item.recommendation}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.actions.map((action, idx) => {
                    const done = completedActions.has(action.label)
                    return (
                      <Button
                        key={action.label}
                        size="sm"
                        variant={done ? 'secondary' : idx === 0 && item.priority === 'high' ? 'default' : 'outline'}
                        onClick={() => handleAction(action.label)}
                        disabled={done}
                      >
                        {done ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <action.icon className="mr-1.5 h-3.5 w-3.5" />}
                        {done ? `${action.label} ✓` : action.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
