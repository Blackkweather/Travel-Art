import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  // Express identifies an error handler by its arity: a four-argument function
  // is an error handler, a three-argument one is ordinary middleware. The
  // parameter is unused but must stay, or every error in the app would fall
  // through to the default handler. Underscore-prefixed so lint accepts it.
  _next: NextFunction
): void => {
  const { statusCode = 500, message } = error;

  // Always log errors for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ...(error as any).name && { name: (error as any).name }
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

