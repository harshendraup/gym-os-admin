import {
  type AppReleaseSection,
  type ContentSection,
  type GymProfileSection,
  type PaymentSection,
  type QuickAccessTile,
  type ThemeSection,
} from '@/api/app-config.api'
import { DAY_LABELS } from '../constants'

/**
 * Client-side mirrors of the rules the API enforces.
 *
 * These exist so a broken value is caught next to the field instead of
 * coming back as a 422 toast after the round-trip — the server stays the
 * authority, this just stops the obviously-invalid save from leaving.
 */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const SEMVER = /^\d+\.\d+\.\d+$/
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export const isHex = (value: string | null | undefined) => HEX.test(value ?? '')

export function validateTheme(theme: ThemeSection): string[] {
  const tokens: Array<[keyof ThemeSection, string]> = [
    ['appBackground', 'App background'],
    ['primaryColor', 'Primary'],
    ['secondaryColor', 'Secondary'],
    ['darkTextColor', 'Body text'],
    ['disaleColor', 'Disabled'],
    ['gray', 'Gray'],
    ['gray_dark', 'Gray (dark)'],
  ]

  return tokens
    .filter(([key]) => !isHex(theme[key] as string))
    .map(([, label]) => `${label} must be a hex colour like #003941`)
}

export function validateGymProfile(profile: GymProfileSection): string[] {
  const errors: string[] = []

  profile.facilities?.forEach((facility, index) => {
    if (!facility.label?.trim()) errors.push(`Facility ${index + 1} needs a name`)
  })
  if ((profile.facilities?.length ?? 0) > 30) errors.push('At most 30 facilities')

  profile.operating_hours?.schedule?.forEach((day) => {
    if (day.is_closed) return
    day.slots?.forEach((slot) => {
      if (!HHMM.test(slot.open) || !HHMM.test(slot.close)) {
        errors.push(`${DAY_LABELS[day.day] ?? day.day}: opening hours must be times like 06:00`)
      } else if (slot.close <= slot.open) {
        errors.push(
          `${DAY_LABELS[day.day] ?? day.day}: closing time must be after the opening time`
        )
      }
    })
  })

  if (!profile.operating_hours?.timezone?.trim()) errors.push('Opening hours need a timezone')

  return errors
}

export function validateContent(content: ContentSection): string[] {
  const errors: string[] = []

  content.intro_slides?.forEach((slide, index) => {
    if (!slide.title?.trim()) errors.push(`Onboarding slide ${index + 1} needs a title`)
  })
  if ((content.intro_slides?.length ?? 0) > 10) errors.push('At most 10 onboarding slides')

  const email = content.support?.email
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Support email is not a valid address')
  }

  for (const [key, label] of [
    ['terms_url', 'Terms URL'],
    ['privacy_url', 'Privacy URL'],
    ['help_url', 'Help URL'],
  ] as const) {
    const value = content[key]
    if (value && !/^https?:\/\/.+/i.test(value)) errors.push(`${label} must start with http:// or https://`)
  }

  return errors
}

export function validateQuickAccess(tiles: QuickAccessTile[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()

  if (tiles.length > 12) errors.push('At most 12 tiles')

  tiles.forEach((tile, index) => {
    if (!tile.label?.trim()) errors.push(`Tile ${index + 1} needs a label`)
    if (!tile.icon_key?.trim()) errors.push(`Tile ${index + 1} needs an icon key`)
    if (!isHex(tile.color)) errors.push(`Tile ${index + 1} colour must be a hex like #FF6B35`)
    if (!tile.id?.trim()) {
      errors.push(`Tile ${index + 1} needs an id`)
    } else if (seen.has(tile.id)) {
      errors.push(`Two tiles share the id "${tile.id}"`)
    }
    seen.add(tile.id)
  })

  return errors
}

export function validateRelease(release: AppReleaseSection): string[] {
  const errors: string[] = []

  for (const platform of ['android', 'ios'] as const) {
    const block = release[platform]
    if (!block) continue
    const label = platform === 'android' ? 'Android' : 'iOS'

    for (const [key, name] of [
      ['min_supported_version', 'minimum supported version'],
      ['latest_version', 'latest version'],
    ] as const) {
      const value = block[key]
      if (value && !SEMVER.test(value)) errors.push(`${label} ${name} must look like 1.2.0`)
      if (!value) errors.push(`${label} needs a ${name}`)
    }

    // Forcing an update with nowhere to send the member strands the app on a
    // blocking screen with no way forward.
    if (block.force_update && !block.update_url?.trim()) {
      errors.push(`${label} force update needs an update URL`)
    }
    if (block.update_url && !/^https?:\/\/.+/i.test(block.update_url)) {
      errors.push(`${label} update URL must start with http:// or https://`)
    }
  }

  return errors
}

export function validatePayment(payment: PaymentSection): string[] {
  const errors: string[] = []

  if (payment.currency_code && !/^[A-Z]{3}$/.test(payment.currency_code)) {
    errors.push('Currency code must be three uppercase letters, e.g. INR')
  }
  if (payment.currency_symbol !== null && !payment.currency_symbol?.trim()) {
    errors.push('Currency symbol cannot be blank')
  }
  const tax = Number(payment.tax_percent)
  if (Number.isNaN(tax) || tax < 0 || tax > 100) errors.push('Tax percent must be between 0 and 100')

  return errors
}
