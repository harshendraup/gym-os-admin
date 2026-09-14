import { Check, Pencil, Trash2, Users2, Snowflake, Dumbbell, Ticket, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MembershipRecord, MembershipStatus } from '@/api/memberships.api'

// Free-text colorTag → a restrained accent, not a loud background — the
// card stays neutral and the color shows up only as a top stripe + price.
const ACCENTS: Record<string, { stripe: string; text: string; ring: string }> = {
  gold: { stripe: 'from-amber-400 to-yellow-500', text: 'text-amber-600', ring: 'ring-amber-200' },
  silver: { stripe: 'from-slate-300 to-slate-400', text: 'text-slate-500', ring: 'ring-slate-200' },
  platinum: { stripe: 'from-indigo-400 to-violet-500', text: 'text-violet-600', ring: 'ring-violet-200' },
  blue: { stripe: 'from-sky-400 to-blue-500', text: 'text-blue-600', ring: 'ring-blue-200' },
  green: { stripe: 'from-emerald-400 to-green-500', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  purple: { stripe: 'from-purple-400 to-fuchsia-500', text: 'text-purple-600', ring: 'ring-purple-200' },
  red: { stripe: 'from-rose-400 to-red-500', text: 'text-rose-600', ring: 'ring-rose-200' },
  orange: { stripe: 'from-orange-400 to-amber-500', text: 'text-orange-600', ring: 'ring-orange-200' },
}
const DEFAULT_ACCENT = { stripe: 'from-primary to-violet-500', text: 'text-primary', ring: 'ring-primary/20' }

function accentFor(colorTag: string | null, title: string, membershipName: string) {
  const explicitTag = colorTag?.trim().toLowerCase()
  if (explicitTag && ACCENTS[explicitTag]) return ACCENTS[explicitTag]

  const planName = `${title} ${membershipName}`.toLowerCase()
  const namedTheme = Object.keys(ACCENTS).find((theme) => planName.includes(theme))
  return namedTheme ? ACCENTS[namedTheme] : DEFAULT_ACCENT
}

const STATUS_DOT: Record<MembershipStatus, string> = {
  active: 'bg-emerald-500',
  draft: 'bg-slate-400',
  inactive: 'bg-amber-500',
  archived: 'bg-rose-500',
}

interface MembershipPlanCardProps {
  membership: MembershipRecord
  branchLabel: string
  onEdit?: (m: MembershipRecord) => void
  onDelete?: (m: MembershipRecord) => void
  deleting?: boolean
}

export function MembershipPlanCard({ membership: m, branchLabel, onEdit, onDelete, deleting }: MembershipPlanCardProps) {
  const accent = accentFor(m.colorTag, m.title, m.membershipName)
  const discounted = m.finalAmount && m.finalAmount !== m.amount
  const period = m.isLifetime ? 'lifetime' : `${m.durationValue} ${m.durationUnit}`

  const perks: { icon: typeof Users2; label: string }[] = []
  if (m.groupClasses) perks.push({ icon: Users2, label: 'Group classes' })
  if (m.dietPlan) perks.push({ icon: Ticket, label: 'Diet plan' })
  if (m.lockerAccess) perks.push({ icon: MapPin, label: 'Locker access' })
  if (m.workoutAccess) perks.push({ icon: Dumbbell, label: 'Workout access' })
  if (m.personalTrainingSessions) perks.push({ icon: Dumbbell, label: `${m.personalTrainingSessions} PT sessions` })
  if (m.guestPasses) perks.push({ icon: Ticket, label: `${m.guestPasses} guest passes` })
  if (m.maxFreezeDays) perks.push({ icon: Snowflake, label: `${m.maxFreezeDays} freeze days` })

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
        m.isFeatured && `ring-2 ${accent.ring}`
      )}
    >
      <div className={cn('h-1.5 w-full bg-gradient-to-r', accent.stripe)} />

      {m.badgeLabel && (
        <span className="absolute right-4 top-4 rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          {m.badgeLabel}
        </span>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <MapPin className="h-3 w-3" /> {branchLabel}
        </div>
        <h3 className="text-lg font-bold leading-tight text-slate-900">{m.title}</h3>
        {m.subTitle && <p className="mt-0.5 text-sm text-slate-500">{m.subTitle}</p>}

        <div className="mt-4">
          {discounted && (
            <span className="block text-sm text-slate-400 line-through">{m.currency} {m.amount}</span>
          )}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={cn('text-3xl font-extrabold tracking-tight', accent.text)}>
              {m.currency} {discounted ? m.finalAmount : m.amount}
            </span>
            <span className="text-sm font-medium text-slate-400">/ {period}</span>
          </div>
        </div>
        {m.taxPercentage && <p className="mt-0.5 text-xs text-slate-400">+ {m.taxPercentage}% tax</p>}

        {m.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{m.description}</p>}

        {perks.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
            {perks.map((perk) => (
              <li key={perk.label} className="flex items-center gap-2 text-sm text-slate-700">
                <Check className={cn('h-3.5 w-3.5 shrink-0', accent.text)} />
                {perk.label}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[m.status])} />
            <span className="capitalize">{m.status}</span>
            {m.isTrial && <span className="text-slate-300">·</span>}
            {m.isTrial && <span>Trial plan</span>}
          </div>

          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(m)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="destructive" onClick={() => onDelete(m)} disabled={deleting}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
