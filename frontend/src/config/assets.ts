// Asset configuration for different environments
export interface AssetConfig {
  logo: {
    transparent: string
    final: string
    test: string
  }
  icons: {
    compass: string
    favicon: string
  }
}

// Development configuration (local assets)
const developmentConfig: AssetConfig = {
  logo: {
    transparent: '/logo-transparent.png',
    final: '/logo-1-final.png',
    test: '/test-logo.png'
  },
  icons: {
    compass: '/compass-icon.svg',
    favicon: '/favicon.svg'
  }
}

// Production configuration (CDN assets)
const productionConfig: AssetConfig = {
  logo: {
    // Replace these URLs with your actual CDN URLs
    transparent: 'https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/logo-transparent.png',
    final: 'https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/logo-1-final.png',
    test: 'https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/test-logo.png'
  },
  icons: {
    compass: 'https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/compass-icon.svg',
    favicon: 'https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/favicon.svg'
  }
}

// Alternative CDN configurations (uncomment to use)

// Cloudflare R2 configuration
const cloudflareR2Config: AssetConfig = {
  logo: {
    transparent: 'https://your-bucket.your-account.r2.cloudflarestorage.com/logo-transparent.png',
    final: 'https://your-bucket.your-account.r2.cloudflarestorage.com/logo-1-final.png',
    test: 'https://your-bucket.your-account.r2.cloudflarestorage.com/test-logo.png'
  },
  icons: {
    compass: 'https://your-bucket.your-account.r2.cloudflarestorage.com/compass-icon.svg',
    favicon: 'https://your-bucket.your-account.r2.cloudflarestorage.com/favicon.svg'
  }
}

// AWS S3 configuration
const awsS3Config: AssetConfig = {
  logo: {
    transparent: 'https://your-bucket.s3.amazonaws.com/logo-transparent.png',
    final: 'https://your-bucket.s3.amazonaws.com/logo-1-final.png',
    test: 'https://your-bucket.s3.amazonaws.com/test-logo.png'
  },
  icons: {
    compass: 'https://your-bucket.s3.amazonaws.com/compass-icon.svg',
    favicon: 'https://your-bucket.s3.amazonaws.com/favicon.svg'
  }
}

// Vercel Blob configuration
const vercelBlobConfig: AssetConfig = {
  logo: {
    transparent: 'https://your-blob-store.vercel-storage.com/logo-transparent.png',
    final: 'https://your-blob-store.vercel-storage.com/logo-1-final.png',
    test: 'https://your-blob-store.vercel-storage.com/test-logo.png'
  },
  icons: {
    compass: 'https://your-blob-store.vercel-storage.com/compass-icon.svg',
    favicon: 'https://your-blob-store.vercel-storage.com/favicon.svg'
  }
}

// Cloudinary configuration
const cloudinaryConfig: AssetConfig = {
  logo: {
    transparent: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/logo-transparent.png',
    final: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/logo_1_final_fcn3q5.png',
    test: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/test-logo.png'
  },
  icons: {
    compass: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/compass-icon.svg',
    favicon: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/favicon.svg'
  }
}

// Get the appropriate configuration based on environment
export const getAssetConfig = (): AssetConfig => {
  const environment = (import.meta as any).env?.MODE || 'development'
  const cdnProvider = (import.meta as any).env?.VITE_CDN_PROVIDER || 'local'
  
  if (environment === 'development') {
    return developmentConfig
  }
  
  switch (cdnProvider) {
    case 'jsdelivr':
      return productionConfig
    case 'cloudflare':
      return cloudflareR2Config
    case 'aws':
      return awsS3Config
    case 'vercel':
      return vercelBlobConfig
    case 'cloudinary':
      return cloudinaryConfig
    default:
      return developmentConfig
  }
}

// Export the current configuration
export const assets = getAssetConfig()

// Helper function to get logo URL with fallback
export const getLogoUrl = (type: keyof AssetConfig['logo'] = 'transparent'): string => {
  const config = getAssetConfig()
  return config.logo[type] || config.logo.transparent
}

// Helper function to get icon URL with fallback
export const getIconUrl = (type: keyof AssetConfig['icons']): string => {
  const config = getAssetConfig()
  return config.icons[type]
}
