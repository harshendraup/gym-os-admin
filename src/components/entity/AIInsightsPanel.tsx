import { useState } from 'react'
import { Sparkles, Zap, AlertTriangle, ShieldCheck, HeartHandshake } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ManagedUser } from '@/api/user-management.api'
import type { InsightContext } from './aiInsightsShared'
import { daysSince } from './aiInsightsShared'
import { AdminAIInsights } from './AdminAIInsights'
import { MemberAIRecommendations } from './MemberAIRecommendations'

type View = 'admin' | 'member'

interface AIInsightsPanelProps {
  user: ManagedUser
  ctx: InsightContext
}

function countHighPriority(ctx: InsightContext): number {
  const inactiveDays = daysSince(ctx.lastCheckInAt)
  let count = 0
  if (inactiveDays === null || inactiveDays >= 14) count += 1
  if (!ctx.hasTrainer) count += 1
  return count
}

/**
 * AI Insights is composed of two independent experiences — Admin Insights
 * (retention/business focused) and Member Recommendations (personal/fitness
 * focused) — rendered as separate components, not tabs swapping content in
 * one card. The nav below only decides which one mounts.
 */
export function AIInsightsPanel({ user, ctx }: AIInsightsPanelProps) {
  const [view, setView] = useState<View>('admin')
  const highPriorityCount = countHighPriority(ctx)

  return (
    <Card className="overflow-hidden border-white/60 bg-white/75 shadow-xl backdrop-blur-md">
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-blue-600" />
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">AI Insights</h2>
                <Badge className="gap-1 border-none bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100">
                  <Zap className="h-3 w-3" /> AI Powered
                </Badge>
              </div>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                AI-powered recommendations to improve member engagement and retention
              </p>
            </div>
          </div>
          {view === 'admin' && highPriorityCount > 0 && (
            <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 sm:self-auto">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">{highPriorityCount} urgent</span>
            </div>
          )}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setView('admin')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
              view === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <ShieldCheck className={cn('h-4 w-4', view === 'admin' ? 'text-violet-600' : 'text-slate-400')} />
            Admin Insights
          </button>
          <button
            type="button"
            onClick={() => setView('member')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
              view === 'member' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <HeartHandshake className={cn('h-4 w-4', view === 'member' ? 'text-violet-600' : 'text-slate-400')} />
            Member Recommendations
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-400">
          {view === 'admin'
            ? 'Actionable business & retention recommendations — mock only, not yet backed by a real model.'
            : 'Personalized recommendations shown to the member — mock only, not yet backed by a real model.'}
        </p>

        {view === 'admin' ? <AdminAIInsights user={user} ctx={ctx} /> : <MemberAIRecommendations user={user} ctx={ctx} />}
      </CardContent>
    </Card>
  )
}
