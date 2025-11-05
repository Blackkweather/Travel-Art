// Asset configuration - supports both local and CDN assets
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

// Determine if we should use CDN based on environment
const isProduction = import.meta.env.PROD
const useCloudinary = import.meta.env.VITE_USE_CLOUDINARY === 'true'
const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'desowqsmy'
const cloudinaryVersion = import.meta.env.VITE_CLOUDINARY_VERSION || 'v1761401364'

// Cloudinary URLs (fallback if local assets fail)
const cloudinaryBaseUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${cloudinaryVersion}`

// Asset configuration with CDN fallback support
const assetConfig: AssetConfig = {
  logo: {
    transparent: useCloudinary && isProduction 
      ? `${cloudinaryBaseUrl}/logo_1_final_fcn3q5.png`
      : '/logo-transparent.png',
    final: useCloudinary && isProduction
      ? `${cloudinaryBaseUrl}/logo_1_final_fcn3q5.png`
      : '/logo-1-final.png',
    test: '/test-logo.png'
  },
  icons: {
    compass: '/compass-icon.svg',
    favicon: '/favicon.svg'
  }
}

// Get the asset configuration
export const getAssetConfig = (): AssetConfig => {
  return assetConfig
}

// Export the current configuration
export const assets = getAssetConfig()

// Helper function to get logo URL with fallback
export const getLogoUrl = (type: keyof AssetConfig['logo'] = 'transparent'): string => {
  return assetConfig.logo[type] || assetConfig.logo.transparent
}

// Helper function to get icon URL with fallback
export const getIconUrl = (type: keyof AssetConfig['icons']): string => {
  return assetConfig.icons[type]
}
