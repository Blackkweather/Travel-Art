/**
 * Where images come from, and at what size.
 *
 * THE PROBLEM THIS SOLVES
 * Originals are stored in Vercel Blob, which is storage and nothing else: it
 * serves back exactly the bytes that were uploaded. Vercel's image optimizer is
 * a Next.js feature and this is a Vite single-page app served by Express, so it
 * does not apply here. Upload a 4K photograph and every visitor downloads the
 * 4K photograph - about 4-8 MB, on a phone, over mobile data, for a card that
 * renders 400px wide.
 *
 * A transforming CDN sits in front of the origin and returns a resized,
 * re-encoded copy per request. This module is the one place that knows how to
 * ask for one, so switching provider is an environment variable rather than an
 * edit to every component.
 *
 * CONFIGURING IT
 *   VITE_IMAGE_CDN=cloudflare
 *   VITE_IMAGE_CDN_BASE=https://imagedelivery.net/<account-hash>
 * With nothing set, every URL is returned untouched and the site behaves
 * exactly as it does today - so this is safe to ship before the account exists.
 */

export type ImageFormat = 'auto' | 'webp' | 'avif' | 'jpeg'

interface TransformOptions {
  /** Rendered width in CSS pixels. The CDN is asked for this, not the original. */
  width?: number
  /** Defaults to 'auto', which lets the CDN pick per Accept header. */
  format?: ImageFormat
  /** 1-100. Left to the provider's default when absent. */
  quality?: number
}

type Provider = 'none' | 'cloudflare' | 'cloudinary'

const env = (import.meta as any).env ?? {}
const PROVIDER: Provider = (env.VITE_IMAGE_CDN || 'none') as Provider
const BASE: string = (env.VITE_IMAGE_CDN_BASE || '').replace(/\/$/, '')

/** Widths offered to the browser. Chosen to cover phone through 2x desktop. */
export const IMAGE_WIDTHS = [320, 480, 640, 960, 1280, 1920, 2560]

/** True for anything that must never be rewritten. */
function isUntouchable(src: string): boolean {
  return (
    !src ||
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.endsWith('.svg')
  )
}

/**
 * The URL to request for a given source at a given width.
 *
 * Falls back to the original URL whenever a transform cannot be built, so a
 * missing or misconfigured CDN degrades to "the image still loads".
 */
export function imageUrl(src: string, opts: TransformOptions = {}): string {
  if (isUntouchable(src)) return src
  if (PROVIDER === 'none' || !BASE) return src

  const { width, format = 'auto', quality } = opts

  if (PROVIDER === 'cloudflare') {
    // https://imagedelivery.net/<hash>/<image>/<options>
    const params = [
      width ? `w=${width}` : null,
      `f=${format}`,
      quality ? `q=${quality}` : null,
      'fit=scale-down',
    ].filter(Boolean)
    return `${BASE}/${encodeURIComponent(src)}/${params.join(',')}`
  }

  if (PROVIDER === 'cloudinary') {
    const params = [
      width ? `w_${width}` : null,
      `f_${format}`,
      quality ? `q_${quality}` : 'q_auto',
      'c_limit',
    ].filter(Boolean)
    return `${BASE}/image/fetch/${params.join(',')}/${encodeURIComponent(src)}`
  }

  return src
}

/**
 * A srcset covering the widths worth offering for a given layout width.
 *
 * Stops one step past the layout width so a 2x screen is still served a sharp
 * image without offering sizes nothing will ever pick.
 */
export function imageSrcSet(src: string, layoutWidth?: number): string | undefined {
  if (isUntouchable(src) || PROVIDER === 'none' || !BASE) return undefined

  const ceiling = layoutWidth ? layoutWidth * 2 : IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]
  const widths = IMAGE_WIDTHS.filter((w) => w <= ceiling)
  if (widths.length === 0) widths.push(IMAGE_WIDTHS[0])

  return widths.map((w) => `${imageUrl(src, { width: w })} ${w}w`).join(', ')
}

/** Whether a transforming CDN is actually configured. */
export const imageCdnEnabled = PROVIDER !== 'none' && Boolean(BASE)
