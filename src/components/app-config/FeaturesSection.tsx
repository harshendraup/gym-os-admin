import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SectionNotice, SectionShell, ToggleRow, useSectionDraft } from './section-shell'
import { useResetAppConfigSection, useSaveAppConfigSection } from '@/hooks/useAppConfig'
import { FEATURE_FLAG_KEYS } from '../constants'
import {
  type AppConfigRecord,
  type CapabilitiesSection,
  type FeatureFlagKey,
} from '@/api/app-config.api'

const GROUP_LABELS: Record<string, string> = {
  auth: 'Sign-in',
  workout: 'Workouts',
  diet: 'Diet',
  progress: 'Progress',
  membership: 'Membership',
  attendance: 'Attendance',
  trainer: 'Trainers',
  payment: 'Payments',
  notifications: 'Notifications',
  engagement: 'Engagement',
  ecommerce: 'Store',
}

/**
 * Mirrors `MetaService.deriveFeatureFlags` so the panel can show the
 * resulting flags while the admin is still toggling capabilities. The server
 * remains the authority — this is a preview of what it will compute, and the
 * Preview tab shows the value it actually returned.
 */
function deriveFlags(capabilities: CapabilitiesSection): Record<FeatureFlagKey, boolean> {
  const at = (group: string, key: string) => Boolean(capabilities?.[group]?.[key])

  return {
    workout: at('workout', 'enabled'),
    diet: at('diet', 'enabled'),
    attendance: at('attendance', 'enabled'),
    trainer: at('trainer', 'enabled'),
    payment: at('payment', 'enabled'),
    offers: at('engagement', 'offers'),
    membership: at('membership', 'enabled'),
    progress: at('progress', 'bmi') || at('progress', 'measurements'),
    notifications: at('notifications', 'push'),
    ecommerce: at('ecommerce', 'enabled'),
    social:
      at('engagement', 'referrals') ||
      at('engagement', 'challenges') ||
      at('engagement', 'leaderboard'),
    chat: at('trainer', 'trainer_chat'),
  }
}

export default function FeaturesSection({
  businessId,
  config,
}: {
  businessId: number
  config: AppConfigRecord
}) {
  const capabilities = useSectionDraft(config, 'capabilities')
  const flags = useSectionDraft(config, 'feature_flags')
  const save = useSaveAppConfigSection(businessId)
  const reset = useResetAppConfigSection(businessId)

  if (!capabilities.draft || !flags.draft) return null

  const derived = deriveFlags(capabilities.draft)
  const overrides = flags.draft

  return (
    <div className="space-y-5">
      <SectionShell
        title="Capabilities"
        description="What each part of the app can do for this gym. Feature flags are computed from these."
        isDirty={capabilities.isDirty}
        isUsingDefaults={capabilities.isUsingDefaults}
        isSaving={save.isPending}
        isResetting={reset.isPending}
        onDiscard={capabilities.discard}
        onSave={() => save.mutate({ section: 'capabilities', value: capabilities.draft! })}
        onReset={() => reset.mutate('capabilities')}
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(capabilities.draft).map(([group, options]) => (
            <div key={group} className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                {GROUP_LABELS[group] ?? group}
              </p>
              <div className="space-y-1.5">
                {Object.entries(options).map(([key, value]) => (
                  <ToggleRow
                    key={key}
                    label={key.replace(/_/g, ' ')}
                    checked={Boolean(value)}
                    onCheckedChange={(next) =>
                      capabilities.setDraft({
                        ...capabilities.draft!,
                        [group]: { ...options, [key]: next },
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title="Feature Flags"
        description="The flat on/off map the app reads. Each flag follows its capability unless you override it here."
        isDirty={flags.isDirty}
        isUsingDefaults={flags.isUsingDefaults}
        isSaving={save.isPending}
        isResetting={reset.isPending}
        onDiscard={flags.discard}
        onSave={() => save.mutate({ section: 'feature_flags', value: flags.draft! })}
        onReset={() => reset.mutate('feature_flags')}
        notice={
          <SectionNotice>
            These are <strong>overrides</strong>. A flag with no override follows its capability
            above — override one only to break that link deliberately, since the flag will then stop
            tracking the capability entirely.
          </SectionNotice>
        }
      >
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {FEATURE_FLAG_KEYS.map((flag) => {
            const isOverridden = flag in overrides
            const effective = isOverridden ? Boolean(overrides[flag]) : derived[flag]

            return (
              <div
                key={flag}
                className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
                style={{
                  background: isOverridden ? 'rgba(217,119,6,0.07)' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${isOverridden ? 'rgba(217,119,6,0.25)' : 'rgba(59,130,246,0.12)'}`,
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{flag}</p>
                  <p className="text-xs text-slate-400">
                    {isOverridden
                      ? `Overridden — capability says ${derived[flag] ? 'on' : 'off'}`
                      : 'Follows capability'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={effective}
                    onCheckedChange={(next) =>
                      flags.setDraft({ ...overrides, [flag]: next })
                    }
                  />
                  {isOverridden && (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Drop the override and follow the capability again"
                      onClick={() => {
                        const next = { ...overrides }
                        delete next[flag]
                        flags.setDraft(next)
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </SectionShell>
    </div>
  )
}
