import { useEffect } from 'react'

/**
 * Per-page document metadata.
 *
 * WHY THE DEFAULTS ARE GONE
 * Every prop used to carry a default, and App renders one of these app-wide to
 * publish the organisation schema. React runs a parent's effects *after* its
 * children's, so the app-level instance ran last and wrote the default title
 * over whatever the page had just set - meaning a page could not change its own
 * title even if it tried. Nothing sets a value it was not given now, so the
 * app-level instance contributes only its structured data and pages own their
 * own metadata.
 *
 * A page that passes nothing keeps the values in index.html, which is the right
 * fallback: the document always has a title, never an empty one.
 *
 * WHY A CANONICAL LINK
 * The same content is reachable with and without a trailing slash, and with
 * whatever query string a campaign appends. Without a canonical, those are
 * separate documents to a crawler and the ranking splits between them.
 */

interface StructuredData {
  '@context'?: string
  '@type'?: string
  [key: string]: any
}

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  structuredData?: StructuredData | StructuredData[]
  /** Absolute path, without the origin. Defaults to the current pathname. */
  canonicalPath?: string
}

/** Keeps one meta tag in step, creating it only if the document lacks it. */
function setMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let tag = document.querySelector(selector) as HTMLMetaElement | null
  if (!tag) {
    tag = create()
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  structuredData,
  canonicalPath,
}: SEOHeadProps) {
  useEffect(() => {
    if (title) {
      document.title = title
    }

    if (description) {
      setMeta('meta[name="description"]', () => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'description')
        return m
      }, description)
    }

    if (keywords) {
      setMeta('meta[name="keywords"]', () => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'keywords')
        return m
      }, keywords)
    }

    // Open Graph mirrors whatever this instance was actually given. Sending
    // og:title that disagrees with <title> is worse than sending neither.
    const og: Array<[string, string | undefined]> = [
      ['og:title', title],
      ['og:description', description],
      ['og:image', ogImage],
      ['og:type', 'website'],
      ['og:locale', 'fr_FR'],
    ]
    for (const [property, content] of og) {
      if (!content) continue
      setMeta(`meta[property="${property}"]`, () => {
        const m = document.createElement('meta')
        m.setAttribute('property', property)
        return m
      }, content)
    }

    // Twitter reads its own namespace and falls back to Open Graph only
    // sometimes; naming the card type explicitly is what makes a large preview
    // render rather than a thumbnail.
    if (title || description) {
      setMeta('meta[name="twitter:card"]', () => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'twitter:card')
        return m
      }, 'summary_large_image')
    }

    const path = canonicalPath ?? window.location.pathname
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `${window.location.origin}${path}`)

    if (structuredData) {
      let scriptTag = document.querySelector('#structured-data') as HTMLScriptElement | null
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.id = 'structured-data'
        scriptTag.type = 'application/ld+json'
        document.head.appendChild(scriptTag)
      }
      scriptTag.textContent = JSON.stringify(
        Array.isArray(structuredData) ? structuredData : [structuredData]
      )
    }
  }, [title, description, keywords, ogImage, structuredData, canonicalPath])

  return null
}
