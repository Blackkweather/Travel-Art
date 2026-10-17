import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { requestContext } from '../rlsContext';
import { tokens } from '../services/tokens';
import { CustomError } from './errorHandler';

export interface AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

function bearer(req: Request): string | undefined {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim() || undefined;
}

/**
 * Resolve a session token to a user who may act right now, or say why not.
 *
 * Shared by `authenticate` and `optionalAuth` so the two can never disagree:
 * optionalAuth used to skip the approval and revocation checks, so a rejected
 * or signed-out-everywhere token still counted as signed in on the routes
 * that use it.
 */
async function resolveSession(token: string, allowIncomplete = false) {
  let payload;
  try {
    payload = tokens.session.verify(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new CustomError('Session expirée. Reconnectez-vous.', 401, { code: 'SESSION_EXPIRED' });
    }
    throw new CustomError('Session invalide. Reconnectez-vous.', 401, { code: 'SESSION_INVALID' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, email: true, isActive: true, approvalStatus: true, sessionsValidFrom: true },
  });

  if (!user || !user.isActive) {
    throw new CustomError('Ce compte n’est pas actif.', 401, { code: 'ACCOUNT_INACTIVE' });
  }

  // An account admitted and then rejected loses access immediately, not when
  // its token happens to expire. An INCOMPLETE account (opened with Google,
  // no profile yet) passes only where the route asked for it.
  const admitted = user.approvalStatus === 'APPROVED' || (allowIncomplete && user.approvalStatus === 'INCOMPLETE');
  if (!admitted) {
    throw new CustomError('Ce compte n’est pas actif.', 401, { code: 'ACCOUNT_INACTIVE' });
  }

  // Revocation: tokens minted before the cutoff are refused. One second of
  // slack because `iat` is truncated to whole seconds.
  if (user.sessionsValidFrom && typeof payload.iat === 'number') {
    if (payload.iat * 1000 + 1000 < user.sessionsValidFrom.getTime()) {
      throw new CustomError('Session expirée. Reconnectez-vous.', 401, { code: 'SESSION_REVOKED' });
    }
  }

  return { id: user.id, role: user.role, email: user.email };
}

const authenticateWith = (allowIncomplete: boolean) =>
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = bearer(req);
      if (!token) {
        throw new CustomError('Connectez-vous pour continuer.', 401, { code: 'SESSION_MISSING' });
      }
      req.user = await resolveSession(token, allowIncomplete);
      // Everything downstream runs inside this store, so queries against the
      // RLS-protected tables carry the caller's identity automatically.
      requestContext.run({ userId: req.user.id, role: req.user.role }, () => next());
    } catch (error) {
      next(error);
    }
  };

/** An admitted account. Every route but the few below uses this. */
export const authenticate = authenticateWith(false);

/**
 * Also lets in an INCOMPLETE account, for the routes it needs to finish its
 * profile (who am I, keep my session, submit the profile) and nothing else.
 */
export const authenticateApplicant = authenticateWith(true);

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new CustomError('Connectez-vous pour continuer.', 401, { code: 'SESSION_MISSING' }));
    }
    if (!roles.includes(req.user.role)) {
      return next(new CustomError('Accès refusé.', 403));
    }
    next();
  };
};

/** Signed in if the token is good; anonymous (never an error) otherwise. */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const token = bearer(req);
  if (!token) return next();
  try {
    req.user = await resolveSession(token);
    requestContext.run({ userId: req.user.id, role: req.user.role }, () => next());
  } catch {
    next();
  }
};
