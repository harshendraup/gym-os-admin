import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Field, SectionNotice, SectionShell, TextField, useSectionDraft } from './section-shell'
import { useResetAppConfigSection, useSaveAppConfigSection } from '@/hooks/useAppConfig'
import { validateGymProfile } from './validation'
import { WEEKDAYS_ABBR as WEEKDAYS, DAY_LABELS } from '../constants'
import {
  type AppConfigRecord,
  type OperatingDay,
} from '@/api/app-config.api'

/**
 * The gym's app-facing identity: tagline, description, facilities, hours and
 * social links.
 *
 * Name, phone, email and address are absent on purpose — those live on the
 * business and branch records and are edited on the Businesses and Branches
 * pages. `/meta` reads them straight from there, so duplicating them here
 * would give the same field two sources of truth.
 */
export default function GymProfileSection({
  businessId,
  config,
}: {
  businessId: number
  config: AppConfigRecord
}) {
  const { draft, setDraft, discard, isDirty, isUsingDefaults } = useSectionDraft(config, 'gym_profile')
  const save = useSaveAppConfigSection(businessId)
  const reset = useResetAppConfigSection(businessId)

  if (!draft) return null

  const schedule: OperatingDay[] = WEEKDAYS.map(
    (day) =>
      draft.operating_hours?.schedule?.find((entry) => entry.day === day) ?? {
        day,
        is_closed: false,
        slots: [{ open: '06:00', close: '22:00' }],
      }
  )

  const setSchedule = (next: OperatingDay[]) =>
    setDraft({ ...draft, operating_hours: { ...draft.operating_hours, schedule: next } })

  const patchDay = (day: string, changes: Partial<OperatingDay>) =>
    setSchedule(schedule.map((entry) => (entry.day === day ? { ...entry, ...changes } : entry)))

  return (
    <SectionShell
      title="Gym Profile"
      description="Tagline, description, facilities, opening hours and social links — the gym's identity inside the app."
      isDirty={isDirty}
      isUsingDefaults={isUsingDefaults}
      isSaving={save.isPending}
      isResetting={reset.isPending}
      onDiscard={discard}
      onSave={() => save.mutate({ section: 'gym_profile', value: draft })}
      onReset={() => reset.mutate('gym_profile')}
      errors={validateGymProfile(draft)}
      notice={
        <SectionNotice>
          The gym's <strong>name, phone, email and address</strong> aren't here — they come from the
          business and branch records, and the app reads them straight from there. Edit them on the
          Businesses and Branches pages.
        </SectionNotice>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Join code"
            hint="What a member types at signup, e.g. PREMIUM01. Falls back to the business key."
            draft={draft}
            setDraft={setDraft}
            field="code"
            placeholder="PREMIUM01"
          />
          <TextField
            label="Tagline"
            draft={draft}
            setDraft={setDraft}
            field="tagline"
            placeholder="Transform Your Body, Transform Your Life"
          />
        </div>

        <Field label="Description" hint="Also used as the app's About Us text unless you override it under Content.">
          <Textarea
            rows={3}
            value={draft.description ?? ''}
            placeholder="A full-service gym with weights, cardio, and group classes."
            onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
          />
        </Field>

        {/* Icon and label are stored separately so the emoji can be picked
            without editing the sentence; the app receives them rejoined. */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Facilities</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraft({ ...draft, facilities: [...(draft.facilities ?? []), { icon: '', label: '' }] })
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add
            </Button>
          </div>

          {(draft.facilities ?? []).length === 0 && (
            <p className="text-xs text-slate-400">No facilities yet — the app hides the section.</p>
          )}

          <div className="space-y-2">
            {(draft.facilities ?? []).map((facility, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  className="w-16 text-center text-lg"
                  value={facility.icon ?? ''}
                  placeholder="🏋️"
                  onChange={(e) => {
                    const next = [...(draft.facilities ?? [])]
                    next[index] = { ...facility, icon: e.target.value || null }
                    setDraft({ ...draft, facilities: next })
                  }}
                />
                <Input
                  value={facility.label}
                  placeholder="Free Weights Zone"
                  onChange={(e) => {
                    const next = [...(draft.facilities ?? [])]
                    next[index] = { ...facility, label: e.target.value }
                    setDraft({ ...draft, facilities: next })
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      facilities: (draft.facilities ?? []).filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm font-medium text-slate-700">Opening hours</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Open 24 hours</span>
              <Switch
                checked={Boolean(draft.operating_hours?.is_24h)}
                onCheckedChange={(is24h) =>
                  setDraft({
                    ...draft,
                    operating_hours: { ...draft.operating_hours, is_24h: is24h },
                  })
                }
              />
            </div>
            <Input
              className="h-8 w-44"
              value={draft.operating_hours?.timezone ?? ''}
              placeholder="Asia/Kolkata"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  operating_hours: { ...draft.operating_hours, timezone: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            {schedule.map((day) => (
              <div
                key={day.day}
                className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(59,130,246,0.1)' }}
              >
                <span className="w-24 text-sm font-medium text-slate-700">{DAY_LABELS[day.day]}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!day.is_closed}
                    onCheckedChange={(open) => patchDay(day.day, { is_closed: !open })}
                  />
                  <span className="text-xs text-slate-500 w-12">
                    {day.is_closed ? 'Closed' : 'Open'}
                  </span>
                </div>
                {!day.is_closed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="h-8 w-28"
                      value={day.slots?.[0]?.open ?? '06:00'}
                      onChange={(e) =>
                        patchDay(day.day, {
                          slots: [{ open: e.target.value, close: day.slots?.[0]?.close ?? '22:00' }],
                        })
                      }
                    />
                    <span className="text-slate-400">–</span>
                    <Input
                      type="time"
                      className="h-8 w-28"
                      value={day.slots?.[0]?.close ?? '22:00'}
                      onChange={(e) =>
                        patchDay(day.day, {
                          slots: [{ open: day.slots?.[0]?.open ?? '06:00', close: e.target.value }],
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Closing time must be after opening time — the API rejects the save otherwise.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Instagram">
            <Input
              value={draft.social_links?.instagram ?? ''}
              placeholder="@premiumfitness"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  social_links: { ...draft.social_links, instagram: e.target.value || null },
                })
              }
            />
          </Field>
          <Field label="Facebook">
            <Input
              value={draft.social_links?.facebook ?? ''}
              placeholder="PremiumFitnessOfficial"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  social_links: { ...draft.social_links, facebook: e.target.value || null },
                })
              }
            />
          </Field>
          <Field label="Website" hint="Also shown as the gym's contact website in the app.">
            <Input
              value={draft.social_links?.website ?? ''}
              placeholder="https://premiumstudio.fitness"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  social_links: { ...draft.social_links, website: e.target.value || null },
                })
              }
            />
          </Field>
        </div>
      </div>
    </SectionShell>
  )
}
