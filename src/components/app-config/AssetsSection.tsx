import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Save, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  useDeleteAppConfigMedia,
  useReorderAppConfigMedia,
  useUpdateAppConfigMedia,
  useUploadAppConfigMedia,
} from '@/hooks/useAppConfig'
import {
  ILLUSTRATION_SLOTS,
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
  ORDERED_GROUPS,
  LIBRARY_KINDS,
  KIND_LABELS,
  SLOT_LABELS,
  type MediaKind,
  type LibraryKind,
} from '../constants'
import {
  type AppConfigMediaRecord,
  type AppConfigRecord,
} from '@/api/app-config.api'
import { SectionNotice } from './section-shell'
import { MEDIA_SPECS } from './media-specs'
import { AssetThumb, PickButton, StagedList, useStagedUploads } from './StagedUploader'

/**
 * Uploaded app media.
 *
 * Picking a file no longer sends it: it's cropped to the ratio the app
 * renders that kind at, shown as a staged preview, and only uploaded on
 * Save. That's the only point at which a wrong crop or a wrong picture can
 * still be dropped for free — once it's in storage, "removing" it leaves the
 * file behind.
 *
 * Actions on already-saved assets (reorder, hide, delete) still apply
 * immediately: each is one deliberate act on something already live.
 */
export default function AssetsSection({
  businessId,
  config,
}: {
  businessId: number
  config: AppConfigRecord
}) {
  const byKind = (kind: MediaKind) =>
    config.media.filter((item) => item.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-5">
      <SectionNotice>
        Pick images, check the crop, then <strong>Save</strong> — nothing is uploaded before that.
        Reordering, hiding and deleting a <em>saved</em> asset still applies immediately.
      </SectionNotice>

      {ORDERED_GROUPS.map((group) => (
        <OrderedMediaGroup
          key={group.kind}
          businessId={businessId}
          kind={group.kind}
          title={group.title}
          description={group.description}
          accept={group.accept}
          limits={group.limits}
          items={byKind(group.kind)}
        />
      ))}

      <IllustrationsGroup businessId={businessId} media={config.media} />

      <LibraryGroup businessId={businessId} media={config.media} />
    </div>
  )
}

// ─── Ordered lists: banners and videos ───────────────────────────────────────

function OrderedMediaGroup({
  businessId,
  kind,
  title,
  description,
  accept,
  limits,
  items,
}: {
  businessId: number
  kind: MediaKind
  title: string
  description: string
  accept: string
  limits: string
  items: AppConfigMediaRecord[]
}) {
  const spec = MEDIA_SPECS[kind]
  const isVideo = kind === 'workout_video'
  const staged = useStagedUploads(spec)

  const upload = useUploadAppConfigMedia(businessId)
  const update = useUpdateAppConfigMedia(businessId)
  const reorder = useReorderAppConfigMedia(businessId)
  const remove = useDeleteAppConfigMedia(businessId)
  const [isSaving, setIsSaving] = useState(false)

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const ids = items.map((item) => item.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate({ kind, ids })
  }

  // Sequential rather than parallel: order of arrival decides `sort_order`,
  // and a 50MB video alongside three banners would otherwise race.
  const save = async () => {
    setIsSaving(true)
    try {
      for (const item of staged.items) {
        await upload.mutateAsync({ file: item.uploadFile, kind })
      }
      staged.clear()
    } catch {
      // The mutation's own handler already surfaced the failure; whatever
      // is left staged stays staged so it can be retried.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <GroupShell
      title={title}
      description={description}
      limits={`${limits}${spec.ratio ? ` · cropped to ${spec.label}` : ''}`}
      actions={
        <PickButton
          accept={accept}
          multiple
          isPreparing={staged.isPreparing}
          onPick={(files) => staged.add(files)}
          label={isVideo ? 'Add videos' : 'Add images'}
        />
      }
    >
      <StagedList
        items={staged.items}
        spec={spec}
        isVideo={isVideo}
        onReframe={staged.reframe}
        onRemove={staged.remove}
      />

      {staged.items.length > 0 && (
        <SaveBar
          count={staged.items.length}
          isSaving={isSaving}
          onSave={save}
          onDiscard={staged.clear}
        />
      )}

      {items.length === 0 && staged.items.length === 0 ? (
        <p className="text-sm text-slate-400">No {title.toLowerCase()} yet.</p>
      ) : (
        items.map((item, index) => (
          <SavedRow
            key={item.id}
            media={item}
            isVideo={isVideo}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            isBusy={reorder.isPending || update.isPending}
            onMove={(direction) => move(index, direction)}
            onToggle={(isActive) => update.mutate({ mediaId: item.id, data: { is_active: isActive } })}
            onDelete={() => remove.mutate(item.id)}
          />
        ))
      )}
    </GroupShell>
  )
}

// ─── Illustrations: one image per named slot ─────────────────────────────────

function IllustrationsGroup({
  businessId,
  media,
}: {
  businessId: number
  media: AppConfigMediaRecord[]
}) {
  const spec = MEDIA_SPECS.illustration
  const staged = useStagedUploads(spec)
  const upload = useUploadAppConfigMedia(businessId)
  const remove = useDeleteAppConfigMedia(businessId)
  const [isSaving, setIsSaving] = useState(false)

  const save = async () => {
    setIsSaving(true)
    try {
      for (const item of staged.items) {
        await upload.mutateAsync({ file: item.uploadFile, kind: 'illustration', slot: item.slot })
      }
      staged.clear()
    } catch {
      // Surfaced by the mutation; leave the batch staged for a retry.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <GroupShell
      title="Empty-state illustrations"
      description="Shown when a screen has nothing to display. One image per slot."
      limits={`JPG, PNG, WEBP or SVG · up to 2MB · fitted to ${spec.label}`}
    >
      <StagedList
        items={staged.items}
        spec={spec}
        onReframe={staged.reframe}
        onRemove={staged.remove}
        slotLabels={SLOT_LABELS}
      />

      {staged.items.length > 0 && (
        <SaveBar
          count={staged.items.length}
          isSaving={isSaving}
          onSave={save}
          onDiscard={staged.clear}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {ILLUSTRATION_SLOTS.map((slot) => {
          const saved = media.find((item) => item.kind === 'illustration' && item.slot === slot)
          const pending = staged.items.find((item) => item.slot === slot)

          return (
            <div
              key={slot}
              className="rounded-xl p-3 text-center"
              style={{
                background: pending ? 'rgba(217,119,6,0.06)' : 'rgba(255,255,255,0.7)',
                border: `1px ${pending ? 'dashed rgba(217,119,6,0.35)' : 'solid rgba(59,130,246,0.12)'}`,
              }}
            >
              {pending ? (
                <img
                  src={pending.previewUrl}
                  alt=""
                  className="mx-auto h-20 w-20 rounded-lg object-contain"
                />
              ) : saved ? (
                <AssetThumb url={saved.url} className="mx-auto h-20 w-20" />
              ) : (
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100" />
              )}

              <p className="mt-2 text-xs font-medium text-slate-700">{SLOT_LABELS[slot]}</p>

              <div className="mt-1.5 flex items-center justify-center gap-2">
                <PickSlotButton
                  disabled={Boolean(pending)}
                  onPick={(file) => staged.add([file], slot)}
                />
                {saved && !pending && (
                  <button
                    type="button"
                    onClick={() => remove.mutate(saved.id)}
                    className="text-[11px] font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </GroupShell>
  )
}

function PickSlotButton({
  disabled,
  onPick,
}: {
  disabled?: boolean
  onPick: (file: File) => void
}) {
  return (
    <label
      className={`cursor-pointer text-[11px] font-medium ${
        disabled ? 'cursor-not-allowed text-slate-300' : 'text-blue-600 hover:underline'
      }`}
    >
      <input
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ''
        }}
      />
      {disabled ? 'Staged' : 'Choose'}
    </label>
  )
}

// ─── Files uploaded from the Branding and Content tabs ───────────────────────

function LibraryGroup({
  businessId,
  media,
}: {
  businessId: number
  media: AppConfigMediaRecord[]
}) {
  const remove = useDeleteAppConfigMedia(businessId)
  const library = media.filter((item) => LIBRARY_KINDS.includes(item.kind as LibraryKind))

  return (
    <GroupShell
      title="Uploaded files"
      description="Logos, app icons and slide images uploaded from other tabs."
      limits="Deleting one here does not clear the field that points at it — update that tab too."
    >
      {library.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing uploaded from the other tabs yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {library.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(59,130,246,0.12)' }}
            >
              <AssetThumb url={item.url} className="mx-auto h-16 w-16" />
              <p className="mt-1.5 truncate text-[11px] font-medium text-slate-700">
                {KIND_LABELS[item.kind] ?? item.kind}
              </p>
              <button
                type="button"
                onClick={() => remove.mutate(item.id)}
                className="mt-1 text-[11px] font-medium text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </GroupShell>
  )
}

// ─── Shared chrome ───────────────────────────────────────────────────────────

function GroupShell({
  title,
  description,
  limits,
  actions,
  children,
}: {
  title: string
  description: string
  limits: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)',
        border: '1px solid rgba(59,130,246,0.18)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(59,130,246,0.12)' }}
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          <p className="mt-0.5 text-xs text-slate-400">{limits}</p>
        </div>
        {actions}
      </div>
      <div className="space-y-2 p-6">{children}</div>
    </div>
  )
}

function SaveBar({
  count,
  isSaving,
  onSave,
  onDiscard,
}: {
  count: number
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-2 pb-1">
      <Button size="sm" variant="outline" onClick={onDiscard} disabled={isSaving}>
        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
        Discard
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-3.5 w-3.5" />
        )}
        {isSaving ? 'Uploading…' : `Save ${count} file${count > 1 ? 's' : ''}`}
      </Button>
    </div>
  )
}

function SavedRow({
  media,
  isVideo,
  canMoveUp,
  canMoveDown,
  isBusy,
  onMove,
  onToggle,
  onDelete,
}: {
  media: AppConfigMediaRecord
  isVideo: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  isBusy: boolean
  onMove: (direction: -1 | 1) => void
  onToggle: (isActive: boolean) => void
  onDelete: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(59,130,246,0.12)' }}
    >
      <AssetThumb url={media.url} isVideo={isVideo} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {media.title ?? media.url.split('/').pop()}
        </p>
        <p className="text-xs text-slate-400">
          Position {media.sortOrder + 1}
          {media.sizeBytes ? ` · ${(media.sizeBytes / 1024 / 1024).toFixed(1)}MB` : ''}
          {!media.isActive && ' · hidden from the app'}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" disabled={!canMoveUp || isBusy} onClick={() => onMove(-1)}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={!canMoveDown || isBusy} onClick={() => onMove(1)}>
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Switch checked={media.isActive} onCheckedChange={onToggle} disabled={isBusy} />
        <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
