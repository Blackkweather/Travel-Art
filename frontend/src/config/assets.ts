// Asset configuration - simplified to always use local assets
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

// Simple configuration using local assets (works in both dev and production)
const assetConfig: AssetConfig = {
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

// Get the asset configuration - always use local assets
export const getAssetConfig = (): AssetConfig => {
  console.log('Using local assets configuration')
  return assetConfig
}

// Export the current configuration
export const assets = getAssetConfig()

// Helper function to get logo URL with fallback
export const getLogoUrl = (type: keyof AssetConfig['logo'] = 'transparent'): string => {
  const url = assetConfig.logo[type] || assetConfig.logo.transparent
  console.log(`Getting logo URL for type '${type}':`, url)
  return url
}

// Helper function to get icon URL with fallback
export const getIconUrl = (type: keyof AssetConfig['icons']): string => {
  return assetConfig.icons[type]
}
