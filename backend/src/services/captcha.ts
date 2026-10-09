import { config } from '../config';

/**
 * Cloudflare Turnstile verification for the registration form.
 *
 * Without TURNSTILE_SECRET_KEY the check is skipped - development, tests, and
 * any deployment that has not set up the widget yet. The other defences
 * (database-backed rate limits, e-mail and duplicate checks, admin review)
 * still apply; the captcha is the layer that stops a script from reaching
 * them at volume.
 *
 * With the secret set, a token passes only if Cloudflare says it is valid AND
 * it was issued for this form (`action`) on one of our own sites
 * (`hostname`): a token solved on someone else's page that embeds our public
 * site key is refused. Tokens are single-use; Cloudflare rejects a replay.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 2048;

export const CAPTCHA_ACTIONS = { register: 'register' } as const;
export type CaptchaAction = (typeof CAPTCHA_ACTIONS)[keyof typeof CAPTCHA_ACTIONS];

export const captchaRequired = (): boolean => Boolean(config.turnstileSecretKey);

/** 1x… always passes, 2x… always fails, 3x… reports a spent token. */
const isTestSecret = (secret: string) => /^[123]x0{30,}AA$/.test(secret);

interface SiteverifyResponse {
  success?: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyCaptcha(
  token: unknown,
  ip: string | undefined,
  action: CaptchaAction = CAPTCHA_ACTIONS.register
): Promise<boolean> {
  if (!captchaRequired()) return true;

  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return false;

  // Fail closed: with no allowlist there is no way to tell our pages from
  // anyone else's.
  const hostnames = config.turnstileHostnames;
  if (hostnames.length === 0) {
    console.error('TURNSTILE_HOSTNAMES is empty: refusing captcha tokens until it lists the site hostnames.');
    return false;
  }

  let result: SiteverifyResponse;
  try {
    const body = new URLSearchParams({ secret: config.turnstileSecretKey!, response: token });
    if (ip) body.set('remoteip', ip);
    const response = await fetch(SITEVERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(10_000) });
    result = (await response.json()) as SiteverifyResponse;
  } catch (error: any) {
    // Cloudflare unreachable: refuse rather than wave a bot through. The form
    // tells the person to try again.
    console.error('captcha verification unavailable:', error?.name ?? 'error');
    return false;
  }

  if (result.success !== true) {
    console.warn('captcha refused:', (result['error-codes'] ?? []).join(',') || 'unknown');
    return false;
  }
  // Cloudflare's published test secrets answer "success" for any token and
  // carry no action or real hostname. They exist for automated tests; in
  // production they would wave everything through, so there they fail.
  if (isTestSecret(config.turnstileSecretKey!)) {
    if (process.env.NODE_ENV === 'production') {
      console.error('TURNSTILE_SECRET_KEY is a Cloudflare test secret: refusing captcha tokens in production.');
      return false;
    }
    return true;
  }
  if (result.action !== action) {
    console.warn('captcha refused: action mismatch', result.action);
    return false;
  }
  if (!result.hostname || !hostnames.includes(result.hostname.toLowerCase())) {
    console.warn('captcha refused: hostname not allowed', result.hostname);
    return false;
  }
  return true;
}
