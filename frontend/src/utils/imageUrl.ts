/**
 * Normalizes image URLs from the API
 * If the URL is relative, prepends the API base URL
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

  // For relative paths, prepend API base URL
  const isProduction = (import.meta as any).env?.MODE === 'production'
  const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 
    (isProduction ? '' : 'http://localhost:4000')
  
  // Remove leading slash from URL if present (we'll add it back)
  const cleanUrl = url.replace(/^\//, '')
  
  // Remove trailing slash from apiBaseUrl if present
  const cleanBase = apiBaseUrl.replace(/\/$/, '')
  
  return `${cleanBase}/${cleanUrl}`
}















