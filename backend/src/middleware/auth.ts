import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@clerk/backend';
import { config } from '../config';
import { CustomError } from './errorHandler';

const prisma = new PrismaClient();

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

    // Try Clerk authentication first if configured
    if (config.clerkSecretKey) {
      try {
        // Verify Clerk session token using verifyToken function
        // verifyToken expects the token and secretKey option
        const sessionClaims = await verifyToken(token, {
          secretKey: config.clerkSecretKey
        });
        
        if (sessionClaims && typeof sessionClaims === 'object' && 'sub' in sessionClaims) {
          // Find user by Clerk ID (sub is the user ID in Clerk)
          const user = await prisma.user.findFirst({
            where: { 
              clerkId: sessionClaims.sub as string,
              isActive: true
            },
            select: { id: true, role: true, email: true, isActive: true }
          });

          if (user) {
            req.user = user;
            return next();
          }
        }
      } catch (clerkError: any) {
        // If Clerk verification fails, try JWT (backward compatibility)
        // Only log if it's not a token format error (expected for JWT tokens)
        if (!clerkError?.message?.includes('Invalid') && !clerkError?.message?.includes('token')) {
          console.log('Clerk verification failed, trying JWT:', clerkError.message);
        }
      }
    }

    // Fallback to JWT authentication
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, email: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new CustomError('Invalid token or user not found.', 401);
      }

      req.user = user;
      next();
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
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

