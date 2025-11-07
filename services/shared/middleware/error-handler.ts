// Shared error handling middleware

import { Request, Response, NextFunction } from 'express';
import { AppError, handleError } from '../utils/errors';
import { Logger } from '../utils/logger';

const logger = new Logger('ErrorHandler');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred', err, {
    path: req.path,
    method: req.method,
    body: req.body
  });

  const { statusCode, message } = handleError(err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

























