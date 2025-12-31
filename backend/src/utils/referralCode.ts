import { prisma } from '../db';

/**
 * Generate a referral code based on user's name
 * Format: {USERNAME-IN-UPPERCASE-WITHOUT-SPACES}-{RANDOM-ALPHANUMERIC-2OR3}
 * Examples: JOHNDOE-A32, SARAHALI-9B5, MARIALOPEZ-Z1A
 */
export function generateReferralCode(username: string): string {
  // Step 1: Take the account's full name
  let code = username;
  
  // Step 2: Remove all spaces and symbols, keep only alphanumeric
  code = code.replace(/[^a-zA-Z0-9]/g, '');
  
  // Step 3: Convert to UPPERCASE
  code = code.toUpperCase();
  
  // Step 4: Generate random alphanumeric suffix (2 or 3 characters)
  const suffixLength = Math.random() > 0.5 ? 2 : 3; // Randomly choose 2 or 3
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < suffixLength; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Step 5: Combine: username + hyphen + suffix
  return `${code}-${suffix}`;
}

/**
 * Generate a unique referral code, ensuring no collisions
 * Will regenerate if code already exists in database
 */
export async function generateUniqueReferralCode(username: string, maxAttempts: number = 10): Promise<string> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const code = generateReferralCode(username);
    
    // Check if code already exists
    const existing = await prisma.artist.findFirst({
      where: { referralCode: code }
    });
    
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  // If we still have collisions after max attempts, add timestamp
  const timestamp = Date.now().toString(36).substring(0, 3).toUpperCase();
  const baseCode = generateReferralCode(username).split('-')[0];
  return `${baseCode}-${timestamp}`;
}

/**
 * Create referral link in the format: https://www.travel-arts.com/ref/{REFERRAL-CODE}
 */
export function createReferralLink(referralCode: string, baseUrl?: string): string {
  const domain = baseUrl || 'https://www.travel-arts.com';
  return `${domain}/ref/${referralCode}`;
}

/**
 * Extract referral code from URL path
 * Handles formats like: /ref/CODE or /register?ref=CODE
 */
export function extractReferralCodeFromPath(path: string): string | null {
  // Try /ref/CODE format first
  const refMatch = path.match(/\/ref\/([A-Z0-9-]+)/i);
  if (refMatch) {
    return refMatch[1].toUpperCase();
  }
  
  // Try query parameter format: ?ref=CODE
  const url = new URL(path, 'http://dummy.com'); // Dummy base for parsing
  const refParam = url.searchParams.get('ref');
  if (refParam) {
    return refParam.toUpperCase();
  }
  
  return null;
}























