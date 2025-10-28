import React from 'react'
import { motion } from 'framer-motion'

export type RankTier = 'red' | 'blue' | 'green' | 'gold' | 'platinum' | 'diamond'

interface ArtistRankProps {
  tier: RankTier
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  animated?: boolean
}

export const RANK_CONFIG = {
  red: {
    color: '#2563EB',
    label: 'Rising',
    description: 'Starting tier - Welcome!'
  },
  blue: {
    color: '#8B5CF6',
    label: 'Skilled',
    description: 'Building reputation'
  },
  green: {
    color: '#059669',
    label: 'Expert',
    description: 'Highly experienced'
  },
  gold: {
    color: '#C9A63C',
    label: 'Artist',
    description: 'Top-tier professional'
  },
  platinum: {
    color: '#9CA3AF',
    label: 'Master',
    description: 'Elite performer'
  },
  diamond: {
    color: '#06B6D4',
    label: 'Superstar',
    description: 'On request only'
  }
}

const SIZE_CONFIG = {
  sm: { size: 16, fontSize: 'text-xs', padding: 'p-1' },
  md: { size: 24, fontSize: 'text-sm', padding: 'p-2' },
  lg: { size: 32, fontSize: 'text-base', padding: 'p-3' },
  xl: { size: 48, fontSize: 'text-lg', padding: 'p-4' }
}

export const ArtistRank: React.FC<ArtistRankProps> = ({ 
  tier, 
  size = 'md', 
  showLabel = false,
  animated = true 
}) => {
  const config = RANK_CONFIG[tier]
  const sizeConfig = SIZE_CONFIG[size]

  const ReactLogo = () => (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: sizeConfig.size, height: sizeConfig.size }}
    >
      {/* React logo - atom symbol */}
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.5"
        stroke={config.color}
        strokeWidth="1.5"
        fill="none"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.5"
        stroke={config.color}
        strokeWidth="1.5"
        fill="none"
        transform="rotate(60 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.5"
        stroke={config.color}
        strokeWidth="1.5"
        fill="none"
        transform="rotate(120 12 12)"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="2" 
        fill={config.color}
      />
    </svg>
  )

  const badge = (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center">
        <ReactLogo />
      </div>
      
      {showLabel && (
        <div className="flex flex-col">
          <span className={`font-semibold ${sizeConfig.fontSize}`} style={{ color: config.color }}>
            {config.label}
          </span>
          <span className="text-xs text-gray-500">{config.description}</span>
        </div>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 260,
          damping: 20 
        }}
        whileHover={{ 
          scale: 1.1,
          rotate: 5,
          transition: { duration: 0.2 }
        }}
      >
        {badge}
      </motion.div>
    )
  }

  return badge
}

// Utility function to calculate artist rank based on performance metrics
export const calculateArtistRank = (metrics: {
  totalBookings: number
  averageRating: number
  membershipMonths: number
  completionRate: number
}): RankTier => {
  const { totalBookings, averageRating, membershipMonths, completionRate } = metrics
  
  // Calculate score (0-100)
  const bookingsScore = Math.min((totalBookings / 100) * 30, 30) // Max 30 points
  const ratingScore = (averageRating / 5) * 30 // Max 30 points
  const experienceScore = Math.min((membershipMonths / 24) * 20, 20) // Max 20 points
  const completionScore = (completionRate / 100) * 20 // Max 20 points
  
  const totalScore = bookingsScore + ratingScore + experienceScore + completionScore

  // Determine rank tier
  // Diamond/Superstar is on request only, not automatically assigned
  if (totalScore >= 80) return 'platinum' // Master
  if (totalScore >= 70) return 'gold' // Artist
  if (totalScore >= 55) return 'green' // Expert
  if (totalScore >= 25) return 'blue' // Skilled
  return 'red' // Rising - Starting rank for all artists
}

// Simple version for quick rank assignment based on rating and bookings
export const getQuickRank = (rating: number, bookings: number): RankTier => {
  // Diamond/Superstar is on request only, not automatically assigned
  if (rating >= 4.8 && bookings >= 30) return 'platinum'
  if (rating >= 4.6 && bookings >= 20) return 'gold'
  if (rating >= 4.4 && bookings >= 10) return 'green'
  if (rating >= 4.0 && bookings >= 2) return 'blue'
  return 'red' // Everyone starts as Rising (Red)
}

export default ArtistRank

