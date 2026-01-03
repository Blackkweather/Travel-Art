import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // For text variant
}

/**
 * Loading skeleton component for better UX during data fetching
 * Provides visual feedback that content is loading
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded';
      case 'card':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} mb-2 ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            style={index === 0 ? style : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
};

export default LoadingSkeleton;







