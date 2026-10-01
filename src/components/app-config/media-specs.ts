import type { MediaKind } from '../constants'
import type { ImageSpec } from '@/lib/image-crop'

/**
 * The shape each kind is rendered at in the mobile app. Uploads are cropped
 * to these before they leave the browser, so nothing arrives at a ratio the
 * app will stretch or letterbox on its own.
 *
 * `contain` is used wherever cropping would destroy meaning — a wide logo
 * sliced into a square is worse than a padded one.
 */
export const MEDIA_SPECS: Record<MediaKind, ImageSpec> = {
  home_banner: { ratio: 16 / 9, maxWidth: 1600, fit: 'cover', label: '16:9 · 1600×900' },
  promo_banner: { ratio: 16 / 9, maxWidth: 1600, fit: 'cover', label: '16:9 · 1600×900' },
  // Video is uploaded untouched — the browser can't re-encode it usefully.
  workout_video: { ratio: null, maxWidth: 0, fit: 'cover', label: 'any' },
  illustration: { ratio: 1, maxWidth: 512, fit: 'contain', label: '1:1 · 512×512' },
  logo: { ratio: 1, maxWidth: 512, fit: 'contain', label: '1:1 · 512×512' },
  app_icon: { ratio: 1, maxWidth: 512, fit: 'cover', label: '1:1 · 512×512' },
  intro_slide: { ratio: 3 / 4, maxWidth: 1080, fit: 'cover', label: '3:4 · 1080×1440' },
  quick_access_icon: { ratio: 1, maxWidth: 256, fit: 'contain', label: '1:1 · 256×256' },
}
