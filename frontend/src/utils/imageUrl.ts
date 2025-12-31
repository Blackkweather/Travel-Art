/**
 * Normalizes image URLs from the API
 * If the URL is relative, prepends the appropriate base URL
 * Upload paths (/uploads) are served directly, not through /api
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

  // Check if this is an upload path (served at /uploads, not /api/uploads)
  // In development, Vite proxy handles /uploads -> localhost:4000/uploads
  // In production, uploads are served from same origin
  if (url.startsWith('/uploads')) {
    // Use relative path - Vite proxy (dev) or same origin (prod) will handle it
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



















