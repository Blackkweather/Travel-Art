import React from 'react'
import { CheckCircle } from 'lucide-react'

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
    artist: 'text-purple-600',
    hotel: 'text-green-600',
    platform: 'text-gold'
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`} title="Verified Account">
      <CheckCircle className={`${sizeClasses[size]} ${colors[type]} fill-current`} />
      <span className={`${textSizes[size]} font-semibold ${colors[type]}`}>
        Verified
      </span>
    </div>
  )
}

export default VerifiedBadge








