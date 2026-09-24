export interface InsightContext {
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

export function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/** Supported AI Insights display languages — mock copy only, not machine translated at runtime. */
export type AILang = 'en' | 'hi'

export interface LanguageOption {
  code: AILang
  label: string
  nativeLabel: string
  fontClass: string
}

export const AI_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', fontClass: 'font-sans' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', fontClass: 'font-hindi' },
]

export function fontClassForLang(lang: AILang): string {
  return AI_LANGUAGES.find((l) => l.code === lang)?.fontClass ?? 'font-sans'
}

/** Static chrome strings shared across the Admin/Member AI panels. */
export const AI_PANEL_STRINGS: Record<AILang, {
  title: string
  aiPowered: string
  subtitle: string
  urgent: (n: number) => string
  adminTab: string
  memberTab: string
  adminFootnote: string
  memberFootnote: string
}> = {
  en: {
    title: 'AI Insights',
    aiPowered: 'AI Powered',
    subtitle: 'AI-powered recommendations to improve member engagement and retention',
    urgent: (n) => `${n} urgent`,
    adminTab: 'Admin Insights',
    memberTab: 'Member Recommendations',
    adminFootnote: 'Actionable business & retention recommendations — mock only, not yet backed by a real model.',
    memberFootnote: 'Personalized recommendations shown to the member — mock only, not yet backed by a real model.',
  },
  hi: {
    title: 'एआई इनसाइट्स',
    aiPowered: 'एआई संचालित',
    subtitle: 'सदस्य जुड़ाव और रिटेंशन बढ़ाने के लिए एआई-आधारित सुझाव',
    urgent: (n) => `${n} अत्यावश्यक`,
    adminTab: 'एडमिन इनसाइट्स',
    memberTab: 'सदस्य सुझाव',
    adminFootnote: 'कार्रवाई योग्य बिज़नेस व रिटेंशन सुझाव — केवल मॉक डेटा, अभी वास्तविक मॉडल पर आधारित नहीं है।',
    memberFootnote: 'सदस्य को दिखाए जाने वाले व्यक्तिगत सुझाव — केवल मॉक डेटा, अभी वास्तविक मॉडल पर आधारित नहीं है।',
  },
}

