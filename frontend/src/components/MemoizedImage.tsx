import React, { memo } from 'react';
import OptimizedImage from './OptimizedImage';

interface MemoizedImageProps extends React.ComponentProps<typeof OptimizedImage> {
  src: string;
  alt: string;
}

/**
 * Memoized image component to prevent unnecessary re-renders
 */
const MemoizedImage = memo<MemoizedImageProps>(({ src, alt, ...props }) => {
  return <OptimizedImage src={src} alt={alt} {...props} />;
}, (prevProps, nextProps) => {
  // Only re-render if src or alt changes
  return prevProps.src === nextProps.src && prevProps.alt === nextProps.alt;
});

MemoizedImage.displayName = 'MemoizedImage';

export default MemoizedImage;






