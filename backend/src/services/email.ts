/**
 * Transactional email, over Resend.
 *
 * Three things this module is deliberate about.
 *
 * IT DEGRADES INSTEAD OF THROWING. If RESEND_API_KEY is absent the send is
 * skipped and logged, and the caller still succeeds. Registration and password
 * reset must not fail because a mail provider is unconfigured or having a bad
 * afternoon - the account is created either way, and an admin can always
 * resend. Every call therefore returns a result object rather than throwing.
 *
 * IT NEVER LOGS THE LINK IN PRODUCTION. A reset URL is a bearer credential for
 * the account; anyone with log access could use it. In development the link is
 * printed, because there is no inbox to check.
 *
 * THE TEMPLATES ARE INLINE AND PLAIN. Email clients strip <style> blocks,
 * ignore most CSS, and Gmail clips at ~102KB. Everything here is table-free,
 * inline-styled, and built to read as text if the styles are dropped entirely.
 */
import { Resend } from 'resend';
import { config } from '../config';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

/** Resend's sandbox sender works with no domain set up; a real domain overrides it. */
const FROM = process.env.RESEND_FROM || 'Travel Art <onboarding@resend.dev>';

const isProd = process.env.NODE_ENV === 'production';

export interface SendResult {
  sent: boolean;
  skipped?: 'no-api-key';
  id?: string;
  error?: string;
}

interface Template {
  subject: string;
  heading: string;
  /** Paragraphs of body copy, rendered in order. */
  body: string[];
  action?: { label: string; url: string };
  /** Small print under the rule. */
  footnote?: string;
}

const NAVY = '#0B1F3F';
const GOLD = '#B99851';
const SAND = '#F6EFE7';
const MUTED = '#5A6478';

function render({ heading, body, action, footnote }: Template): string {
  const paragraphs = body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">${p}</p>`
    )
    .join('');

  const button = action
    ? `<p style="margin:28px 0;">
         <a href="${action.url}"
            style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;
                   padding:14px 28px;border-radius:3px;font-size:14px;font-weight:600;
                   letter-spacing:0.04em;text-transform:uppercase;">${action.label}</a>
       </p>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:${MUTED};">
         Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
         <span style="color:${NAVY};word-break:break-all;">${action.url}</span>
       </p>`
    : '';

  const small = footnote
    ? `<p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">${footnote}</p>`
    : '';

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${SAND};">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;
              font-family:Georgia,'Times New Roman',serif;">
    <div style="background:#ffffff;border:1px solid #E7E1D8;border-radius:3px;padding:40px 36px;">

      <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;
                  letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};margin-bottom:24px;">
        <span style="display:inline-block;width:6px;height:6px;background:${GOLD};
                     transform:rotate(45deg);margin-right:8px;"></span>Travel Art
      </div>

      <h1 style="margin:0 0 24px;font-size:26px;line-height:1.25;font-weight:700;color:${NAVY};">
        ${heading}
      </h1>

      <div style="font-family:Helvetica,Arial,sans-serif;">
        ${paragraphs}
        ${button}
      </div>

      <div style="height:1px;background:#E7E1D8;margin:32px 0 20px;"></div>
      <div style="font-family:Helvetica,Arial,sans-serif;">${small}</div>
    </div>

    <p style="margin:20px 0 0;text-align:center;font-family:Helvetica,Arial,sans-serif;
              font-size:12px;color:${MUTED};">
      Travel Art — résidences d’artistes en hôtellerie
    </p>
  </div>
</body></html>`;
}

/** Plain-text alternative. Sending HTML alone is a strong spam signal. */
function renderText({ heading, body, action, footnote }: Template): string {
  const strip = (s: string) => s.replace(/<[^>]+>/g, '');
  const parts = [heading, '', ...body.map(strip)];
  if (action) parts.push('', `${action.label}: ${action.url}`);
  if (footnote) parts.push('', strip(footnote));
  parts.push('', 'Travel Art — résidences d’artistes en hôtellerie');
  return parts.join('\n');
}

async function send(to: string, template: Template): Promise<SendResult> {
  if (!resend) {
    // Not an error: the app is expected to run without a mail provider.
    console.warn(
      `[email] RESEND_API_KEY not set — skipped "${template.subject}" to ${to}`
    );
    if (!isProd && template.action) {
      console.log(`[email] dev link: ${template.action.url}`);
    }
    return { sent: false, skipped: 'no-api-key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: template.subject,
      html: render(template),
      text: renderText(template),
    });

    if (error) {
      console.error(`[email] send failed to ${to}:`, error.message);
      return { sent: false, error: error.message };
    }

    console.log(`[email] sent "${template.subject}" to ${to} (${data?.id})`);
    return { sent: true, id: data?.id };
  } catch (err: any) {
    // A mail outage must never take down the request that triggered it.
    console.error(`[email] transport error to ${to}:`, err?.message);
    return { sent: false, error: err?.message ?? 'unknown transport error' };
  }
}

// ---------------------------------------------------------------- templates

export function verificationEmail(to: string, name: string, url: string) {
  return send(to, {
    subject: 'Confirmez votre adresse e-mail',
    heading: 'Confirmez votre adresse',
    body: [
      `Bonjour ${name},`,
      'Votre demande d’inscription au programme Travel Art a bien été reçue. Confirmez votre adresse e-mail pour que nous puissions l’examiner.',
    ],
    action: { label: 'Confirmer mon adresse', url },
    footnote:
      'Ce lien expire dans 24 heures. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.',
  });
}

export function passwordResetEmail(to: string, name: string, url: string) {
  return send(to, {
    subject: 'Réinitialiser votre mot de passe',
    heading: 'Réinitialiser votre mot de passe',
    body: [
      `Bonjour ${name},`,
      'Vous avez demandé à réinitialiser votre mot de passe. Choisissez-en un nouveau en suivant le lien ci-dessous.',
    ],
    action: { label: 'Choisir un nouveau mot de passe', url },
    footnote:
      'Ce lien expire dans une heure et ne peut servir qu’une fois. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.',
  });
}

export function approvedEmail(to: string, name: string, url: string) {
  return send(to, {
    subject: 'Votre compte Travel Art est ouvert',
    heading: 'Bienvenue dans le programme',
    body: [
      `Bonjour ${name},`,
      'Votre candidature a été acceptée. Votre compte est désormais actif et vous pouvez vous connecter.',
    ],
    action: { label: 'Accéder à mon espace', url },
  });
}

export function rejectedEmail(to: string, name: string, reason?: string) {
  return send(to, {
    subject: 'Votre candidature Travel Art',
    heading: 'Votre candidature n’a pas été retenue',
    body: [
      `Bonjour ${name},`,
      'Après examen, nous ne donnons pas suite à votre demande d’inscription pour le moment.',
      ...(reason ? [`<strong>Motif :</strong> ${reason}`] : []),
    ],
    footnote:
      'Vous pouvez répondre à ce message si vous souhaitez des précisions ou soumettre une nouvelle demande plus tard.',
  });
}

export const emailIsConfigured = Boolean(resend);
export { config };
