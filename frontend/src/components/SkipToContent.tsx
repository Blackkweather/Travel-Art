import { useEffect } from 'react'

export default function SkipToContent() {
  useEffect(() => {
    // Add skip to content link
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-navy focus:text-white focus:rounded'
    skipLink.setAttribute('aria-label', 'Skip to main content')
    
    // Insert at the beginning of body
    if (document.body) {
      document.body.insertBefore(skipLink, document.body.firstChild)
    }

    return () => {
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink)
      }
    }
  }, [])

  return null
}
