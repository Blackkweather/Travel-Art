/**
 * The captcha gate, with Cloudflare's siteverify replaced by a stub so the
 * suite stays offline. Each case is a way a token must be refused.
 */
process.env.TURNSTILE_SECRET_KEY = 'test-secret';
process.env.TURNSTILE_HOSTNAMES = 'travel-art.vercel.app, www.travelart.com';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyCaptcha } = require('../services/captcha') as typeof import('../services/captcha');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('../config') as typeof import('../config');

const realFetch = global.fetch;
let reply: Record<string, unknown> | Error;
let sent: URLSearchParams | undefined;

beforeEach(() => {
  sent = undefined;
  global.fetch = jest.fn(async (_url: any, init: any) => {
    sent = init.body;
    if (reply instanceof Error) throw reply;
    return { json: async () => reply } as Response;
  }) as any;
});
afterAll(() => {
  global.fetch = realFetch;
});

const good = { success: true, action: 'register', hostname: 'travel-art.vercel.app' };

describe('captcha verification', () => {
  it('accepts a valid token for this form on our site, sending secret, token and IP', async () => {
    reply = good;
    expect(await verifyCaptcha('tok', '1.2.3.4')).toBe(true);
    expect(sent!.get('secret')).toBe('test-secret');
    expect(sent!.get('response')).toBe('tok');
    expect(sent!.get('remoteip')).toBe('1.2.3.4');
  });

  it('refuses a missing, non-string or oversized token without calling Cloudflare', async () => {
    reply = good;
    for (const token of [undefined, null, '', 42, 'x'.repeat(2049)]) {
      expect(await verifyCaptcha(token, undefined)).toBe(false);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses what Cloudflare refuses (bad or replayed token)', async () => {
    reply = { success: false, 'error-codes': ['timeout-or-duplicate'] };
    expect(await verifyCaptcha('tok', undefined)).toBe(false);
  });

  it('refuses a token issued for another form', async () => {
    reply = { ...good, action: 'login' };
    expect(await verifyCaptcha('tok', undefined)).toBe(false);
  });

  it('refuses a token solved on a site that is not ours', async () => {
    reply = { ...good, hostname: 'evil.example' };
    expect(await verifyCaptcha('tok', undefined)).toBe(false);
  });

  it('fails closed when Cloudflare cannot be reached', async () => {
    reply = new Error('network down');
    expect(await verifyCaptcha('tok', undefined)).toBe(false);
  });

  it('accepts Cloudflare’s test secret outside production only', async () => {
    reply = { success: true }; // the test secret's answer: no action, no real hostname
    const saved = config.turnstileSecretKey;
    (config as any).turnstileSecretKey = '1x0000000000000000000000000000000AA';
    expect(await verifyCaptcha('tok', undefined)).toBe(true);
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(await verifyCaptcha('tok', undefined)).toBe(false);
    process.env.NODE_ENV = env;
    (config as any).turnstileSecretKey = saved;
  });

  it('fails closed when no hostnames are configured', async () => {
    reply = good;
    const saved = config.turnstileHostnames;
    (config as any).turnstileHostnames = [];
    expect(await verifyCaptcha('tok', undefined)).toBe(false);
    (config as any).turnstileHostnames = saved;
  });
});
