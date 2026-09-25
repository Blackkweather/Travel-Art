/**
 * Normalizes image URLs from the API
 * If the URL is relative, prepends the appropriate base URL
 * Static paths (/uploads, /images) are served directly, not through /api
 * If it's already absolute, returns it as-is
 */
export const normalizeImageUrl = (url: string | null | undefined): string => {
  if (!url) {
    return ''
  }

  // If it's already an absolute URL (http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If it's a data URL, return as-is
  if (url.startsWith('data:')) {
    return url
  }

  // Paths served directly from the static site root, not through /api:
  // /uploads holds user-submitted photos, /images the bundled site assets
  // (seed data and placeholder artwork both point here). Both resolve via
  // the Vite proxy in development and same-origin in production - prefixing
  // either with /api asks the backend for a route it does not have.
  if (url.startsWith('/uploads') || url.startsWith('/images')) {
    return url
  }

  // For other relative paths (API responses), prepend API base URL
  const isProduction = (import.meta as any).env?.MODE === 'production'
  const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 
    (isProduction ? '/api' : '/api')
  
  // Remove leading slash from URL if present (we'll add it back)
  const cleanUrl = url.replace(/^\//, '')
  
  // Remove trailing slash from apiBaseUrl if present
  const cleanBase = apiBaseUrl.replace(/\/$/, '')
  
  return `${cleanBase}/${cleanUrl}`
}



















