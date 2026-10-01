import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { isVector, loadImage, renderCrop, toUploadFile } from '@/lib/image-crop'
import { MEDIA_SPECS } from './media-specs'
import type { MediaKind } from '../constants'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'

/**
 * Resolves once the browser can paint `url` — or gives up.
 *
 * A staged pick renders from a local blob, which paints instantly; the saved
 * value is a URL for an object that landed in S3 seconds ago and has never
 * been fetched. Dropping the pick the moment the save returns therefore
 * swaps an image that is on screen for one that isn't yet, and the field
 * sits blank for the length of that round-trip. Warming the cache first
 * makes the swap invisible.
 *
 * Never rejects: this is a cosmetic warm-up, and a save must not fail
 * because a thumbnail was slow. The timeout bounds the wait so a stalled
 * fetch can't hold the button in its saving state.
 */
export function preloadImage(url: string, timeoutMs = 6000): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image()
    const done = () => resolve()
    const timer = setTimeout(done, timeoutMs)
    const finish = () => {
      clearTimeout(timer)
      done()
    }
    image.onload = finish
    image.onerror = finish
    image.src = url
  })
}

export interface StagedImage {
  /** Cropped and ready to upload — not sent until the section is saved. */
  file: File
  previewUrl: string
  width: number | null
  height: number | null
  originalName: string
}

/**
 * Images picked for a single-value field (a logo, an onboarding slide) that
 * are held locally until the section is saved.
 *
 * The dropzone this replaces uploaded on drop, so a wrong picture was in
 * storage before anyone saw it — and it swallowed every failure, so a file
 * that couldn't be processed looked exactly like nothing happening. Errors
 * are surfaced per field here.
 */
export function useStagedImages() {
  const [staged, setStaged] = useState<Record<string, StagedImage>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preparing, setPreparing] = useState<string | null>(null)

  const pick = async (key: string, kind: MediaKind, file: File, maxSizeMb: number) => {
    setErrors((prev) => ({ ...prev, [key]: '' }))

    if (!ACCEPT.split(',').includes(file.type)) {
      setErrors((prev) => ({ ...prev, [key]: 'Use a PNG, JPG, WEBP or SVG file.' }))
      return
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [key]: `That file is over ${maxSizeMb}MB.` }))
      return
    }

    setPreparing(key)
    try {
      const spec = MEDIA_SPECS[kind]

      if (spec.ratio === null || isVector(file)) {
        setStaged((prev) => ({
          ...prev,
          [key]: {
            file,
            previewUrl: URL.createObjectURL(file),
            width: null,
            height: null,
            originalName: file.name,
          },
        }))
        return
      }

      const image = await loadImage(file)
      const rendered = await renderCrop(file, image, spec, 0.5)
      setStaged((prev) => ({
        ...prev,
        [key]: {
          file: toUploadFile(file, rendered.blob),
          previewUrl: rendered.dataUrl,
          width: rendered.width,
          height: rendered.height,
          originalName: file.name,
        },
      }))
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        [key]: error?.message ?? 'That image could not be prepared.',
      }))
    } finally {
      setPreparing(null)
    }
  }

  const drop = (key: string) =>
    setStaged((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })

  const clear = () => {
    setStaged({})
    setErrors({})
  }

  /**
   * Rewrites the keys staged picks are filed under. Needed where the key is
   * positional — removing the second onboarding slide has to pull the third
   * slide's pending image down with it, or it would save onto the wrong row.
   */
  const remap = (fn: (key: string) => string | null) =>
    setStaged((prev) => {
      const next: Record<string, StagedImage> = {}
      for (const [key, value] of Object.entries(prev)) {
        const moved = fn(key)
        if (moved) next[moved] = value
      }
      return next
    })

  return {
    staged,
    errors,
    preparing,
    pick,
    drop,
    clear,
    remap,
    hasAny: Object.keys(staged).length > 0,
  }
}

export function StagedImageField({
  label,
  hint,
  kind,
  fieldKey,
  currentUrl,
  staged,
  error,
  isPreparing,
  maxSizeMb = 5,
  onPick,
  onDropStaged,
  onClearCurrent,
}: {
  label: string
  hint?: string
  kind: MediaKind
  fieldKey: string
  currentUrl: string | null
  staged?: StagedImage
  error?: string
  isPreparing: boolean
  maxSizeMb?: number
  onPick: (key: string, kind: MediaKind, file: File, maxSizeMb: number) => void
  onDropStaged: (key: string) => void
  onClearCurrent: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const spec = MEDIA_SPECS[kind]
  const [currentFailed, setCurrentFailed] = useState(false)

  // Without this the field stays stuck on "could not be loaded" for the rest
  // of the session: a single failed fetch latched the flag, so even a fresh
  // upload that replaced the broken URL kept rendering the failure state.
  useEffect(() => setCurrentFailed(false), [currentUrl])

  const shown = staged?.previewUrl ?? (currentFailed ? null : currentUrl)
  const open = () => !isPreparing && inputRef.current?.click()

  return (
    <div className="space-y-1.5">
      <Label className="text-slate-700">{label}</Label>

      <div
        onClick={() => !shown && open()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) onPick(fieldKey, kind, file, maxSizeMb)
        }}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
          shown ? '' : 'cursor-pointer'
        }`}
        style={{
          background: staged
            ? 'rgba(217,119,6,0.06)'
            : isDragging
              ? 'rgba(59,130,246,0.08)'
              : 'rgba(255,255,255,0.6)',
          border: `1.5px dashed ${
            staged
              ? 'rgba(217,119,6,0.4)'
              : isDragging
                ? 'rgba(59,130,246,0.5)'
                : 'rgba(59,130,246,0.25)'
          }`,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onPick(fieldKey, kind, file, maxSizeMb)
            e.target.value = ''
          }}
        />

        {shown ? (
          <img
            src={shown}
            alt=""
            onError={() => setCurrentFailed(true)}
            className="h-12 w-12 flex-shrink-0 rounded-lg object-contain"
            style={{ background: 'rgba(148,163,184,0.15)' }}
          />
        ) : (
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(59,130,246,0.1)' }}
          >
            {isPreparing ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#2563EB' }} />
            ) : (
              <ImagePlus className="h-5 w-5" style={{ color: '#2563EB' }} />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {isPreparing
              ? 'Preparing…'
              : staged
                ? staged.originalName
                : currentFailed
                  ? 'Saved image could not be loaded'
                  : currentUrl
                    ? 'Current image'
                    : 'Drop an image or click to browse'}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: staged ? '#B45309' : '#94a3b8' }}>
            {staged
              ? `Waiting to be saved${staged.width ? ` · cropped to ${staged.width}×${staged.height}` : ''}`
              : `PNG, JPG, WEBP or SVG · up to ${maxSizeMb}MB · ${spec.label}`}
          </p>
        </div>

        {shown && (
          <div className="flex flex-shrink-0 items-center gap-1">
            <Button size="sm" variant="outline" onClick={open} disabled={isPreparing}>
              Change
            </Button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                // Dropping a staged pick just cancels it; dropping a saved
                // one clears the field, which the section's Save then writes.
                if (staged) onDropStaged(fieldKey)
                else onClearCurrent()
              }}
              title={staged ? 'Cancel this pick' : 'Remove the current image'}
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
