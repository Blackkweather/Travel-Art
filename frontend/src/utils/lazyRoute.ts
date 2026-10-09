import { lazy, type ComponentType } from 'react'

/**
 * `React.lazy`, for a page whose chunk can disappear underneath it.
 *
 * Vite fingerprints every chunk, so a deploy replaces
 * `PublicArtistProfile-ptg-Tr7v.js` with `PublicArtistProfile-CbSJkkkq.js` and
 * deletes the old one. A tab that was open across that deploy is still running
 * the previous `index.html` and still asks for the old name, which is now a
 * 404 - and the browser reports it as:
 *
 *   TypeError: Failed to fetch dynamically imported module
 *
 * Nothing is broken; the page is simply out of date. But the error surfaces
 * only when somebody clicks through to a lazy route, so the first thing a
 * visitor does after a deploy is hit a blank error screen. With thirty-odd
 * lazy routes that is close to guaranteed for anyone with the site open.
 *
 * The page reloads itself once, which fetches the current index.html and with
 * it the current chunk names. A flag in sessionStorage keeps that to a single
 * attempt: if the import fails again after a reload the chunk is genuinely
 * missing - a bad deploy, a CDN fault - and the error is allowed through to
 * the ErrorBoundary rather than becoming a reload loop. The flag is cleared on
 * any successful load so a later deploy gets its own attempt.
 */

const RELOAD_FLAG = 'travel-art:chunk-reload'

function readFlag(): boolean {
  try {
    return window.sessionStorage.getItem(RELOAD_FLAG) !== null
  } catch {
    // Storage blocked. Treating that as "already tried" is the safe direction:
    // a reload loop is far worse than one error screen.
    return true
  }
}

function setFlag(): void {
  try {
    window.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
  } catch {
    /* handled by readFlag returning true */
  }
}

function clearFlag(): void {
  try {
    window.sessionStorage.removeItem(RELOAD_FLAG)
  } catch {
    /* nothing to clear */
  }
}

/* The same constraint React.lazy itself declares. A page component's props
   are irrelevant here - this only ever wraps route elements, which are
   rendered without any. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRoute<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const mod = await load()
      clearFlag()
      return mod
    } catch (error) {
      if (readFlag()) {
        // Already reloaded once for this. The chunk is really gone.
        throw error
      }

      console.warn('Chunk missing - reloading to pick up the current build', error)
      setFlag()
      window.location.reload()

      // The page is going away; never resolve, so React does not render an
      // error state in the frame before the reload takes effect.
      return new Promise<{ default: T }>(() => {})
    }
  })
}
