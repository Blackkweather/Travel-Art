import React from 'react'
import { CheckCircle } from 'lucide-react'
import { t } from '@/i18n'

interface VerifiedBadgeProps {
  type?: 'artist' | 'hotel' | 'platform'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  type = 'platform',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const colors = {
    artist: 'text-gold',
    hotel: 'text-[var(--state-positive)]',
    platform: 'text-gold'
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`} title={t('Compte vérifié')}>
      <CheckCircle className={`${sizeClasses[size]} ${colors[type]} fill-current`} />
      <span className={`${textSizes[size]} font-semibold ${colors[type]}`}>
        {t('Vérifié')}
      </span>
    </div>
  )
}

export default VerifiedBadge


















