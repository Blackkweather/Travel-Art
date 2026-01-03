import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing requests
 */

// Store CSRF tokens in memory (in production, use Redis or similar)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a CSRF token for a session
 */
export const generateCsrfToken = (sessionId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiry
  
  csrfTokens.set(sessionId, { token, expiresAt });
  
  return token;
};

/**
 * Validate CSRF token
 */
export const validateCsrfToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) {
    return false;
  }
  
  if (stored.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
};

/**
 * CSRF protection middleware
 * Only applies to state-changing HTTP methods (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints (they use their own auth)
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }

  // Get session ID from request (could be from cookie, header, or JWT)
  const sessionId = req.headers['x-session-id'] as string || 
                    (req as any).session?.id || 
                    req.headers.authorization?.replace('Bearer ', '').substring(0, 16);

  if (!sessionId) {
    res.status(403).json({
      success: false,
      error: { message: 'CSRF protection: Session ID required' }
    });
    return;
  }

  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'] as string;

  if (!csrfToken) {
    res.status(403).json({
      success: false,
      error: { message: 'CSRF protection: Token required' }
    });
    return;
  }

  // Validate token
  if (!validateCsrfToken(sessionId, csrfToken)) {
    res.status(403).json({
      success: false,
      error: { message: 'CSRF protection: Invalid token' }
    });
    return;
  }

  next();
};

/**
 * Endpoint to get CSRF token
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  const sessionId = req.headers['x-session-id'] as string || 
                    (req as any).session?.id || 
                    crypto.randomBytes(16).toString('hex');

  const token = generateCsrfToken(sessionId);

  res.json({
    success: true,
    data: { csrfToken: token, sessionId }
  });
};







