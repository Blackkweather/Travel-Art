import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  // This is the Suspense fallback for every lazy route, so for a screen reader
  // it was previously an unannounced blank page. role="status" makes the wait
  // audible and the visually hidden label gives it something to announce.
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${className}`}
    >
      <motion.div
        aria-hidden="true"
        className={`${sizeClasses[size]} border-2 border-gold/30 border-t-gold rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export default LoadingSpinner