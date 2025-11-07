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
const logoFinalOverride = import.meta.env.VITE_LOGO_FINAL_URL
const logoTransparentOverride = import.meta.env.VITE_LOGO_TRANSPARENT_URL

// Cloudinary URLs (fallback if local assets fail)
const cloudinaryBaseUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${cloudinaryVersion}`

// Respect app base URL so assets load under sub-path deployments (e.g., MAMP subfolders)
// In development, Vite serves public assets from root '/'
// In production, we respect BASE_URL for sub-path deployments
const baseUrl = import.meta.env.BASE_URL || '/'
const withBase = (p: string) => {
  // Remove leading slash from path if present
  const cleanPath = p.replace(/^\//, '')
  // If baseUrl is just '/', use simple root path for Vite dev server
  if (baseUrl === '/' || baseUrl === '') {
    return `/${cleanPath}`
  }
  // Otherwise, combine baseUrl with path
  const cleanBase = baseUrl.replace(/\/$/, '')
  return `${cleanBase}/${cleanPath}`
}

// Asset configuration with CDN fallback support
const assetConfig: AssetConfig = {
  logo: {
    transparent: logoTransparentOverride 
      || (useCloudinary && isProduction 
        ? `${cloudinaryBaseUrl}/logo_1_final_fcn3q5.png`
        : withBase('logo-transparent.png')),
    final: logoFinalOverride 
      || (useCloudinary && isProduction
        ? `${cloudinaryBaseUrl}/logo_1_final_fcn3q5.png`
        : withBase('logo-1-final.png')),
    test: withBase('test-logo.png')
  },
  icons: {
    compass: withBase('compass-icon.svg'),
    favicon: withBase('favicon.svg')
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
