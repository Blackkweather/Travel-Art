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
  let { statusCode = 500, message } = error;
  const name = (error as any)?.name;

  /* --- Validation ---------------------------------------------------------
     A ZodError has no statusCode, so it inherited the 500 default. Bad input
     is the client's problem, not a server fault, and reporting it as 500 means
     a real outage is indistinguishable from a mistyped form. */
  if (name === 'ZodError') {
    statusCode = 400;
    const issues = (error as any).issues ?? [];
    // One readable sentence naming the fields, rather than the raw issue array.
    const fields = issues
      .map((i: any) => (Array.isArray(i.path) ? i.path.join('.') : String(i.path ?? '')))
      .filter(Boolean);
    message = fields.length
      ? `Données invalides : ${[...new Set(fields)].join(', ')}`
      : 'Données invalides.';
  }

  /* --- Prisma -------------------------------------------------------------
     The three failures that are routinely the caller's doing rather than a
     fault. Everything else keeps the 500 it deserves. */
  if (name === 'PrismaClientKnownRequestError') {
    const code = (error as any).code;
    if (code === 'P2002') {
      statusCode = 409;
      message = 'Cette valeur est déjà utilisée.';
    } else if (code === 'P2025') {
      statusCode = 404;
      message = 'Ressource introuvable.';
    } else if (code === 'P2003') {
      statusCode = 400;
      message = 'Référence invalide.';
    }
  }

  // A 4xx is the caller's mistake and is noise at error level; a 5xx is ours.
  const log = statusCode >= 500 ? console.error : console.warn;
  log('Error:', {
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

export const asyncHandler = <ReqType extends Request = Request>(
  fn: (req: ReqType, res: Response, next: NextFunction) => Promise<unknown> | unknown
) => {
  return (req: ReqType, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

