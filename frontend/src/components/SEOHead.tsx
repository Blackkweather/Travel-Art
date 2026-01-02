import { useEffect } from 'react'

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
}

export default function SEOHead({
  title = 'Travel Art - Luxury Hotel & Artist Exchange Platform',
  description = 'Connect with luxury hotels and talented artists. Experience unique cultural exchanges and artistic collaborations.',
  keywords = 'travel art, luxury hotels, artists, cultural exchange, hospitality',
  ogImage = '/logo-1-final.png',
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)

    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.setAttribute('content', keywords)

    // Update or create Open Graph tags
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:type', content: 'website' },
    ]

    ogTags.forEach(({ property, content }) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`)
      if (!ogTag) {
        ogTag = document.createElement('meta')
        ogTag.setAttribute('property', property)
        document.head.appendChild(ogTag)
      }
      ogTag.setAttribute('content', content)
    })

    // Add structured data
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
  }, [title, description, keywords, ogImage, structuredData])

  return null
}
