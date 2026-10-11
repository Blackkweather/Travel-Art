import React from 'react'
import { Instagram } from 'lucide-react'
import { t } from '@/i18n'

/**
 * Instagram and TikTok profiles, as links that open in a new tab. Renders
 * nothing when neither is filled in.
 */

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.6c.26 0 .51.04.75.11V9.76a5.7 5.7 0 0 0-.75-.05A5.69 5.69 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
  </svg>
)

interface Props {
  instagramUrl?: string | null
  tiktokUrl?: string | null
  className?: string
}

const SocialLinks: React.FC<Props> = ({ instagramUrl, tiktokUrl, className = '' }) => {
  if (!instagramUrl && !tiktokUrl) return null
  const link = 'inline-flex items-center gap-2 rounded-card border border-line px-3 py-2 text-sm font-medium text-content transition-colors hover:border-gold hover:text-gold'
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} data-testid="social-links">
      {instagramUrl && (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={link}>
          <Instagram className="h-4 w-4" aria-hidden="true" />
          Instagram
          <span className="sr-only">{t('(nouvel onglet)')}</span>
        </a>
      )}
      {tiktokUrl && (
        <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className={link}>
          <TikTokIcon className="h-4 w-4" />
          TikTok
          <span className="sr-only">{t('(nouvel onglet)')}</span>
        </a>
      )}
    </div>
  )
}

export default SocialLinks
