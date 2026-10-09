import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { config } from '../config';

/**
 * Every signed token this server issues, and what each one is for.
 *
 * All of them are signed with the same secret, and the session check used to
 * accept any of them: it verified the signature, read `userId` and let the
 * caller in. So the link in a password-reset e-mail, or the confirmation link
 * sent at registration, was also a working session for that account. Each
 * token now carries `typ`, the session check accepts only `session`, and each
 * purpose-specific check accepts only its own.
 *
 * The algorithm is pinned on verify, so a token cannot choose how it is
 * checked.
 */

const ALGORITHM = 'HS256' as const;

export type TokenType = 'session' | 'email-verification' | 'password-reset';

interface BasePayload {
  typ: TokenType;
  userId: string;
  iat?: number;
  exp?: number;
}

export interface SessionPayload extends BasePayload {
  typ: 'session';
  role: string;
}

export interface PasswordResetPayload extends BasePayload {
  typ: 'password-reset';
  /** Fingerprint of the password hash the token was issued against: makes it single-use. */
  pwh: string;
}

export interface EmailVerificationPayload extends BasePayload {
  typ: 'email-verification';
  /** The address being confirmed, so a link for an old address cannot confirm a new one. */
  email: string;
}

type AnyPayload = SessionPayload | PasswordResetPayload | EmailVerificationPayload;

function sign(payload: { typ: TokenType; userId: string; [claim: string]: unknown }, expiresIn: string): string {
  return jwt.sign(payload, config.jwtSecret, { algorithm: ALGORITHM, expiresIn } as jwt.SignOptions);
}

/** Verifies the signature and the purpose. Throws jwt.JsonWebTokenError on any mismatch. */
function verify<T extends AnyPayload>(token: string, typ: TokenType): T {
  const decoded = jwt.verify(token, config.jwtSecret, { algorithms: [ALGORITHM] }) as AnyPayload;
  if (!decoded || typeof decoded !== 'object' || decoded.typ !== typ || typeof decoded.userId !== 'string') {
    throw new jwt.JsonWebTokenError(`expected a ${typ} token`);
  }
  return decoded as T;
}

export const passwordFingerprint = (passwordHash: string): string =>
  createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);

export const tokens = {
  session: {
    sign: (user: { id: string; role: string }) =>
      sign({ typ: 'session', userId: user.id, role: user.role }, config.jwtExpiresIn),
    verify: (token: string) => verify<SessionPayload>(token, 'session'),
  },
  passwordReset: {
    sign: (user: { id: string; passwordHash: string }) =>
      sign({ typ: 'password-reset', userId: user.id, pwh: passwordFingerprint(user.passwordHash) }, '1h'),
    verify: (token: string) => verify<PasswordResetPayload>(token, 'password-reset'),
  },
  emailVerification: {
    sign: (user: { id: string; email: string }) =>
      sign({ typ: 'email-verification', userId: user.id, email: user.email }, '48h'),
    verify: (token: string) => verify<EmailVerificationPayload>(token, 'email-verification'),
  },
};
