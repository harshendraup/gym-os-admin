import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CornerDownRight, RotateCcw, Save, Sparkles, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { ConfigSection } from '../constants'
import type { AppConfigRecord, SectionMap } from '@/api/app-config.api'

/**
 * Local draft for one configuration section.
 *
 * Seeded from `effective` (defaults merged with what's saved) rather than
 * from `sections`, so an untouched field saves the value the app is already
 * using instead of clearing it. Re-seeds whenever the server record changes —
 * a save, a reset, or a version restore all land here.
 */
export function useSectionDraft<K extends ConfigSection>(
  config: AppConfigRecord | undefined,
  section: K
) {
  const serverValue = config?.effective[section]
  const [draft, setDraft] = useState<SectionMap[K] | undefined>(serverValue)

  // `revision` is the change signal: it's bumped on every write, so it
  // catches a save, a reset and a restore alike without deep-comparing.
  useEffect(() => {
    setDraft(serverValue ? structuredClone(serverValue) : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.revision, config?.businessId, section])

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(serverValue),
    [draft, serverValue]
  )

  /**
   * Throws away local edits and puts the form back to what the server holds.
   * Distinct from clearing the section on the server: this touches nothing
   * the app can see, so it works even on a section that's still on defaults.
   */
  const discard = () => setDraft(serverValue ? structuredClone(serverValue) : undefined)

  /** True when nothing is stored for this section — the app uses defaults. */
  const isUsingDefaults = config ? config.sections[section] === null : true

  return { draft, setDraft, discard, isDirty, isUsingDefaults }
}

interface SectionShellProps {
  title: string
  description: string
  isDirty: boolean
  isUsingDefaults: boolean
  isSaving: boolean
  isResetting: boolean
  /** Throw away local edits — always available while the form is dirty. */
  onDiscard: () => void
  /** Clear the stored section on the server, back to the shipped defaults. */
  onReset: () => void
  onSave: () => void
  /**
   * Client-side problems that the API would reject anyway. Save is blocked
   * while any remain, so a broken value surfaces next to the field instead
   * of as a 422 toast after the round-trip.
   */
  errors?: string[]
  children: React.ReactNode
  /** Rendered above the actions — used for security/behaviour warnings. */
  notice?: React.ReactNode
}

export function SectionShell({
  title,
  description,
  isDirty,
  isUsingDefaults,
  isSaving,
  isResetting,
  onDiscard,
  onReset,
  onSave,
  errors = [],
  children,
  notice,
}: SectionShellProps) {
  const hasErrors = errors.length > 0
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)',
        border: '1px solid rgba(59,130,246,0.18)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(59,130,246,0.12)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {isUsingDefaults && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: 'rgba(148,163,184,0.14)', color: '#64748b' }}
              >
                <Sparkles className="h-3 w-3" />
                Using defaults
              </span>
            )}
            {isDirty && (
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: 'rgba(217,119,6,0.14)', color: '#B45309' }}
              >
                Unsaved
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Undoing your own edits and clearing the live configuration are
              different actions, and conflating them meant Discard was dead
              on any section still running on defaults. */}
          <Button
            size="sm"
            variant="outline"
            onClick={onDiscard}
            disabled={!isDirty}
            title="Undo the unsaved changes on this tab"
          >
            <Undo2 className="mr-1.5 h-3.5 w-3.5" />
            Discard
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={isResetting || isUsingDefaults}
            title={
              isUsingDefaults
                ? 'This section already uses the shipped defaults — nothing to clear'
                : 'Clear this section so the app falls back to the shipped defaults'
            }
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isResetting ? 'Resetting…' : 'Reset to defaults'}
          </Button>
          <Button size="sm" onClick={onSave} disabled={!isDirty || isSaving || hasErrors}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {notice && <div className="px-6 pt-4">{notice}</div>}

      {hasErrors && (
        <div className="px-6 pt-4">
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
            <div className="text-sm" style={{ color: '#B91C1C' }}>
              <p className="font-semibold">Fix these before saving</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">{children}</div>
    </div>
  )
}

/** Amber callout for rules the API enforces, so a 422 isn't a surprise. */
export function SectionNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: 'rgba(217,119,6,0.08)',
        border: '1px solid rgba(217,119,6,0.22)',
        color: '#92400E',
      }}
    >
      {children}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-slate-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

/**
 * Text input bound to one key of a draft object; empty string saves as null.
 *
 * `fallback` is what the app will actually use while the field is empty —
 * the business name behind an empty app name, the business key behind an
 * empty join code. Showing it as the placeholder is why a blank field here
 * isn't a hole: it says what ships, without inventing a stored value.
 */
export function TextField<T extends object>({
  label,
  hint,
  draft,
  setDraft,
  field,
  placeholder,
  fallback,
  type = 'text',
  className,
}: {
  label: string
  hint?: string
  draft: T
  setDraft: (next: T) => void
  field: keyof T
  placeholder?: string
  fallback?: string | null
  type?: string
  className?: string
}) {
  const value = draft[field]
  const isEmpty = value === null || value === undefined || value === ''

  return (
    <Field label={label} hint={fallback && isEmpty ? undefined : hint} className={className}>
      <Input
        type={type}
        placeholder={fallback ?? placeholder}
        value={(value ?? '') as string}
        onChange={(e) =>
          setDraft({ ...draft, [field]: e.target.value === '' ? null : e.target.value })
        }
      />
      {fallback && isEmpty && <InheritedNote value={fallback} />}
    </Field>
  )
}

/** Says which value the app falls back to while a field is left empty. */
export function InheritedNote({ value }: { value: string }) {
  return (
    <p className="flex items-center gap-1 text-xs" style={{ color: '#0F766E' }}>
      <CornerDownRight className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">
        Using <strong className="font-semibold">{value}</strong> from the business record
      </span>
    </p>
  )
}

export function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-3.5 py-2.5"
      style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(59,130,246,0.12)' }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

/** Colour swatch + hex input; the API rejects anything that isn't a hex code. */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const isValid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value ?? '')

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
        />
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#003941"
          className={cn('font-mono', !isValid && 'border-red-300 focus-visible:ring-red-300')}
        />
      </div>
      {!isValid && <p className="text-xs text-red-600">Must be a hex colour like #003941</p>}
    </Field>
  )
}
