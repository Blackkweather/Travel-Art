import React from 'react'
import { BadgeCheck, ExternalLink, ShieldQuestion } from 'lucide-react'
import type { MediaItem } from '@/types'
import { t } from '@/i18n'

/**
 * One performance video. YouTube (privacy-enhanced domain) and Vimeo play in
 * place; Instagram cannot be embedded under our security policy, so it is a
 * link card that opens the reel on Instagram.
 */
const PROVIDER_LABEL: Record<string, string> = { YOUTUBE: 'YouTube', VIMEO: 'Vimeo', INSTAGRAM: 'Instagram', LINK: 'Lien', UPLOAD: 'Vidéo' }

interface Props {
  video: MediaItem
  index: number
  action?: React.ReactNode
  /** The owner and reviewers also see "not verified yet"; visitors only see the proof. */
  showUnverified?: boolean
}

/** Whether the video is shown to be the artist's own. */
export const VerificationBadge: React.FC<{ video: MediaItem; showUnverified?: boolean }> = ({ video, showUnverified }) => {
  if (video.verification === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--state-positive-wash)] px-2 py-0.5 text-[0.75rem] font-medium text-[var(--state-positive)]" data-testid="video-verified">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {t('Vidéo vérifiée')}
      </span>
    )
  }
  if (!showUnverified) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-[0.75rem] font-medium text-content-secondary">
      <ShieldQuestion className="h-3.5 w-3.5" aria-hidden="true" />
      {video.verification === 'REJECTED' ? t('Non retenue') : t('Non vérifiée')}
    </span>
  )
}

const VideoCard: React.FC<Props> = ({ video, index, action, showUnverified }) => {
  const title = video.title || `${t('Vidéo de performance')} ${index + 1}`
  return (
    <div className="overflow-hidden rounded-card border border-line">
      {video.embedUrl ? (
        <div className="aspect-video bg-surface-inverse">
          <iframe
            src={video.embedUrl}
            title={title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex aspect-video items-center justify-center gap-2 bg-surface-sunken text-content hover:text-gold"
        >
          <ExternalLink className="h-5 w-5" aria-hidden="true" />
          {t('Voir sur {provider}', { provider: PROVIDER_LABEL[video.provider] ?? t('le site') })}
        </a>
      )}
      <div className="flex items-center justify-between gap-3 bg-surface p-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-content">
            {title}
            <VerificationBadge video={video} showUnverified={showUnverified} />
          </p>
          <p className="truncate text-sm text-content-secondary">
            {PROVIDER_LABEL[video.provider] ?? ''}
            {video.channel ? ` · ${video.channel}` : ''} · {video.url}
          </p>
        </div>
        {action}
      </div>
    </div>
  )
}

export default VideoCard
