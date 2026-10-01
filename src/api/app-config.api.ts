import { get, patch, put, del, apiClient } from './client'
import {
  CONFIG_SECTIONS,
  WEEKDAYS_ABBR as WEEKDAYS,
  QUICK_ACCESS_TARGETS,
  FEATURE_FLAG_KEYS,
  ILLUSTRATION_SLOTS,
  MEDIA_KINDS,
  type ConfigSection,
  type Weekday,
  type FeatureFlagKey,
  type IllustrationSlot,
  type MediaKind,
} from '../components/constants'

/**
 * The white-label configuration a super admin edits for one business —
 * everything the mobile app's `POST /meta` response is assembled from.
 *
 * Stored server-side as one JSONB column per section, so each tab of the App
 * Configuration page saves on its own (`PATCH .../app-config/:section`)
 * without clobbering the tabs it never loaded.
 *
 * Deliberately NOT here: the gym's name/contact (Businesses page), its
 * address and branches (Branches page), its plans (Memberships page), and
 * every gateway credential — those live on the business record and the API
 * rejects them if they arrive through the payment section.
 */

// Re-export types for backward compatibility
export type { ConfigSection, Weekday, FeatureFlagKey, IllustrationSlot, MediaKind }

// ─── Section shapes ──────────────────────────────────────────────────────────

export interface OperatingSlot { open: string; close: string }
export interface OperatingDay { day: Weekday; is_closed: boolean; slots: OperatingSlot[] }
export interface OperatingHours {
  timezone: string
  is_24h: boolean
  schedule: OperatingDay[]
}

export interface Facility { icon: string | null; label: string }

export interface GymProfileSection {
  code: string | null
  tagline: string | null
  description: string | null
  facilities: Facility[]
  operating_hours: OperatingHours
  social_links: { instagram: string | null; facebook: string | null; website: string | null }
}

export interface BrandingSection {
  logo_url: string | null
  app_icon_url: string | null
  splash_logo_url: string | null
}

/**
 * Colour tokens are camelCase because the mobile app consumes them verbatim
 * as style values. `disaleColor` is misspelled in that contract and stays
 * misspelled — renaming it would drop the colour on every shipped build.
 */
export interface ThemeSection {
  font_family: string | null
  appBackground: string
  primaryColor: string
  secondaryColor: string
  darkTextColor: string
  disaleColor: string
  gray: string
  gray_dark: string
}

export interface IntroSlide { image: string | null; title: string; subtitle: string }

export interface ContentSection {
  app_name: string | null
  splash_title: string | null
  splash_subtitle: string | null
  welcome_title: string | null
  welcome_subtitle: string | null
  about_us: string | null
  intro_slides: IntroSlide[]
  terms_url: string | null
  privacy_url: string | null
  help_url: string | null
  support: { phone: string | null; email: string | null; hours: string | null }
  labels: Record<string, string>
}

export interface QuickAccessTile {
  id: string
  label: string
  icon_key: string
  image: string | null
  color: string
  target: (typeof QUICK_ACCESS_TARGETS)[number]
  feature_flag: FeatureFlagKey | null
  order: number
}

export type CapabilitiesSection = Record<string, Record<string, boolean>>

/** Overrides only — the effective flags are derived from `capabilities`. */
export type FeatureFlagsSection = Partial<Record<FeatureFlagKey, boolean>>

export interface PlatformRelease {
  force_update: boolean
  min_supported_version: string
  latest_version: string
  update_url: string | null
}

/** Per-platform: Android can be force-updated while iOS is still in review. */
export interface AppReleaseSection {
  android: PlatformRelease
  ios: PlatformRelease
}

/** Everything here ships to the client in plaintext — publishable keys only. */
export interface IntegrationsSection {
  maps_key: string | null
  video_service: string | null
  video_service_key: string | null
}

/** Currency and tax only; gateway credentials live on the business record. */
export interface PaymentSection {
  currency_code: string
  currency_symbol: string
  tax_percent: number
  provider: 'razorpay' | 'stripe' | 'none' | null
}

export interface SignupFlowSection {
  mode: 'gym_code' | 'invite' | 'open'
  gym_code: string | null
  invite_required: boolean
}

export interface SectionMap {
  gym_profile: GymProfileSection
  branding: BrandingSection
  theme: ThemeSection
  content: ContentSection
  quick_access: QuickAccessTile[]
  capabilities: CapabilitiesSection
  feature_flags: FeatureFlagsSection
  app_config: AppReleaseSection
  integrations: IntegrationsSection
  payment: PaymentSection
  signup_flow: SignupFlowSection
}

export interface AppConfigMediaRecord {
  id: number
  kind: MediaKind
  slot: string | null
  url: string
  title: string | null
  mimeType: string | null
  sizeBytes: number | null
  sortOrder: number
  isActive: boolean
}

export interface AppConfigRecord {
  businessId: number
  businessName: string
  businessKey: string
  /** false = nothing stored; the app is rendering the shipped defaults. */
  isConfigured: boolean
  /**
   * True while this gym is still served from the old `meta_business` blob.
   * `effective` then shows what its app is actually running, and the next
   * save on any tab migrates the whole blob onto the new tables.
   */
  isLegacy: boolean
  revision: number
  publishedAt: string | null
  /** What's actually stored — `null` means "not configured, using default". */
  sections: { [K in ConfigSection]: SectionMap[K] | null }
  /** Stored merged over defaults — what the app actually receives. */
  effective: { [K in ConfigSection]: SectionMap[K] }
  defaults: { [K in ConfigSection]: SectionMap[K] }
  media: AppConfigMediaRecord[]
}

export interface AppConfigVersionSummary {
  id: number
  revision: number
  note: string | null
  publishedBy: number | null
  createdAt: string
}

const base = (businessId: number) => `/businesses/${businessId}/app-config`

export const appConfigApi = {
  get: (businessId: number) => get<AppConfigRecord>(base(businessId)),

  /**
   * Saves one tab. Only that section's column is written, so two admins
   * editing different tabs never overwrite each other.
   */
  saveSection: <K extends ConfigSection>(businessId: number, section: K, value: SectionMap[K]) =>
    patch<AppConfigRecord>(`${base(businessId)}/${section}`, { value }),

  /** Reverts one section to the shipped defaults. */
  resetSection: (businessId: number, section: ConfigSection) =>
    del<AppConfigRecord>(`${base(businessId)}/${section}`),

  /** Drops the whole configuration — back to the shipped defaults. */
  resetAll: (businessId: number) => del<AppConfigRecord>(base(businessId)),

  /**
   * The exact `POST /meta` payload the app would receive right now — not the
   * panel's approximation of it. Returned unwrapped (it is the meta
   * envelope), so this bypasses the `data`-unwrapping helpers.
   */
  preview: async (businessId: number, platform: 'android' | 'ios' = 'android') => {
    const res = await apiClient.get(`${base(businessId)}/preview`, {
      params: { platform, app_version: '0.0.0', locale: 'en', timezone: 'Asia/Kolkata' },
    })
    return res.data as Record<string, unknown>
  },

  versions: (businessId: number) =>
    get<AppConfigVersionSummary[]>(`${base(businessId)}/versions`),

  /** Re-applies a past revision as a new one; history stays append-only. */
  restore: (businessId: number, revision: number, note?: string) =>
    apiClient
      .post(`${base(businessId)}/versions/${revision}/restore`, { note })
      .then((res) => res.data.data as AppConfigRecord),

  media: {
    list: (businessId: number, kind?: MediaKind) =>
      get<AppConfigMediaRecord[]>(`${base(businessId)}/media`, kind ? { kind } : undefined),

    upload: async (
      businessId: number,
      file: File,
      data: { kind: MediaKind; slot?: string; title?: string }
    ) => {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', data.kind)
      if (data.slot) form.append('slot', data.slot)
      if (data.title) form.append('title', data.title)
      const res = await apiClient.post(`${base(businessId)}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Workout demo videos run to 50MB; the client's 30s default would
        // abort mid-upload and strand the object in S3 with no row pointing
        // at it.
        timeout: 5 * 60_000,
      })
      return res.data.data as AppConfigMediaRecord
    },

    update: (
      businessId: number,
      mediaId: number,
      data: { title?: string | null; slot?: string | null; is_active?: boolean; sort_order?: number }
    ) => patch<AppConfigMediaRecord>(`${base(businessId)}/media/${mediaId}`, data),

    reorder: (businessId: number, kind: MediaKind, ids: number[]) =>
      put<AppConfigMediaRecord[]>(`${base(businessId)}/media/reorder`, { kind, ids }),

    remove: (businessId: number, mediaId: number) =>
      del<void>(`${base(businessId)}/media/${mediaId}`),
  },
}
