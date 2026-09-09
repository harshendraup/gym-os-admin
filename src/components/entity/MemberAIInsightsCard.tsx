import { useState } from 'react'
import {
  Sparkles,
  Send,
  Check,
  Dumbbell,
  Salad,
  UserCog,
  MessageCircleWarning,
  TrendingDown,
  TrendingUp,
  CalendarClock,
  Gift,
  ClipboardCheck,
  ShieldAlert,
  PartyPopper,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ManagedUser } from '@/api/user-management.api'

type Priority = 'high' | 'medium' | 'low'

interface Suggestion {
  icon: typeof Sparkles
  title: string
  detail: string
  priority: Priority
}

interface ActionItem {
  label: string
  icon: typeof Sparkles
}

const priorityStyles: Record<Priority, string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-blue-500/15 text-blue-400',
}

interface InsightContext {
  dietCount: number
  hasTrainer: boolean
  lastCheckInAt?: string | null
  checkInStreak?: number
  monthlyVisits?: number
  bmi?: string | null
  weightTrendKg?: number | null
  injuries?: string | null
  physicalLimitations?: string | null
  nutritionGoal?: string | null
  membershipStatus?: string | null
}

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function buildMemberSuggestions(user: ManagedUser, ctx: InsightContext): Suggestion[] {
  const name = user.firstName ?? 'there'
  const suggestions: Suggestion[] = []
  const inactiveDays = daysSince(ctx.lastCheckInAt)

  if (ctx.injuries || ctx.physicalLimitations) {
    suggestions.push({
      icon: ShieldAlert,
      title: 'Workout adjusted for your condition',
      detail: `We've noted "${ctx.injuries || ctx.physicalLimitations}" on file — your trainer will keep exercises within safe range while you build back up.`,
      priority: 'high',
    })
  }

  if (inactiveDays === null) {
    suggestions.push({
      icon: CalendarClock,
      title: 'Log your first check-in',
      detail: `Welcome, ${name}! Scan in at the front desk on your next visit to start tracking your streak.`,
      priority: 'high',
    })
  } else if (inactiveDays >= 14) {
    suggestions.push({
      icon: MessageCircleWarning,
      title: "We've missed you",
      detail: `It's been ${inactiveDays} days since your last visit. A short 20-minute session can help you get back into rhythm — no pressure.`,
      priority: 'high',
    })
  } else if ((ctx.checkInStreak ?? 0) >= 3) {
    suggestions.push({
      icon: PartyPopper,
      title: `${ctx.checkInStreak}-day streak — keep it going`,
      detail: `Nice consistency, ${name}. Members who cross a 2-week streak are far more likely to hit their goals.`,
      priority: 'low',
    })
  }

  if (!ctx.hasTrainer) {
    suggestions.push({
      icon: UserCog,
      title: 'Get matched with a trainer',
      detail: 'A trainer can build a plan around your goals and keep you accountable — ask the front desk to get paired.',
      priority: 'medium',
    })
  }

  if (ctx.dietCount === 0) {
    suggestions.push({
      icon: Salad,
      title: 'Start a diet plan',
      detail: ctx.nutritionGoal
        ? `Based on your ${ctx.nutritionGoal.toLowerCase()} goal, a structured meal plan will get you results faster.`
        : 'A simple starter meal plan pairs well with your training and is easy to follow.',
      priority: 'medium',
    })
  }

  if (ctx.weightTrendKg && ctx.nutritionGoal) {
    const wantsLoss = ctx.nutritionGoal.toLowerCase().includes('loss')
    const movingWrongWay = wantsLoss ? ctx.weightTrendKg > 0 : ctx.weightTrendKg < 0
    if (movingWrongWay) {
      suggestions.push({
        icon: TrendingDown,
        title: 'Progress check-in recommended',
        detail: `Your last two measurements moved ${ctx.weightTrendKg > 0 ? 'up' : 'down'} ${Math.abs(ctx.weightTrendKg)} kg, which is the opposite of your ${ctx.nutritionGoal.toLowerCase()} goal. Worth a quick review with your trainer.`,
        priority: 'medium',
      })
    }
  }

  suggestions.push({
    icon: Dumbbell,
    title: 'Try a beginner strength routine',
    detail: '3-day full-body split recommended based on typical onboarding patterns for new members.',
    priority: 'low',
  })

  return suggestions
}

function buildAdminSuggestions(user: ManagedUser, ctx: InsightContext): { suggestions: Suggestion[]; actions: ActionItem[] } {
  const name = user.fullName ?? user.firstName ?? 'this member'
  const suggestions: Suggestion[] = []
  const actions: ActionItem[] = []
  const inactiveDays = daysSince(ctx.lastCheckInAt)

  if (ctx.injuries || ctx.physicalLimitations) {
    suggestions.push({
      icon: ShieldAlert,
      title: 'Health flag on file',
      detail: `${name} has noted an injury or limitation ("${ctx.injuries || ctx.physicalLimitations}"). Make sure the assigned trainer has reviewed this before programming.`,
      priority: 'high',
    })
  }

  if (inactiveDays !== null && inactiveDays >= 14) {
    suggestions.push({
      icon: MessageCircleWarning,
      title: 'Churn risk — inactive member',
      detail: `${name} hasn't checked in for ${inactiveDays} days. Members inactive 2+ weeks are significantly more likely to not renew.`,
      priority: 'high',
    })
    actions.push({ label: 'Schedule Follow-up', icon: CalendarClock })
  } else if (inactiveDays === null) {
    suggestions.push({
      icon: MessageCircleWarning,
      title: 'No check-ins recorded yet',
      detail: `${name} joined but hasn't logged a single visit. Recommend a welcome call to drive first check-in.`,
      priority: 'high',
    })
  }

  if (!ctx.hasTrainer) {
    suggestions.push({
      icon: UserCog,
      title: 'Unassigned member risk',
      detail: `${name} has no trainer assigned. Unassigned members show a 35% higher drop-off rate in the first 60 days.`,
      priority: 'high',
    })
    actions.push({ label: 'Assign Trainer', icon: UserCog })
  }

  if (ctx.dietCount === 0) {
    suggestions.push({
      icon: Salad,
      title: 'No diet plan created',
      detail: 'Create a diet plan to increase touchpoints with this member and improve retention likelihood.',
      priority: 'medium',
    })
    actions.push({ label: 'Create Diet Plan', icon: Salad })
  }

  if (ctx.checkInStreak && ctx.checkInStreak >= 5) {
    suggestions.push({
      icon: TrendingUp,
      title: 'High engagement — upsell opportunity',
      detail: `${name} is on a ${ctx.checkInStreak}-day streak. Good candidate for a PT package or plan upgrade offer.`,
      priority: 'low',
    })
    actions.push({ label: 'Send Upgrade Offer', icon: Gift })
  }

  if (ctx.membershipStatus && ctx.membershipStatus !== 'Active') {
    suggestions.push({
      icon: ShieldAlert,
      title: `Membership status: ${ctx.membershipStatus}`,
      detail: `${name}'s membership isn't active. Confirm renewal status before further training or diet commitments.`,
      priority: 'medium',
    })
  }

  suggestions.push({
    icon: MessageCircleWarning,
    title: 'Retention watch',
    detail: 'Flag this member for a follow-up in 30 days to review satisfaction and renewal likelihood.',
    priority: 'low',
  })

  actions.push({ label: 'Log Note', icon: ClipboardCheck })

  return { suggestions, actions }
}

interface MemberAIInsightsCardProps {
  user: ManagedUser
  dietCount?: number
  hasTrainer?: boolean
  lastCheckInAt?: string | null
  checkInStreak?: number
  monthlyVisits?: number
  bmi?: string | null
  weightTrendKg?: number | null
  injuries?: string | null
  physicalLimitations?: string | null
  nutritionGoal?: string | null
  membershipStatus?: string | null
}

export function MemberAIInsightsCard({
  user,
  dietCount = 0,
  hasTrainer = false,
  lastCheckInAt,
  checkInStreak,
  monthlyVisits,
  bmi,
  weightTrendKg,
  injuries,
  physicalLimitations,
  nutritionGoal,
  membershipStatus,
}: MemberAIInsightsCardProps) {
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState<Date | null>(null)
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())

  const ctx: InsightContext = {
    dietCount, hasTrainer, lastCheckInAt, checkInStreak, monthlyVisits,
    bmi, weightTrendKg, injuries, physicalLimitations, nutritionGoal, membershipStatus,
  }
  const memberSuggestions = buildMemberSuggestions(user, ctx)
  const { suggestions: adminSuggestions, actions: adminActions } = buildAdminSuggestions(user, ctx)
  const highPriorityCount = adminSuggestions.filter((s) => s.priority === 'high').length
  const name = user.fullName ?? user.firstName ?? 'member'

  const handleSendToMember = () => {
    setSending(true)
    // Mock only — wire up to a real notification/email endpoint later.
    setTimeout(() => {
      setSending(false)
      setSentAt(new Date())
      toast({ title: 'Sent to member (mock)', description: `Recommendations shared with ${name}.` })
    }, 500)
  }

  const handleAdminAction = (label: string) => {
    // Mock only — no backend call yet.
    setCompletedActions((prev) => new Set(prev).add(label))
    toast({ title: `${label} (mock)`, description: 'This action is not wired up yet.' })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Insights</h3>
              <p className="text-[11px] text-slate-500">Mock recommendations — not yet backed by a real model</p>
            </div>
          </div>
          {highPriorityCount > 0 && (
            <Badge variant="destructive" className="shrink-0 whitespace-nowrap">
              {highPriorityCount} urgent
            </Badge>
          )}
        </div>

        <Tabs defaultValue="member">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="member">For Member</TabsTrigger>
            <TabsTrigger value="admin">For Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="member" className="space-y-3">
            <SuggestionList suggestions={memberSuggestions} />
            <Button size="sm" className="w-full" onClick={handleSendToMember} disabled={sending}>
              {sentAt ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              {sending ? 'Sending…' : sentAt ? `Sent ${sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Send again` : 'Send to Member'}
            </Button>
          </TabsContent>

          <TabsContent value="admin" className="space-y-3">
            <SuggestionList suggestions={adminSuggestions} />
            <div className="flex flex-wrap gap-2 pt-1">
              {adminActions.map((action) => {
                const done = completedActions.has(action.label)
                return (
                  <Button
                    key={action.label}
                    size="sm"
                    variant={done ? 'secondary' : 'outline'}
                    onClick={() => handleAdminAction(action.label)}
                    disabled={done}
                  >
                    {done ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <action.icon className="mr-1.5 h-3.5 w-3.5" />}
                    {done ? `${action.label} ✓` : action.label}
                  </Button>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div className="space-y-2.5">
      {suggestions.map((s) => (
        <div key={s.title} className="flex items-start gap-2.5 rounded-lg border border-slate-100 p-2.5">
          <s.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-900">{s.title}</p>
              <Badge variant="outline" className={cn('shrink-0 border-none px-1.5 py-0 text-[10px] capitalize', priorityStyles[s.priority])}>
                {s.priority}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
