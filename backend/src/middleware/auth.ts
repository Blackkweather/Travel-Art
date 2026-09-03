import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db';
import { requestContext } from '../rlsContext';
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

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Access denied. No token provided.', 401);
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          role: true,
          email: true,
          isActive: true,
          approvalStatus: true,
          sessionsValidFrom: true
        }
      });

      if (!user || !user.isActive) {
        throw new CustomError('Invalid token or user not found.', 401);
      }

      // An account admitted and then rejected must lose access immediately,
      // not when its token happens to expire.
      if (user.approvalStatus !== 'APPROVED') {
        throw new CustomError('Ce compte n’est pas actif.', 403);
      }

      // Revocation. `iat` is seconds since the epoch; the cutoff is a Date.
      // Tokens minted before the cutoff are refused, which is how a password
      // change, a suspension or a sign-out-everywhere takes effect at once
      // without a denylist to consult.
      if (user.sessionsValidFrom && typeof decoded.iat === 'number') {
        const issuedAt = decoded.iat * 1000;
        // One second of slack: `iat` is truncated to whole seconds, so a token
        // minted in the same second as the cutoff would otherwise be rejected
        // the instant it was created - which is what happens to the new token
        // issued by a password reset.
        if (issuedAt + 1000 < user.sessionsValidFrom.getTime()) {
          throw new CustomError('Session expirée. Reconnectez-vous.', 401);
        }
      }

      req.user = user;

      // Everything downstream runs inside this store, so queries against the
      // RLS-protected tables can stamp the caller's identity onto the
      // transaction without any route having to remember to pass it.
      requestContext.run({ userId: user.id, role: user.role }, () => next());
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        next(new CustomError('Invalid token.', 401));
      } else {
        next(jwtError);
      }
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new CustomError('Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new CustomError('Insufficient permissions.', 403);
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, isActive: true }
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

