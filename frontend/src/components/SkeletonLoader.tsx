import React from 'react'

interface SkeletonLoaderProps {
  className?: string
  count?: number
  variant?: 'card' | 'text' | 'avatar' | 'button' | 'list'
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '', 
  count = 1,
  variant = 'text'
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'

  const variants = {
    card: 'h-64 w-full',
    text: 'h-4 w-full',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded',
    list: 'h-16 w-full'
  }

  const classes = `${baseClasses} ${variants[variant]} ${className}`

  if (count === 1) {
    return <div className={classes} aria-hidden="true" />
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={classes} aria-hidden="true" />
      ))}
    </>
  )
}

export const SkeletonCard: React.FC = () => (
  <div className="card-luxury animate-pulse">
    <div className="h-48 bg-gray-200 rounded-lg mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-full" />
    </div>
  </div>
)

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card-luxury animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export default SkeletonLoader








