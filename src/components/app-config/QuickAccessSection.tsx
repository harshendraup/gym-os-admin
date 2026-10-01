import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, SectionShell, useSectionDraft } from './section-shell'
import {
  useResetAppConfigSection,
  useSaveAppConfigSection,
  useUploadAppConfigMedia,
} from '@/hooks/useAppConfig'
import { StagedImageField, preloadImage, useStagedImages } from './StagedImageField'
import { validateQuickAccess } from './validation'
import {
  FEATURE_FLAG_KEYS,
  QUICK_ACCESS_TARGETS,
} from '../constants'
import {
  type AppConfigRecord,
  type QuickAccessTile,
} from '@/api/app-config.api'

/**
 * The tile grid on the app home screen. `target` is the screen a tile opens
 * and `feature_flag` is what hides it — a tile pointing at a flag the app
 * doesn't know would stay visible when that feature is switched off, so both
 * are picked from fixed lists rather than typed.
 */
export default function QuickAccessSection({
  businessId,
  config,
}: {
  businessId: number
  config: AppConfigRecord
}) {
  const { draft, setDraft, discard, isDirty, isUsingDefaults } = useSectionDraft(config, 'quick_access')
  const save = useSaveAppConfigSection(businessId)
  const reset = useResetAppConfigSection(businessId)
  const upload = useUploadAppConfigMedia(businessId)
  const images = useStagedImages()
  const [isPublishing, setIsPublishing] = useState(false)

  // Keyed by the tile's own id rather than its position, so reordering and
  // deleting tiles can't move a pending picture onto the wrong one.
  const tileKey = (id: string) => `tile-${id}`

  if (!draft) return null

  const tiles = [...draft].sort((a, b) => a.order - b.order)

  /** `order` is what the app sorts by, so it's renumbered on every change. */
  const commit = (next: QuickAccessTile[]) =>
    setDraft(next.map((tile, index) => ({ ...tile, order: index + 1 })))

  const patch = (index: number, changes: Partial<QuickAccessTile>) =>
    commit(tiles.map((tile, i) => (i === index ? { ...tile, ...changes } : tile)))

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= tiles.length) return
    const next = [...tiles]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  /**
   * Uploads the custom icons that are still local, writes their URLs onto
   * the tiles they belong to, then saves. Upload-first means a failed
   * upload leaves the saved grid pointing at what it already had.
   */
  const publishQuickAccess = async () => {
    setIsPublishing(true)
    try {
      const next = [...tiles]
      const uploaded: string[] = []

      for (const [key, pick] of Object.entries(images.staged)) {
        const index = next.findIndex((tile) => tileKey(tile.id) === key)
        if (index === -1) continue
        const media = await upload.mutateAsync({ file: pick.file, kind: 'quick_access_icon' })
        next[index] = { ...next[index], image: media.url }
        uploaded.push(media.url)
      }

      await save.mutateAsync({ section: 'quick_access', value: next })
      // Warm the new URLs before the local previews are dropped, or each
      // icon blanks out for the length of its first fetch.
      await Promise.all(uploaded.map((url) => preloadImage(url)))
      images.clear()
    } catch {
      // Surfaced by the mutation; picks stay staged so Save can be retried.
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <SectionShell
      title="Quick Access"
      description="The tile grid on the app home screen — up to 12 tiles, shown in this order."
      // A picked-but-unsaved icon is an unsaved change like any other.
      isDirty={isDirty || images.hasAny}
      isUsingDefaults={isUsingDefaults}
      isSaving={save.isPending || isPublishing}
      isResetting={reset.isPending}
      onDiscard={() => {
        images.clear()
        discard()
      }}
      onSave={publishQuickAccess}
      onReset={() => reset.mutate('quick_access')}
      errors={validateQuickAccess(tiles)}
    >
      <div className="space-y-3">
        {tiles.map((tile, index) => (
          <div
            key={`${tile.id}-${index}`}
            className="space-y-3 rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(59,130,246,0.12)' }}
          >
            <div className="grid gap-3 lg:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ background: tile.color }}
                title={tile.color}
              >
                {index + 1}
              </div>

              <Field label="Label">
                <Input value={tile.label} onChange={(e) => patch(index, { label: e.target.value })} />
              </Field>

              <Field label="Icon key" hint="Name of an icon bundled in the app.">
                <Input
                  className="font-mono"
                  value={tile.icon_key}
                  placeholder="quick_workout"
                  onChange={(e) => patch(index, { icon_key: e.target.value })}
                />
              </Field>

              <Field label="Opens screen">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={tile.target}
                  onChange={(e) => patch(index, { target: e.target.value as QuickAccessTile['target'] })}
                >
                  {QUICK_ACCESS_TARGETS.map((target) => (
                    <option key={target} value={target}>{target}</option>
                  ))}
                </select>
              </Field>

              <Field label="Hidden when flag is off">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={tile.feature_flag ?? ''}
                  onChange={(e) =>
                    patch(index, {
                      feature_flag: (e.target.value || null) as QuickAccessTile['feature_flag'],
                    })
                  }
                >
                  <option value="">Always visible</option>
                  {FEATURE_FLAG_KEYS.map((flag) => (
                    <option key={flag} value={flag}>{flag}</option>
                  ))}
                </select>
              </Field>

              <Field label="Colour">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(tile.color) ? tile.color : '#000000'}
                    onChange={(e) => patch(index, { color: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
                  />
                  <Input
                    className="font-mono"
                    value={tile.color}
                    onChange={(e) => patch(index, { color: e.target.value })}
                  />
                </div>
              </Field>

              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={index === tiles.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    // Drop any picture still waiting on this tile, or it would
                    // be uploaded on the next Save with nothing to attach to.
                    images.drop(tileKey(tile.id))
                    commit(tiles.filter((_, i) => i !== index))
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* A custom picture wins over `icon_key`, which only resolves to
                an icon already bundled in the app build. */}
            <div className="max-w-md">
              <StagedImageField
                label="Custom icon (optional)"
                hint="Leave empty to use the bundled icon named above."
                kind="quick_access_icon"
                fieldKey={tileKey(tile.id)}
                maxSizeMb={1}
                currentUrl={tile.image}
                staged={images.staged[tileKey(tile.id)]}
                error={images.errors[tileKey(tile.id)]}
                isPreparing={images.preparing === tileKey(tile.id)}
                onPick={images.pick}
                onDropStaged={images.drop}
                onClearCurrent={() => patch(index, { image: null })}
              />
            </div>
          </div>
        ))}

        <Button
          size="sm"
          variant="outline"
          disabled={tiles.length >= 12}
          onClick={() =>
            commit([
              ...tiles,
              {
                // The id is the app's stable key for a tile, so it's derived
                // from the position rather than left for an admin to invent.
                id: `tile_${Date.now()}`,
                label: 'New tile',
                // Matches the icon the default Workout tile ships with, so a
                // new tile renders something real until it's renamed.
                icon_key: 'quick_workout',
                image: null,
                color: '#3B82F6',
                target: 'Workout',
                feature_flag: null,
                order: tiles.length + 1,
              },
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add tile
        </Button>
      </div>
    </SectionShell>
  )
}
