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
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ManagedUser } from '@/api/user-management.api'
import type { AILang, InsightContext } from './aiInsightsShared'
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

const priorityAccent: Record<Priority, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-blue-400',
}

const priorityIconWrap: Record<Priority, string> = {
  high: 'bg-red-50 text-red-600 ring-1 ring-red-100',
  medium: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  low: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
}

/** All copy for both languages lives here — mock content, not machine translated at runtime. */
const STRINGS: Record<AILang, {
  summaryTitle: string
  highPriority: string
  medium: string
  low: string
  priorityLabel: Record<Priority, string>
  whyLabel: string
  recLabel: string
  toastTitle: (label: string) => string
  toastDesc: string
  noVisits: string
  inactiveDays: (d: number) => string
  activeHistory: string
  hasTrainer: string
  noTrainer: string
  hasDiet: string
  noDiet: string
  opportunityNew: string
  opportunityChurn: string
  opportunityDeepen: string
  summaryLead: (name: string, parts: string) => string
  neverCheckedIn: (name: string) => string
  neverCheckedInWhy: string
  neverCheckedInRec: string
  sendWelcome: string
  logCheckIn: string
  inactiveTitle: (name: string, d: number) => string
  inactiveWhy: string
  inactiveRec: string
  inactiveMetric: (d: number) => string
  scheduleFollowUp: string
  noTrainerTitle: (name: string) => string
  noTrainerWhy: string
  noTrainerRec: string
  noTrainerMetric: string
  assignTrainer: string
  noDietTitle: (name: string) => string
  noDietWhy: string
  noDietRec: string
  createDietPlan: string
  membershipTitle: (status: string) => string
  membershipWhy: (name: string) => string
  membershipRec: string
  reviewMembership: string
  healthFlagTitle: string
  healthFlagWhy: (name: string, flag: string) => string
  healthFlagRec: string
  logNote: string
  streakTitle: (name: string, streak: number) => string
  streakWhy: string
  streakRec: string
  streakMetric: (streak: number) => string
  sendUpgradeOffer: string
  retentionTitle: string
  retentionWhy: string
  retentionRec: (name: string) => string
}> = {
  en: {
    summaryTitle: 'AI Member Summary',
    highPriority: 'High Priority',
    medium: 'Medium',
    low: 'Low',
    priorityLabel: { high: 'High Priority', medium: 'Medium', low: 'Low' },
    whyLabel: 'Why this matters',
    recLabel: 'Recommended action',
    toastTitle: (label) => `${label} (mock)`,
    toastDesc: 'This action is not wired up yet.',
    noVisits: 'no recorded visits',
    inactiveDays: (d) => `no check-ins for ${d} days`,
    activeHistory: 'an active check-in history',
    hasTrainer: 'an assigned trainer',
    noTrainer: 'no assigned trainer',
    hasDiet: 'an active diet plan',
    noDiet: 'no diet plan',
    opportunityNew: 'The primary opportunity is to establish engagement during the first few days.',
    opportunityChurn: 'The primary opportunity is to re-engage this member before they churn.',
    opportunityDeepen: 'The primary opportunity is to deepen engagement through trainer and nutrition support.',
    summaryLead: (name, parts) => `${name} is a member with ${parts}.`,
    neverCheckedIn: (name) => `${name} has not checked in since joining`,
    neverCheckedInWhy: 'New members who do not establish a regular attendance pattern in the first days are significantly more likely to disengage.',
    neverCheckedInRec: 'Contact the member and encourage their first visit.',
    sendWelcome: 'Send Welcome Message',
    logCheckIn: 'Log Check-in',
    inactiveTitle: (name, d) => `${name} hasn't checked in for ${d} days`,
    inactiveWhy: 'Members inactive for 2+ weeks are significantly more likely to not renew their membership.',
    inactiveRec: 'Reach out with a personal follow-up before the re-engagement window closes.',
    inactiveMetric: (d) => `${d} days inactive`,
    scheduleFollowUp: 'Schedule Follow-up',
    noTrainerTitle: (name) => `${name} has no trainer assigned`,
    noTrainerWhy: 'Unassigned members show a 35% higher drop-off rate in the first 60 days.',
    noTrainerRec: 'Pair with a trainer this week to build accountability and a personalized plan.',
    noTrainerMetric: '35% higher drop-off risk',
    assignTrainer: 'Assign Trainer',
    noDietTitle: (name) => `${name} has no diet plan created`,
    noDietWhy: 'Nutrition guidance is one of the strongest retention levers and adds a regular touchpoint with the member.',
    noDietRec: 'Create a diet plan to increase engagement and improve renewal likelihood.',
    createDietPlan: 'Create Diet Plan',
    membershipTitle: (status) => `Membership status: ${status}`,
    membershipWhy: (name) => `${name}'s membership isn't currently active, which puts continued training and diet commitments at risk.`,
    membershipRec: 'Confirm renewal status and offer a membership renewal opportunity.',
    reviewMembership: 'Review Membership',
    healthFlagTitle: 'Health flag on file',
    healthFlagWhy: (name, flag) => `${name} has noted an injury or limitation ("${flag}"). Programming that ignores this increases re-injury and drop-off risk.`,
    healthFlagRec: 'Confirm the assigned trainer has reviewed this before further programming.',
    logNote: 'Log Note',
    streakTitle: (name, streak) => `${name} is on a ${streak}-day check-in streak`,
    streakWhy: 'Highly engaged members convert well on upgrades and add-on packages.',
    streakRec: 'Offer a personal training package or plan upgrade while engagement is high.',
    streakMetric: (streak) => `${streak}-day streak`,
    sendUpgradeOffer: 'Send Upgrade Offer',
    retentionTitle: 'Retention watch',
    retentionWhy: 'Periodic check-ins catch satisfaction or renewal issues before they become churn.',
    retentionRec: (name) => `Flag ${name} for a follow-up in 30 days to review satisfaction and renewal likelihood.`,
  },
  hi: {
    summaryTitle: 'एआई सदस्य सारांश',
    highPriority: 'अत्यावश्यक',
    medium: 'मध्यम',
    low: 'कम',
    priorityLabel: { high: 'अत्यावश्यक', medium: 'मध्यम', low: 'कम' },
    whyLabel: 'यह क्यों महत्वपूर्ण है',
    recLabel: 'अनुशंसित कार्रवाई',
    toastTitle: (label) => `${label} (मॉक)`,
    toastDesc: 'यह कार्रवाई अभी लागू नहीं की गई है।',
    noVisits: 'अभी तक कोई विज़िट दर्ज नहीं',
    inactiveDays: (d) => `${d} दिनों से कोई चेक-इन नहीं`,
    activeHistory: 'सक्रिय चेक-इन इतिहास',
    hasTrainer: 'ट्रेनर नियुक्त है',
    noTrainer: 'कोई ट्रेनर नियुक्त नहीं है',
    hasDiet: 'सक्रिय डाइट प्लान',
    noDiet: 'कोई डाइट प्लान नहीं है',
    opportunityNew: 'मुख्य अवसर है — पहले कुछ दिनों में ही सदस्य को जोड़ना।',
    opportunityChurn: 'मुख्य अवसर है — सदस्य के छोड़ने से पहले उसे फिर से सक्रिय करना।',
    opportunityDeepen: 'मुख्य अवसर है — ट्रेनर और न्यूट्रिशन सहायता से जुड़ाव को और गहरा करना।',
    summaryLead: (name, parts) => `${name} एक सदस्य हैं जिनके पास ${parts} है।`,
    neverCheckedIn: (name) => `${name} ने जुड़ने के बाद से एक भी चेक-इन नहीं किया`,
    neverCheckedInWhy: 'जो नए सदस्य पहले कुछ दिनों में नियमित उपस्थिति नहीं बनाते, उनके निष्क्रिय होने की संभावना काफी अधिक होती है।',
    neverCheckedInRec: 'सदस्य से संपर्क करें और उन्हें पहली विज़िट के लिए प्रोत्साहित करें।',
    sendWelcome: 'स्वागत संदेश भेजें',
    logCheckIn: 'चेक-इन दर्ज करें',
    inactiveTitle: (name, d) => `${name} ने ${d} दिनों से चेक-इन नहीं किया है`,
    inactiveWhy: '2+ सप्ताह से निष्क्रिय सदस्यों के सदस्यता नवीनीकृत न कराने की संभावना काफी अधिक होती है।',
    inactiveRec: 'पुनः जुड़ाव की अवधि समाप्त होने से पहले व्यक्तिगत रूप से संपर्क करें।',
    inactiveMetric: (d) => `${d} दिन निष्क्रिय`,
    scheduleFollowUp: 'फॉलो-अप शेड्यूल करें',
    noTrainerTitle: (name) => `${name} के लिए कोई ट्रेनर नियुक्त नहीं है`,
    noTrainerWhy: 'बिना ट्रेनर वाले सदस्यों में पहले 60 दिनों में 35% अधिक ड्रॉप-ऑफ दर देखी जाती है।',
    noTrainerRec: 'जवाबदेही और व्यक्तिगत योजना बनाने के लिए इस सप्ताह एक ट्रेनर नियुक्त करें।',
    noTrainerMetric: '35% अधिक ड्रॉप-ऑफ जोखिम',
    assignTrainer: 'ट्रेनर नियुक्त करें',
    noDietTitle: (name) => `${name} के लिए कोई डाइट प्लान नहीं बनाया गया`,
    noDietWhy: 'न्यूट्रिशन मार्गदर्शन सबसे मजबूत रिटेंशन उपायों में से एक है और सदस्य से नियमित संपर्क बनाए रखता है।',
    noDietRec: 'जुड़ाव बढ़ाने और नवीनीकरण की संभावना सुधारने के लिए एक डाइट प्लान बनाएं।',
    createDietPlan: 'डाइट प्लान बनाएं',
    membershipTitle: (status) => `सदस्यता स्थिति: ${status}`,
    membershipWhy: (name) => `${name} की सदस्यता वर्तमान में सक्रिय नहीं है, जिससे उनकी ट्रेनिंग और डाइट प्रतिबद्धताएं जोखिम में हैं।`,
    membershipRec: 'नवीनीकरण की स्थिति की पुष्टि करें और सदस्यता नवीनीकरण का अवसर दें।',
    reviewMembership: 'सदस्यता की समीक्षा करें',
    healthFlagTitle: 'स्वास्थ्य संबंधी जानकारी दर्ज है',
    healthFlagWhy: (name, flag) => `${name} ने एक चोट या सीमा दर्ज की है ("${flag}")। इसे नज़रअंदाज़ करने वाला प्रोग्रामिंग दोबारा चोट लगने और ड्रॉप-ऑफ का जोखिम बढ़ाता है।`,
    healthFlagRec: 'आगे की प्रोग्रामिंग से पहले पुष्टि करें कि नियुक्त ट्रेनर ने इसकी समीक्षा कर ली है।',
    logNote: 'नोट दर्ज करें',
    streakTitle: (name, streak) => `${name} की ${streak}-दिन की चेक-इन स्ट्रीक चल रही है`,
    streakWhy: 'अत्यधिक सक्रिय सदस्य अपग्रेड और ऐड-ऑन पैकेज पर अच्छी प्रतिक्रिया देते हैं।',
    streakRec: 'जुड़ाव अधिक होने के दौरान पर्सनल ट्रेनिंग पैकेज या प्लान अपग्रेड ऑफर करें।',
    streakMetric: (streak) => `${streak}-दिन की स्ट्रीक`,
    sendUpgradeOffer: 'अपग्रेड ऑफर भेजें',
    retentionTitle: 'रिटेंशन पर नज़र',
    retentionWhy: 'समय-समय पर चेक-इन से संतुष्टि या नवीनीकरण से जुड़ी समस्याएं चर्न बनने से पहले ही पकड़ में आ जाती हैं।',
    retentionRec: (name) => `संतुष्टि और नवीनीकरण की संभावना की समीक्षा के लिए ${name} को 30 दिनों में फॉलो-अप हेतु फ्लैग करें।`,
  },
}

function buildAdminSummary(name: string, ctx: InsightContext, s: (typeof STRINGS)['en']): string {
  const inactiveDays = daysSince(ctx.lastCheckInAt)
  const parts: string[] = []

  if (inactiveDays === null) parts.push(s.noVisits)
  else if (inactiveDays >= 14) parts.push(s.inactiveDays(inactiveDays))
  else parts.push(s.activeHistory)

  parts.push(ctx.hasTrainer ? s.hasTrainer : s.noTrainer)
  parts.push(ctx.dietCount === 0 ? s.noDiet : s.hasDiet)

  const joinedRecently = inactiveDays === null
  const opportunity = joinedRecently
    ? s.opportunityNew
    : inactiveDays !== null && inactiveDays >= 14
      ? s.opportunityChurn
      : s.opportunityDeepen

  return `${s.summaryLead(name, parts.join(', '))} ${opportunity}`
}

function buildAdminInsights(user: ManagedUser, ctx: InsightContext, s: (typeof STRINGS)['en']): AdminInsight[] {
  const name = user.fullName ?? user.firstName ?? 'This member'
  const insights: AdminInsight[] = []
  const inactiveDays = daysSince(ctx.lastCheckInAt)

  if (inactiveDays === null) {
    insights.push({
      icon: MessageCircleWarning,
      priority: 'high',
      insight: s.neverCheckedIn(name),
      why: s.neverCheckedInWhy,
      recommendation: s.neverCheckedInRec,
      actions: [
        { label: s.sendWelcome, icon: Send },
        { label: s.logCheckIn, icon: CalendarClock },
      ],
    })
  } else if (inactiveDays >= 14) {
    insights.push({
      icon: MessageCircleWarning,
      priority: 'high',
      insight: s.inactiveTitle(name, inactiveDays),
      why: s.inactiveWhy,
      recommendation: s.inactiveRec,
      metric: s.inactiveMetric(inactiveDays),
      actions: [{ label: s.scheduleFollowUp, icon: CalendarClock }],
    })
  }

  if (!ctx.hasTrainer) {
    insights.push({
      icon: UserCog,
      priority: 'high',
      insight: s.noTrainerTitle(name),
      why: s.noTrainerWhy,
      recommendation: s.noTrainerRec,
      metric: s.noTrainerMetric,
      actions: [{ label: s.assignTrainer, icon: UserCog }],
    })
  }

  if (ctx.dietCount === 0) {
    insights.push({
      icon: Salad,
      priority: 'medium',
      insight: s.noDietTitle(name),
      why: s.noDietWhy,
      recommendation: s.noDietRec,
      actions: [{ label: s.createDietPlan, icon: Salad }],
    })
  }

  if (ctx.membershipStatus && ctx.membershipStatus !== 'Active') {
    insights.push({
      icon: CreditCard,
      priority: 'medium',
      insight: s.membershipTitle(ctx.membershipStatus),
      why: s.membershipWhy(name),
      recommendation: s.membershipRec,
      actions: [{ label: s.reviewMembership, icon: CreditCard }],
    })
  }

  if (ctx.injuries || ctx.physicalLimitations) {
    insights.push({
      icon: ShieldAlert,
      priority: 'medium',
      insight: s.healthFlagTitle,
      why: s.healthFlagWhy(name, ctx.injuries || ctx.physicalLimitations || ''),
      recommendation: s.healthFlagRec,
      actions: [{ label: s.logNote, icon: ClipboardCheck }],
    })
  }

  if (ctx.checkInStreak && ctx.checkInStreak >= 5) {
    insights.push({
      icon: TrendingUp,
      priority: 'low',
      insight: s.streakTitle(name, ctx.checkInStreak),
      why: s.streakWhy,
      recommendation: s.streakRec,
      metric: s.streakMetric(ctx.checkInStreak),
      actions: [{ label: s.sendUpgradeOffer, icon: Gift }],
    })
  }

  insights.push({
    icon: BarChart3,
    priority: 'low',
    insight: s.retentionTitle,
    why: s.retentionWhy,
    recommendation: s.retentionRec(name),
    actions: [{ label: s.scheduleFollowUp, icon: CalendarClock }],
  })

  return insights
}

interface AdminAIInsightsProps {
  user: ManagedUser
  ctx: InsightContext
  lang: AILang
}

export function AdminAIInsights({ user, ctx, lang }: AdminAIInsightsProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const s = STRINGS[lang]
  const name = user.fullName ?? user.firstName ?? 'This member'
  const insights = buildAdminInsights(user, ctx, s)
  const counts = {
    high: insights.filter((i) => i.priority === 'high').length,
    medium: insights.filter((i) => i.priority === 'medium').length,
    low: insights.filter((i) => i.priority === 'low').length,
  }

  const handleAction = (label: string) => {
    // Mock only — no backend call yet.
    setCompletedActions((prev) => new Set(prev).add(label))
    toast({ title: s.toastTitle(label), description: s.toastDesc })
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-violet-50/40 p-5 shadow-sm">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-200/30 blur-2xl" />
        <div className="relative flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">{s.summaryTitle}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{buildAdminSummary(name, ctx, s)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {counts.high > 0 && <Badge className="border-none bg-red-100 text-red-700 hover:bg-red-100">{counts.high} {s.highPriority}</Badge>}
              {counts.medium > 0 && <Badge className="border-none bg-amber-100 text-amber-700 hover:bg-amber-100">{counts.medium} {s.medium}</Badge>}
              {counts.low > 0 && <Badge className="border-none bg-blue-100 text-blue-700 hover:bg-blue-100">{counts.low} {s.low}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((item) => (
          <div
            key={item.insight}
            className={cn(
              'rounded-2xl border border-slate-200 border-l-4 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-md',
              priorityAccent[item.priority]
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', priorityIconWrap[item.priority])}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('shrink-0 border-none px-2 py-0.5 text-[10px] font-semibold', priorityBadge[item.priority])}>
                    {s.priorityLabel[item.priority]}
                  </Badge>
                  {item.metric && (
                    <Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {item.metric}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{item.insight}</p>

                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.whyLabel}</p>
                <p className="text-sm leading-relaxed text-slate-600">{item.why}</p>

                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.recLabel}</p>
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

