import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { CustomError } from '../middleware/errorHandler';

/**
 * "Continue with Google": the browser gets an ID token from Google's button
 * and sends it here. The token is only trusted once Google's signature, the
 * audience (our client id) and the expiry check out, and only for an address
 * Google itself has verified.
 */

let client: OAuth2Client | undefined;

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleIdentity> {
  if (!config.googleClientId) {
    throw new CustomError('La connexion avec Google n’est pas disponible.', 503, { code: 'GOOGLE_DISABLED' });
  }
  client ??= new OAuth2Client(config.googleClientId);

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new CustomError('La connexion avec Google a échoué. Réessayez.', 401, { code: 'GOOGLE_INVALID' });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new CustomError('Ce compte Google n’a pas d’adresse e-mail vérifiée.', 401, { code: 'GOOGLE_UNVERIFIED' });
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name ?? '',
    givenName: payload.given_name ?? '',
    familyName: payload.family_name ?? '',
  };
}
