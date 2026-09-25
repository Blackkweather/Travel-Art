import { useState, type ImgHTMLAttributes } from 'react'
import { normalizeImageUrl } from '@/utils/imageUrl'
import { imageSrcSet, imageUrl } from '@/utils/imageCdn'

/**
 * An <img> with the three things the raw tag keeps getting wrong here.
 *
 * Of the 29 plain <img> tags in this codebase, 12 lazy-loaded, 4 offered a
 * srcset and 6 reserved space. That is fine while every image is a small
 * hand-optimised webp in /public; it stops being fine the moment artists and
 * hotels upload their own photographs at whatever size their camera produced.
 *
 *   1. Space is reserved before the bytes arrive. Without width and height the
 *      page reflows as each image lands, which is the single biggest source of
 *      layout shift on a card grid.
 *   2. Anything below the fold is deferred. `priority` opts a hero out, because
 *      lazy-loading the largest element above the fold delays it.
 *   3. The browser is offered a set of widths and picks one. Without a srcset,
 *      a phone downloads the desktop image.
 *
 * With no CDN configured the srcset is omitted and this behaves like a plain
 * <img> that reserves space and lazy-loads - useful on its own.
 */

interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string | null | undefined
  alt: string
  /** Rendered width in CSS pixels; also drives which widths are offered. */
  width?: number
  height?: number
  /** Set on the one image that is the largest thing above the fold. */
  priority?: boolean
  /** The `sizes` attribute, when the image is not a fixed width. */
  sizes?: string
  /** Shown when the source is missing or fails to load. */
  fallback?: React.ReactNode
}

export default function Img({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
  fallback = null,
  className = '',
  style,
  ...rest
}: ImgProps) {
  const [failed, setFailed] = useState(false)

  const resolved = normalizeImageUrl(src ?? '')
  if (!resolved || failed) return <>{fallback}</>

  const srcSet = imageSrcSet(resolved, width)

  return (
    <img
      {...rest}
      src={imageUrl(resolved, { width })}
      srcSet={srcSet}
      sizes={srcSet ? sizes ?? (width ? `${width}px` : '100vw') : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      // Decoding off the main thread keeps a grid of images from janking the
      // scroll as they arrive.
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      onError={() => setFailed(true)}
      className={className}
      style={
        // An aspect ratio holds the box open even when only one dimension is
        // known, which is the common case for user-uploaded photographs.
        width && height ? { aspectRatio: `${width} / ${height}`, ...style } : style
      }
    />
  )
}
