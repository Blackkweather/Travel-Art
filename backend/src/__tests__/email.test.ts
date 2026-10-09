/**
 * With SMTP settings present, e-mail goes out over SMTP (Gmail during the
 * vercel.app phase) instead of Resend. The transport is stubbed: nothing
 * leaves this machine.
 */
const sendMail = jest.fn(async () => ({ messageId: '<test@local>' }));
jest.mock('nodemailer', () => ({ __esModule: true, default: { createTransport: jest.fn(() => ({ sendMail })) } }));

process.env.SMTP_HOST = 'smtp.gmail.com';
process.env.SMTP_PORT = '465';
process.env.SMTP_USER = 'travelart.test@gmail.com';
process.env.SMTP_PASS = 'app-password-for-tests';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const email = require('../services/email') as typeof import('../services/email');

describe('sending over SMTP', () => {
  beforeEach(() => sendMail.mockClear());

  it('sends the password reset through the mailbox, from Travel Art', async () => {
    const result = await email.passwordResetEmail('someone@example.com', 'Salma', 'https://travel-art.vercel.app/reset-password?token=x');
    expect(result.sent).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = (sendMail.mock.calls[0] as any[])[0];
    expect(mail.to).toBe('someone@example.com');
    expect(mail.from).toBe('Travel Art <travelart.test@gmail.com>');
    expect(mail.html).toContain('reset-password?token=x');
    expect(mail.text).toContain('reset-password?token=x');
  });

  it('sends the e-mail confirmation the same way', async () => {
    const result = await email.verificationEmail('new@example.com', 'Karim', 'https://travel-art.vercel.app/verify-email?token=y');
    expect(result.sent).toBe(true);
    expect((sendMail.mock.calls[0] as any[])[0].html).toContain('verify-email?token=y');
  });

  it('reports a provider failure without throwing', async () => {
    sendMail.mockRejectedValueOnce(Object.assign(new Error('Invalid login'), { response: '535 Username and Password not accepted' }) as never);
    const result = await email.verificationEmail('new@example.com', 'Karim', 'https://x');
    expect(result).toEqual({ sent: false, error: 'Invalid login' });
  });

  it('counts as configured', () => {
    expect(email.emailIsConfigured).toBe(true);
  });
});
