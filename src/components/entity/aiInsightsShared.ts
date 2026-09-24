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
