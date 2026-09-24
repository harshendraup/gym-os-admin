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
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { ManagedUser } from '@/api/user-management.api'
import type { AILang, InsightContext } from './aiInsightsShared'
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

/** All copy for both languages lives here — mock content, not machine translated at runtime. */
const STRINGS: Record<AILang, {
  heroLabel: string
  heroLead: (name: string) => string
  toastTitle: (label: string) => string
  toastDesc: string
  injuryTitle: string
  injuryDetail: (flag: string) => string
  firstCheckInTitle: string
  firstCheckInDetail: string
  startWorkout: string
  missedYouTitle: string
  missedYouDetail: (d: number) => string
  planVisit: string
  streakTitle: (streak: number) => string
  streakDetail: (name: string) => string
  trackProgress: string
  bookTrainerTitle: string
  bookTrainerDetail: string
  bookTrainerAction: string
  dietTitle: string
  dietDetailGoal: (goal: string) => string
  dietDetailGeneric: string
  viewDietTips: string
  progressTitle: string
  progressDetail: (direction: string, amount: number, goal: string) => string
  routineTitle: string
  routineDetail: string
  viewRoutine: string
}> = {
  en: {
    heroLabel: 'Your AI Recommendation',
    heroLead: (name) => `Hi ${name} — here's what will help you the most right now, based on your recent activity.`,
    toastTitle: (label) => `${label} (mock)`,
    toastDesc: 'This action is not wired up yet.',
    injuryTitle: 'Your workout is adjusted for you',
    injuryDetail: (flag) => `We've noted "${flag}" on file — your trainer will keep exercises within a safe range while you build back up.`,
    firstCheckInTitle: 'Start your fitness journey with your first check-in',
    firstCheckInDetail: "You haven't logged your first visit yet. Start with a simple workout and build your weekly routine.",
    startWorkout: 'Start Workout',
    missedYouTitle: "We've missed you",
    missedYouDetail: (d) => `It's been ${d} days since your last visit. A short 20-minute session can help you get back into rhythm — no pressure.`,
    planVisit: 'Plan a Visit',
    streakTitle: (streak) => `${streak}-day streak — keep it going`,
    streakDetail: (name) => `Nice consistency, ${name}. Members who cross a 2-week streak are far more likely to hit their goals.`,
    trackProgress: 'Track Progress',
    bookTrainerTitle: 'Book a session with a trainer',
    bookTrainerDetail: 'A trainer can build a plan around your goals and keep you accountable — ask the front desk to get paired.',
    bookTrainerAction: 'Book Trainer Session',
    dietTitle: 'Start your personalized diet plan',
    dietDetailGoal: (goal) => `Based on your ${goal.toLowerCase()} goal, a structured meal plan will get you results faster.`,
    dietDetailGeneric: 'A simple starter meal plan pairs well with your training and is easy to follow.',
    viewDietTips: 'View Diet Tips',
    progressTitle: 'Track your progress',
    progressDetail: (direction, amount, goal) => `Your last two measurements moved ${direction} ${amount} kg, which is the opposite of your ${goal.toLowerCase()} goal. Worth a quick review with your trainer.`,
    routineTitle: 'Try a beginner strength routine',
    routineDetail: '3-day full-body split recommended based on typical onboarding patterns for new members.',
    viewRoutine: 'View Routine',
  },
  hi: {
    heroLabel: 'आपका एआई सुझाव',
    heroLead: (name) => `नमस्ते ${name} — आपकी हाल की गतिविधि के आधार पर, अभी आपके लिए यह सबसे उपयोगी रहेगा।`,
    toastTitle: (label) => `${label} (मॉक)`,
    toastDesc: 'यह कार्रवाई अभी लागू नहीं की गई है।',
    injuryTitle: 'आपकी वर्कआउट को आपके अनुसार समायोजित किया गया है',
    injuryDetail: (flag) => `हमने आपकी फ़ाइल में "${flag}" दर्ज किया है — आपके ठीक होने तक ट्रेनर व्यायाम को सुरक्षित सीमा में रखेंगे।`,
    firstCheckInTitle: 'अपनी पहली चेक-इन के साथ फिटनेस यात्रा शुरू करें',
    firstCheckInDetail: 'आपने अभी तक अपनी पहली विज़िट दर्ज नहीं की है। एक सरल वर्कआउट से शुरुआत करें और अपनी साप्ताहिक दिनचर्या बनाएं।',
    startWorkout: 'वर्कआउट शुरू करें',
    missedYouTitle: 'हमें आपकी कमी महसूस हुई',
    missedYouDetail: (d) => `आपकी पिछली विज़िट को ${d} दिन हो चुके हैं। एक छोटा 20-मिनट का सेशन आपको फिर से लय में ला सकता है — कोई दबाव नहीं।`,
    planVisit: 'विज़िट की योजना बनाएं',
    streakTitle: (streak) => `${streak}-दिन की स्ट्रीक — इसे जारी रखें`,
    streakDetail: (name) => `बढ़िया निरंतरता है, ${name}। जो सदस्य 2-सप्ताह की स्ट्रीक पार कर लेते हैं, उनके लक्ष्य हासिल करने की संभावना कहीं अधिक होती है।`,
    trackProgress: 'प्रगति ट्रैक करें',
    bookTrainerTitle: 'ट्रेनर के साथ सेशन बुक करें',
    bookTrainerDetail: 'ट्रेनर आपके लक्ष्यों के अनुसार योजना बना सकता है और आपको जवाबदेह बनाए रख सकता है — जुड़ने के लिए फ्रंट डेस्क से पूछें।',
    bookTrainerAction: 'ट्रेनर सेशन बुक करें',
    dietTitle: 'अपना व्यक्तिगत डाइट प्लान शुरू करें',
    dietDetailGoal: (goal) => `आपके ${goal.toLowerCase()} लक्ष्य के आधार पर, एक संरचित मील प्लान आपको तेज़ी से परिणाम दिलाएगा।`,
    dietDetailGeneric: 'एक सरल स्टार्टर मील प्लान आपकी ट्रेनिंग के साथ अच्छी तरह मेल खाता है और अनुसरण करना आसान है।',
    viewDietTips: 'डाइट टिप्स देखें',
    progressTitle: 'अपनी प्रगति ट्रैक करें',
    progressDetail: (direction, amount, goal) => `आपके पिछले दो माप ${direction} ${amount} किग्रा बदले हैं, जो आपके ${goal.toLowerCase()} लक्ष्य के विपरीत है। अपने ट्रेनर के साथ इसकी समीक्षा करना उचित रहेगा।`,
    routineTitle: 'एक बिगिनर स्ट्रेंथ रूटीन आज़माएं',
    routineDetail: 'नए सदस्यों के लिए सामान्य ऑनबोर्डिंग पैटर्न के आधार पर 3-दिन का फुल-बॉडी स्प्लिट अनुशंसित है।',
    viewRoutine: 'रूटीन देखें',
  },
}

function buildMemberRecommendations(user: ManagedUser, ctx: InsightContext, s: (typeof STRINGS)['en']): MemberRecommendation[] {
  const name = user.firstName ?? 'there'
  const recs: MemberRecommendation[] = []
  const inactiveDays = daysSince(ctx.lastCheckInAt)

  if (ctx.injuries || ctx.physicalLimitations) {
    recs.push({
      icon: ShieldAlert,
      title: s.injuryTitle,
      detail: s.injuryDetail(ctx.injuries || ctx.physicalLimitations || ''),
    })
  }

  if (inactiveDays === null) {
    recs.push({
      icon: CalendarClock,
      title: s.firstCheckInTitle,
      detail: s.firstCheckInDetail,
      action: { label: s.startWorkout, icon: Play },
    })
  } else if (inactiveDays >= 14) {
    recs.push({
      icon: CalendarClock,
      title: s.missedYouTitle,
      detail: s.missedYouDetail(inactiveDays),
      action: { label: s.planVisit, icon: CalendarClock },
    })
  } else if ((ctx.checkInStreak ?? 0) >= 3) {
    recs.push({
      icon: PartyPopper,
      title: s.streakTitle(ctx.checkInStreak!),
      detail: s.streakDetail(name),
      action: { label: s.trackProgress, icon: LineChart },
    })
  }

  if (!ctx.hasTrainer) {
    recs.push({
      icon: UserCog,
      title: s.bookTrainerTitle,
      detail: s.bookTrainerDetail,
      action: { label: s.bookTrainerAction, icon: UserCog },
    })
  }

  if (ctx.dietCount === 0) {
    recs.push({
      icon: Salad,
      title: s.dietTitle,
      detail: ctx.nutritionGoal ? s.dietDetailGoal(ctx.nutritionGoal) : s.dietDetailGeneric,
      action: { label: s.viewDietTips, icon: Salad },
    })
  }

  if (ctx.weightTrendKg && ctx.nutritionGoal) {
    const wantsLoss = ctx.nutritionGoal.toLowerCase().includes('loss')
    const movingWrongWay = wantsLoss ? ctx.weightTrendKg > 0 : ctx.weightTrendKg < 0
    if (movingWrongWay) {
      recs.push({
        icon: TrendingDown,
        title: s.progressTitle,
        detail: s.progressDetail(ctx.weightTrendKg > 0 ? 'up' : 'down', Math.abs(ctx.weightTrendKg), ctx.nutritionGoal),
        action: { label: s.trackProgress, icon: LineChart },
      })
    }
  }

  recs.push({
    icon: Dumbbell,
    title: s.routineTitle,
    detail: s.routineDetail,
    action: { label: s.viewRoutine, icon: Dumbbell },
  })

  return recs
}

interface MemberAIRecommendationsProps {
  user: ManagedUser
  ctx: InsightContext
  lang: AILang
}

export function MemberAIRecommendations({ user, ctx, lang }: MemberAIRecommendationsProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const s = STRINGS[lang]
  const recommendations = buildMemberRecommendations(user, ctx, s)
  const name = user.firstName ?? 'there'

  const handleAction = (label: string) => {
    // Mock only — no backend call yet.
    setCompletedActions((prev) => new Set(prev).add(label))
    toast({ title: s.toastTitle(label), description: s.toastDesc })
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-blue-50/40 p-5 shadow-sm">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-200/40 blur-2xl" />
        <div className="relative flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">{s.heroLabel}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{s.heroLead(name)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const done = rec.action ? completedActions.has(rec.action.label) : false
          return (
            <div key={rec.title} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-100">
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

