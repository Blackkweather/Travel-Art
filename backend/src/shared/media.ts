/**
 * Recognising media links.
 *
 * The profile page accepted anything containing "youtube.com" as a video,
 * including "https://evil.example/?youtube.com". A link is now parsed, its
 * host checked against the providers we embed, and its id extracted - so the
 * stored value is something the player can actually show.
 */

export type VideoProvider = 'YOUTUBE' | 'VIMEO' | 'INSTAGRAM'

export interface ParsedVideo {
  provider: VideoProvider
  /** The provider's id for the video (YouTube 11-char id, Vimeo number, Instagram shortcode). */
  externalId: string
  /** A clean, canonical address for the video, safe to store. */
  url: string
  /** The address to put in an iframe, or null when the provider has no embed we allow. */
  embedUrl: string | null
}

function parseUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

const hostIs = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = parseUrl(raw)
  if (!url) return null
  const host = url.hostname.toLowerCase()

  if (hostIs(host, 'youtube.com') || hostIs(host, 'youtube-nocookie.com') || host === 'youtu.be') {
    let id: string | null = null
    if (host === 'youtu.be') {
      id = url.pathname.split('/')[1] || null
    } else if (url.pathname === '/watch') {
      id = url.searchParams.get('v')
    } else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
      id = m ? m[1] : null
    }
    if (!id || !YOUTUBE_ID.test(id)) return null
    return {
      provider: 'YOUTUBE',
      externalId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    }
  }

  if (hostIs(host, 'vimeo.com')) {
    const m = url.pathname.match(/(?:^|\/)(\d{5,12})(?:\/|$)/)
    if (!m) return null
    return {
      provider: 'VIMEO',
      externalId: m[1],
      url: `https://vimeo.com/${m[1]}`,
      embedUrl: `https://player.vimeo.com/video/${m[1]}`,
    }
  }

  if (hostIs(host, 'instagram.com')) {
    const m = url.pathname.match(/^\/(?:[^/]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,40})/)
    if (!m) return null
    const kind = m[1] === 'reels' ? 'reel' : m[1]
    return {
      provider: 'INSTAGRAM',
      externalId: m[2],
      url: `https://www.instagram.com/${kind}/${m[2]}/`,
      // Instagram's embed needs its own script, which the CSP does not allow;
      // the profile shows a link card instead.
      embedUrl: null,
    }
  }

  return null
}

/** An http(s) address for an image. Relative paths are only ever written by the server. */
export function isHttpUrl(raw: string): boolean {
  return parseUrl(raw) !== null
}
