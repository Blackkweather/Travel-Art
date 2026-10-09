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
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';

/*
 * Two ways out, in this order:
 *
 *   SMTP (SMTP_HOST + SMTP_USER + SMTP_PASS) - a mailbox such as Gmail with an
 *   app password. Delivers to anyone without owning a domain, which is what
 *   the site needs while it runs on travel-art.vercel.app: Resend refuses
 *   every recipient but its own account owner until a domain is verified.
 *
 *   Resend (RESEND_API_KEY) - once the site has its own domain.
 *
 * Neither set: sends are skipped and logged, as before.
 */
const smtp: Transporter | null =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

const apiKey = process.env.RESEND_API_KEY;
const resend = !smtp && apiKey ? new Resend(apiKey) : null;

/** Resend's sandbox sender works with no domain set up; a real domain overrides it. */
const FROM = smtp
  ? process.env.SMTP_FROM || `Travel Art <${process.env.SMTP_USER}>`
  : process.env.RESEND_FROM || 'Travel Art <onboarding@resend.dev>';

/** Where a new-registration alert goes. Unset means no one is notified. */
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL;

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
  attachments?: { filename: string; content: Buffer }[];
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
  if (smtp) {
    try {
      const info = await smtp.sendMail({
        from: FROM,
        to,
        subject: template.subject,
        html: render(template),
        text: renderText(template),
        attachments: template.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
      });
      console.log(`[email] sent "${template.subject}" to ${to} via SMTP (${info.messageId})`);
      return { sent: true, id: info.messageId };
    } catch (err: any) {
      // The provider's own words (bad app password, daily limit) - never the password.
      console.error(`[email] SMTP send failed to ${to}:`, err?.response || err?.message);
      return { sent: false, error: err?.message ?? 'smtp error' };
    }
  }

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
      ...(template.attachments?.length ? { attachments: template.attachments } : {}),
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

/**
 * Names, reasons and hotel names are typed by users and rendered into HTML.
 * Escaped at every interpolation into a body line, so "<a href=...>" in a
 * hotel name arrives in the inbox as text, not as a link.
 */
const esc = (value: string | null | undefined): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function verificationEmail(to: string, name: string, url: string) {
  return send(to, {
    subject: 'Confirmez votre adresse e-mail',
    heading: 'Confirmez votre adresse',
    body: [
      `Bonjour ${esc(name)},`,
      'Votre demande d’inscription au programme Travel Art a bien été reçue. Confirmez votre adresse e-mail pour que nous puissions l’examiner.',
    ],
    action: { label: 'Confirmer mon adresse', url },
    footnote:
      'Ce lien expire dans 48 heures. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.',
  });
}

export function passwordResetEmail(to: string, name: string, url: string) {
  return send(to, {
    subject: 'Réinitialiser votre mot de passe',
    heading: 'Réinitialiser votre mot de passe',
    body: [
      `Bonjour ${esc(name)},`,
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
      `Bonjour ${esc(name)},`,
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
      `Bonjour ${esc(name)},`,
      'Après examen, nous ne donnons pas suite à votre demande d’inscription pour le moment.',
      ...(reason ? [`<strong>Motif :</strong> ${esc(reason)}`] : []),
    ],
    footnote:
      'Vous pouvez répondre à ce message si vous souhaitez des précisions ou soumettre une nouvelle demande plus tard.',
  });
}

export function newRegistrationAdminAlert(applicant: {
  name: string;
  email: string;
  role: 'ARTIST' | 'HOTEL';
  country?: string | null;
}) {
  if (!ADMIN_NOTIFY_EMAIL) {
    // Same rule as everything else here: an unconfigured recipient skips
    // silently rather than failing the registration it is reporting on.
    console.warn('[email] ADMIN_NOTIFY_EMAIL not set — skipped new-registration alert');
    return Promise.resolve<SendResult>({ sent: false, skipped: 'no-api-key' });
  }
  const roleLabel = applicant.role === 'ARTIST' ? 'artiste' : 'hôtel';
  return send(ADMIN_NOTIFY_EMAIL, {
    subject: `Nouvelle candidature ${roleLabel} : ${applicant.name}`,
    heading: 'Nouvelle candidature à examiner',
    body: [
      `${esc(applicant.name)} (${esc(applicant.email)}) vient de s’inscrire en tant que ${roleLabel}${
        applicant.country ? ` — ${esc(applicant.country)}` : ''
      }.`,
      'Le compte reste en attente tant qu’il n’a pas été admis depuis la console d’administration.',
    ],
    action: { label: 'Ouvrir les admissions', url: `${config.frontendUrl}/dashboard/admissions` },
  });
}

/* ------------------------------------------------- booking lifecycle

   Until these existed, the whole booking flow was silent: a hotel asked an
   artist for a week and the artist only found out by opening the dashboard,
   which is not a thing a working musician does daily. Each of these is paired
   with an in-app notification in services/notifications.ts - the row is for
   whoever is looking, the mail is for everyone else.

   All four name the dates and the other party in the subject line, because
   these arrive among a hundred other messages and the decision they need is
   usually made from the subject alone. */

/** "du 12 au 19 janvier 2027" - one month named when both ends share it. */
export function formatStay(start: Date, end: Date): string {
  const day = (d: Date) => d.getUTCDate();
  const month = (d: Date) =>
    d.toLocaleDateString('fr-FR', { month: 'long', timeZone: 'UTC' });
  const year = (d: Date) => d.getUTCFullYear();

  if (year(start) === year(end) && month(start) === month(end)) {
    return `du ${day(start)} au ${day(end)} ${month(end)} ${year(end)}`;
  }
  if (year(start) === year(end)) {
    return `du ${day(start)} ${month(start)} au ${day(end)} ${month(end)} ${year(end)}`;
  }
  return `du ${day(start)} ${month(start)} ${year(start)} au ${day(end)} ${month(end)} ${year(end)}`;
}

/** To the artist: a house has asked for them. The one email that must land. */
export function bookingRequestedEmail(
  to: string,
  artistName: string,
  hotelName: string,
  stay: string,
  url: string
) {
  return send(to, {
    subject: `${hotelName} vous propose une résidence ${stay}`,
    heading: 'Une maison vous propose une résidence',
    body: [
      `Bonjour ${esc(artistName)},`,
      `<strong>${esc(hotelName)}</strong> souhaite vous accueillir en résidence ${stay}.`,
      'Le principe est celui du programme : un séjour pour vous et un accompagnant, en échange d’une prestation convenue à l’avance. Les dates, la chambre, la formule, la prestation et la prise en charge du transport sont écrits dans une convention signée avant votre départ.',
      'Rien n’est réservé tant que vous n’avez pas répondu. Regardez les dates, le lieu et ce que la maison fournit avant d’accepter.',
    ],
    action: { label: 'Voir la proposition', url },
    footnote:
      'Si les dates ne vous conviennent pas, refusez : un refus motivé n’a aucune conséquence sur votre profil.',
  });
}

/** To the hotel: the artist said yes. */
export function bookingConfirmedEmail(
  to: string,
  hotelName: string,
  artistName: string,
  stay: string,
  url: string
) {
  return send(to, {
    subject: `${artistName} accepte la résidence ${stay}`,
    heading: 'La résidence est confirmée',
    body: [
      `Bonjour ${esc(hotelName)},`,
      `<strong>${esc(artistName)}</strong> a accepté votre proposition ${stay}.`,
      'Il reste à signer la convention tripartite : elle reprend les conditions de votre demande — séjour pour deux, formule, prestation, transport, valeurs échangées — et les identités des parties. Relisez-la et signez-la depuis votre espace ; l’artiste fait de même de son côté.',
      'Tant que les deux signatures ne sont pas réunies, la convention n’est pas validée.',
    ],
    action: { label: 'Lire et signer la convention', url },
  });
}

/** To the hotel: the artist withdrew from a confirmed residency (article 13). */
export function bookingCancelledByArtistEmail(to: string, hotelName: string, artistName: string, stay: string, reason: string, signed: boolean, url: string) {
  return send(to, {
    subject: `${artistName} se désiste de la résidence ${stay}`,
    heading: 'L’artiste se désiste',
    body: [
      `Bonjour ${esc(hotelName)},`,
      `<strong>${esc(artistName)}</strong> ne pourra pas assurer la résidence prévue ${stay}. Vos crédits vous ont été restitués.`,
      `Motif indiqué : ${esc(reason)}`,
      signed
        ? 'La convention étant signée, son article 13 s’applique : si l’empêchement est injustifié, vous pouvez demander le remboursement des dépenses directement engagées et non récupérables, sur justificatifs. Répondez à ce message, nous faisons le lien.'
        : 'La convention n’était pas encore signée : aucun frais n’est en jeu.',
    ],
    action: { label: 'Trouver un autre artiste', url },
  });
}

/** To the participant, right after accepting: the convention is waiting for them too. */
export function conventionToSignEmail(to: string, artistName: string, hotelName: string, stay: string, url: string) {
  return send(to, {
    subject: `Convention à signer : ${hotelName}, ${stay}`,
    heading: 'Votre convention est prête',
    body: [
      `Bonjour ${esc(artistName)},`,
      `Vous avez accepté la résidence proposée par <strong>${esc(hotelName)}</strong> ${stay}. La convention tripartite qui l’encadre est prête : relisez-la et signez-la depuis votre espace.`,
      'Vous y indiquerez votre adresse et le numéro de votre pièce d’identité, qui n’apparaissent que dans la convention.',
    ],
    action: { label: 'Lire et signer la convention', url },
    footnote: 'N’achetez aucun billet avant que la convention soit signée par les deux parties.',
  });
}

/** To each party and the coordinator: both have signed; the PDF is attached. */
export function conventionSignedEmail(to: string, name: string, hotelName: string, artistName: string, stay: string, url: string, pdf: Buffer, reference: string) {
  return send(to, {
    subject: `Convention signée : ${hotelName} × ${artistName}, ${stay}`,
    heading: 'La convention est signée',
    body: [
      `Bonjour ${esc(name)},`,
      `La convention entre <strong>${esc(hotelName)}</strong> et <strong>${esc(artistName)}</strong> pour la résidence ${stay} est signée par toutes les parties. Elle est validée définitivement.`,
      'Vous la trouverez en pièce jointe, et à tout moment dans votre espace.',
    ],
    action: { label: 'Ouvrir la réservation', url },
    footnote: 'Conservez ce document : c’est lui qui fait foi entre les parties.',
    attachments: [{ filename: `convention-${reference}.pdf`, content: pdf }],
  });
}

/** To the hotel: it cancelled a signed convention; article 14 applies. */
export function cancellationFeeDueEmail(to: string, hotelName: string, artistName: string, stay: string, fee: string, dueDate: string, transportEligible: boolean, url: string) {
  return send(to, {
    subject: `Annulation de la résidence ${stay} : frais de dossier de ${fee}`,
    heading: 'Annulation après signature',
    body: [
      `Bonjour ${esc(hotelName)},`,
      `Vous avez annulé la résidence de <strong>${esc(artistName)}</strong> ${stay}, alors que la convention était signée.`,
      `Conformément à son article 14, des frais fixes de traitement de dossier de <strong>${fee}</strong> sont dus au Coordinateur, au plus tard le ${dueDate}.`,
      transportEligible
        ? 'L’artiste peut également vous demander le remboursement de ses frais de transport effectivement engagés et non remboursables, sur justificatifs. Vous serez prévenu s’il le fait ; le remboursement est dû sous 15 jours après sa demande complète.'
        : 'Le transport n’étant pas à la charge de l’artiste, aucun remboursement de transport n’est prévu.',
    ],
    action: { label: 'Régler les frais', url },
    footnote: 'Si l’annulation résulte d’un cas de force majeure, répondez à ce message avec les éléments qui l’établissent.',
  });
}

/** To the participant: the hotel cancelled after signature; they may claim their tickets. */
export function transportClaimInviteEmail(to: string, artistName: string, hotelName: string, stay: string, url: string) {
  return send(to, {
    subject: `Annulation de ${hotelName} : remboursement de votre transport`,
    heading: 'Vos frais de transport vous sont remboursés',
    body: [
      `Bonjour ${esc(artistName)},`,
      `<strong>${esc(hotelName)}</strong> a annulé la résidence ${stay} après la signature de la convention.`,
      'Si vous aviez engagé des frais de transport non remboursables, déposez votre demande avec vos justificatifs (billets, factures, preuve que le billet n’est pas remboursable). L’hôtel dispose de 15 jours pour vous rembourser à compter de votre demande complète.',
    ],
    action: { label: 'Demander le remboursement', url },
  });
}

/** To the hotel: the participant filed a transport claim. */
export function transportClaimSubmittedEmail(to: string, hotelName: string, artistName: string, amount: string, dueDate: string, url: string) {
  return send(to, {
    subject: `Demande de remboursement de transport : ${amount}`,
    heading: 'Une demande de remboursement vous attend',
    body: [
      `Bonjour ${esc(hotelName)},`,
      `<strong>${esc(artistName)}</strong> demande le remboursement de ses frais de transport non remboursables, pour <strong>${amount}</strong>, justificatifs à l’appui.`,
      `Le remboursement est dû au plus tard le ${dueDate}. Marquez-le comme effectué dans votre espace une fois le virement fait.`,
    ],
    action: { label: 'Voir la demande', url },
  });
}

/** To the participant: the hotel settled, or the coordinator ruled on, their claim. */
export function transportClaimSettledEmail(to: string, artistName: string, hotelName: string, paid: boolean, note: string | null, url: string) {
  return send(to, {
    subject: paid ? `${hotelName} a remboursé votre transport` : 'Votre demande de remboursement n’est pas retenue',
    heading: paid ? 'Remboursement effectué' : 'Demande non retenue',
    body: [
      `Bonjour ${esc(artistName)},`,
      paid
        ? `<strong>${esc(hotelName)}</strong> indique avoir remboursé vos frais de transport.`
        : 'Après examen, votre demande de remboursement de transport n’est pas retenue.',
      ...(note ? [`Précision : ${esc(note)}`] : []),
    ],
    action: { label: 'Voir le dossier', url },
    footnote: paid ? 'Si vous n’avez rien reçu d’ici quelques jours, répondez à ce message.' : 'Vous pouvez répondre à ce message pour en discuter avec nous.',
  });
}

/** To the coordinator's inbox: something needs a look. */
export function adminAlertEmail(subject: string, lines: string[], url: string) {
  if (!ADMIN_NOTIFY_EMAIL) return Promise.resolve<SendResult>({ sent: false });
  return send(ADMIN_NOTIFY_EMAIL, { subject, heading: subject, body: lines.map(esc), action: { label: 'Ouvrir', url } });
}

/** The coordinator's copy of a signed convention. */
export function conventionSignedAdminEmail(hotelName: string, artistName: string, stay: string, url: string, pdf: Buffer, reference: string) {
  if (!ADMIN_NOTIFY_EMAIL) return Promise.resolve<SendResult>({ sent: false });
  return conventionSignedEmail(ADMIN_NOTIFY_EMAIL, 'Coordinateur', hotelName, artistName, stay, url, pdf, reference);
}

/** To the hotel: the artist said no. Written so it does not read as a snub. */
export function bookingRejectedEmail(
  to: string,
  hotelName: string,
  artistName: string,
  stay: string,
  url: string
) {
  return send(to, {
    subject: `${artistName} ne retient pas les dates ${stay}`,
    heading: 'La proposition n’a pas été retenue',
    body: [
      `Bonjour ${esc(hotelName)},`,
      `<strong>${esc(artistName)}</strong> ne donne pas suite pour la période ${stay}. Vos crédits vous ont été restitués.`,
      'Un refus tient presque toujours au calendrier et non au lieu. D’autres artistes de la même discipline sont disponibles sur cette période.',
    ],
    action: { label: 'Voir d’autres artistes', url },
  });
}

/** To the artist: the house pulled out. The one that costs someone a flight. */
export function bookingCancelledEmail(
  to: string,
  artistName: string,
  hotelName: string,
  stay: string,
  url: string
) {
  return send(to, {
    subject: `Résidence annulée : ${hotelName}, ${stay}`,
    heading: 'La résidence est annulée',
    body: [
      `Bonjour ${esc(artistName)},`,
      `<strong>${esc(hotelName)}</strong> annule la résidence prévue ${stay}.`,
      'Nous cherchons à vous replacer sur la même période, sans pouvoir le garantir. Si la convention était signée et que vous aviez engagé des frais de transport non remboursables, l’hôtel vous les rembourse sur justificatifs : déposez votre demande depuis votre espace, au même endroit que la réservation.',
    ],
    action: { label: 'Voir mes dates', url },
    footnote:
      'C’est la raison pour laquelle nous recommandons de n’acheter aucun billet avant la signature de la convention.',
  });
}

/** An artist invites someone to apply, with their referral link. */
export function referralInviteEmail(to: string, inviteeName: string, inviterName: string, url: string) {
  return send(to, {
    subject: `${inviterName} vous invite à rejoindre Travel Art`,
    heading: 'Une invitation à rejoindre Travel Art',
    body: [
      `Bonjour ${esc(inviteeName)},`,
      `<strong>${esc(inviterName)}</strong> vous invite à rejoindre Travel Art, le programme qui échange un séjour à l’hôtel pour deux contre votre prestation artistique.`,
      'Chaque candidature est examinée par notre équipe avant l’ouverture du compte.',
    ],
    action: { label: 'Découvrir et candidater', url },
    footnote: 'Vous recevez ce message parce qu’un artiste du programme a saisi votre adresse. Nous ne la conservons pas.',
  });
}

export const emailIsConfigured = Boolean(smtp || resend);
export { config };
