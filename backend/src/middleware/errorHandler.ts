import { Request, Response, NextFunction } from 'express';
import { fieldErrors } from '../shared/validation';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  /** Per-field messages, keyed by the form's field names, for the client to place under each field. */
  fields?: Record<string, string>;
  /** A short machine-readable reason the client can branch on (e.g. EMAIL_NOT_VERIFIED). */
  code?: string;

  constructor(message: string, statusCode: number = 500, extra: { fields?: Record<string, string>; code?: string } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.fields = extra.fields;
    this.code = extra.code;
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
  let fields: Record<string, string> | undefined = (error as any)?.fields;
  // Only our own errors carry a code meant for the client; a Node or Prisma
  // error's `code` (ECONNREFUSED, P1001) is internal.
  const code: string | undefined = error instanceof CustomError ? error.code : undefined;

  /* --- Validation ---------------------------------------------------------
     A ZodError has no statusCode, so it inherited the 500 default. Bad input
     is the client's problem, not a server fault, and reporting it as 500 means
     a real outage is indistinguishable from a mistyped form. */
  if (name === 'ZodError') {
    statusCode = 400;
    // Every field's own message, so the form can show each one where it
    // belongs; the headline is the first of them.
    fields = fieldErrors(error as any);
    const first = Object.values(fields)[0];
    message = first ? first : 'Données invalides.';
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
  // A 5xx never shows the client what went wrong inside.
  if (statusCode >= 500 && !(error as any)?.isOperational) {
    message = 'Une erreur interne est survenue. Réessayez dans un instant.';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: message || 'Internal Server Error',
      ...(fields && Object.keys(fields).length ? { fields } : {}),
      ...(code ? { code } : {}),
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

