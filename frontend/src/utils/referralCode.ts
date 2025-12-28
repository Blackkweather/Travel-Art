/**
 * Create referral link in the format: https://www.travel-arts.com/ref/{REFERRAL-CODE}
 */
export function createReferralLink(referralCode: string, baseUrl?: string): string {
  const domain = baseUrl || window.location.origin
  return `${domain}/ref/${referralCode}`
}

/**
 * Extract referral code from URL path or query params
 */
export function extractReferralCodeFromUrl(): string | null {
  // Check URL path first (e.g., /ref/CODE)
  const pathMatch = window.location.pathname.match(/\/ref\/([A-Z0-9-]+)/i)
  if (pathMatch) {
    return pathMatch[1].toUpperCase()
  }
  
  // Check query parameter (e.g., ?ref=CODE)
  const params = new URLSearchParams(window.location.search)
  const refParam = params.get('ref')
  if (refParam) {
    return refParam.toUpperCase()
  }
  
  // Check sessionStorage as fallback
  const storedCode = sessionStorage.getItem('referralCode')
  if (storedCode) {
    return storedCode.toUpperCase()
  }
  
  return null
}















