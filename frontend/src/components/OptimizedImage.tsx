import React, { useState, useRef, useEffect } from 'react';
import { normalizeImageUrl } from '@/utils/imageUrl';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lazy?: boolean;
  placeholder?: string;
  fallback?: string;
}

/**
 * Optimized image component with lazy loading and error handling
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  lazy = true,
  placeholder,
  fallback = '/placeholder-image.png',
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(placeholder || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const normalizedSrc = normalizeImageUrl(src);

  useEffect(() => {
    if (!lazy) {
      setImageSrc(normalizedSrc);
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(normalizedSrc);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [normalizedSrc, lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && placeholder && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={imageSrc || normalizedSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${hasError ? 'object-contain' : 'object-cover'} ${className}`}
        {...props}
      />
      {hasError && !imageSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-gray-400 text-sm">Image not available</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;







