import { useState } from 'react'
import { Sparkles, Zap, AlertTriangle, ShieldCheck, HeartHandshake, Languages } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ManagedUser } from '@/api/user-management.api'
import type { InsightContext } from './aiInsightsShared'
import { AI_LANGUAGES, AI_PANEL_STRINGS, daysSince, fontClassForLang, type AILang } from './aiInsightsShared'
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
  const [lang, setLang] = useState<AILang>('en')
  const highPriorityCount = countHighPriority(ctx)
  const t = AI_PANEL_STRINGS[lang]
  const fontClass = fontClassForLang(lang)

  return (
    <Card className={cn('overflow-hidden border-white/60 bg-white/75 shadow-xl backdrop-blur-md', fontClass)}>
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-blue-600" />
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{t.title}</h2>
                <Badge className="gap-1 border-none bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100">
                  <Zap className="h-3 w-3" /> {t.aiPowered}
                </Badge>
              </div>
              <p className="mt-1 max-w-md text-sm text-slate-500">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            {view === 'admin' && highPriorityCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">{t.urgent(highPriorityCount)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <Languages className="ml-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              {AI_LANGUAGES.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setLang(option.code)}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                    option.fontClass,
                    lang === option.code
                      ? 'bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  )}
                >
                  {option.nativeLabel}
                </button>
              ))}
            </div>
          </div>
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
            {t.adminTab}
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
            {t.memberTab}
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-400">
          {view === 'admin' ? t.adminFootnote : t.memberFootnote}
        </p>

        {view === 'admin' ? <AdminAIInsights user={user} ctx={ctx} lang={lang} /> : <MemberAIRecommendations user={user} ctx={ctx} lang={lang} />}
      </CardContent>
    </Card>
  )
}

