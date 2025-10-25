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
    transparent: '/logo-1-final.png',
    final: '/logo-1-final.png',
    test: '/logo-1-final.png'
  },
  icons: {
    compass: '/compass-icon.svg',
    favicon: '/favicon.svg'
  }
}


// Cloudinary configuration
const cloudinaryConfig: AssetConfig = {
  logo: {
    // Use the working logo as the main transparent logo
    transparent: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/logo_1_final_fcn3q5.png',
    final: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/logo_1_final_fcn3q5.png',
    test: 'https://res.cloudinary.com/desowqsmy/image/upload/v1761401364/logo_1_final_fcn3q5.png'
  },
  icons: {
    // Use a simple compass emoji as fallback for compass icon
    compass: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjQzlBNjNDIi8+Cjwvc3ZnPgo=',
    // Use a simple favicon as fallback
    favicon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzBCMUYzRiIvPgo8cGF0aCBkPSJNMTYgOEwxOCA5TDE2IDE2TDE0IDE1TDE2IDhaIiBmaWxsPSIjQzlBNjNDIi8+Cjwvc3ZnPgo='
  }
}

// Get the appropriate configuration based on environment
export const getAssetConfig = (): AssetConfig => {
  const environment = (import.meta as any).env?.MODE || 'development'
  const cdnProvider = (import.meta as any).env?.VITE_CDN_PROVIDER || 'local'
  
  console.log('Environment:', environment)
  console.log('CDN Provider:', cdnProvider)
  
  // In development, always use local assets
  if (environment === 'development') {
    console.log('Using development config')
    return developmentConfig
  }
  
  // In production, default to Cloudinary if no provider is specified
  console.log('Using production config with Cloudinary')
  return cloudinaryConfig
}

// Export the current configuration
export const assets = getAssetConfig()

// Helper function to get logo URL with fallback
export const getLogoUrl = (type: keyof AssetConfig['logo'] = 'transparent'): string => {
  const config = getAssetConfig()
  const url = config.logo[type] || config.logo.transparent
  console.log(`Getting logo URL for type '${type}':`, url)
  return url
}

// Helper function to get icon URL with fallback
export const getIconUrl = (type: keyof AssetConfig['icons']): string => {
  const config = getAssetConfig()
  return config.icons[type]
}
