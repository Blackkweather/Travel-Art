import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { CONSENT, LEGAL_VERSION, clientIp, hashIp } from '../config/legal';
import { config } from '../config';
import { verificationEmail, passwordResetEmail, newRegistrationAdminAlert } from '../services/email';
import { authenticate, authenticateApplicant, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { prisma, prismaAdmin } from '../db';
import { generateUniqueReferralCode } from '../utils/referralCode';
import { tokens, passwordFingerprint } from '../services/tokens';
import { domainAcceptsMail } from '../services/emailDomain';
import { verifyCaptcha } from '../services/captcha';
import { verifyGoogleCredential } from '../services/google';
import { conflictFromUniqueError, findIdentityConflicts, hotelKey } from '../services/identity';
import { sessionUserSelect } from '../views/user';
import {
  ArtistRegistration,
  HotelRegistration,
  artistRegistrationSchema,
  checkEmail,
  hotelRegistrationSchema,
  loginEmailSchema,
  nameKey,
  normalizePhone,
  passwordSchema,
} from '../shared/validation';
import { disciplineLabel } from '../shared/categories';
import { parseVideoUrl } from '../shared/media';
import { missingVideos, newVerificationCode } from '../services/videoVerification';
import { background } from '../services/background';

const router = Router();

// Compared against when the address is unknown, so "no such account" takes
// as long as "wrong password". Built on first use, at the same cost factor as
// real hashes, rather than at start-up where it would slow every cold start.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash(`unused-${Date.now()}`, 12));

const verifyLinkFor = (user: { id: string; email: string }) =>
  `${config.frontendUrl}/verify-email?token=${tokens.emailVerification.sign(user)}`;

/**
 * The domain must exist and accept mail. Kept out of the shared schema
 * because it needs the network; everything else about the address was already
 * decided there.
 */
async function assertMailableDomain(email: string) {
  const domain = email.split('@')[1];
  if (domain && !(await domainAcceptsMail(domain))) {
    throw new CustomError('Ce domaine n’accepte pas d’e-mails. Vérifiez votre adresse.', 400, {
      fields: { email: 'Ce domaine n’accepte pas d’e-mails. Vérifiez votre adresse.' },
    });
  }
}

/** Parse with the right schema for the role, so errors name the right fields. */
function parseRegistration(body: any): ArtistRegistration | HotelRegistration {
  if (body?.role === 'HOTEL') return hotelRegistrationSchema.parse(body);
  if (body?.role === 'ARTIST') return artistRegistrationSchema.parse(body);
  throw new CustomError('Choisissez un type de compte.', 400, { fields: { role: 'Choisissez un type de compte.' } });
}

function mediaRow(url: string, position: number) {
  const video = parseVideoUrl(url);
  return video
    ? { kind: 'VIDEO' as const, provider: video.provider, url: video.url, externalId: video.externalId, position }
    : { kind: 'IMAGE' as const, provider: 'LINK' as const, url, position };
}

// ---------------------------------------------------------------- register

/**
 * Everything about a profile that needs the network or the database, shared
 * by a registration and by an account opened with Google completing its
 * profile. `ownEmail` skips the address checks for an account that already
 * holds it.
 */
async function checkProfile(data: ArtistRegistration | HotelRegistration, req: Request, ownEmail = false) {
  if (!(await verifyCaptcha(data.captchaToken, req.ip))) {
    throw new CustomError('La vérification anti-robot a échoué. Rechargez la page et réessayez.', 400, {
      code: 'CAPTCHA_FAILED',
    });
  }

  if (!ownEmail) await assertMailableDomain(data.email);

  const phoneE164 = normalizePhone(data.phone, data.country)!;
  const artist = data.role === 'ARTIST' ? (data as ArtistRegistration) : null;
  const hotel = data.role === 'HOTEL' ? (data as HotelRegistration) : null;

  const conflicts = await findIdentityConflicts({
    email: ownEmail ? undefined : data.email,
    phoneE164,
    stageName: artist?.stageName,
    hotelName: hotel?.name,
    hotelCity: hotel?.city,
  });
  if (Object.keys(conflicts).length > 0) {
    throw new CustomError(Object.values(conflicts)[0], 409, { fields: conflicts, code: 'IDENTITY_TAKEN' });
  }

  // The videos must exist and be visible. A provider that does not answer is
  // given the benefit of the doubt; the review looks at them anyway.
  const signupVideos = artist ? artist.videoUrls.map((u) => parseVideoUrl(u)!) : [];
  if (signupVideos.length) {
    const missing = await missingVideos(signupVideos);
    if (missing.length) {
      const fields = Object.fromEntries(missing.map((i) => [`videoUrls.${i}`, 'Vidéo introuvable ou privée : vérifiez le lien et sa visibilité.']));
      throw new CustomError('Une de vos vidéos est introuvable ou privée.', 400, { fields });
    }
  }

  // A code that does not belong to an admitted artist is ignored, not an
  // error: the person did nothing wrong by following an old link.
  const inviter = data.referralCode
    ? await prismaAdmin.artist.findFirst({
        where: { referralCode: data.referralCode.trim().toUpperCase(), user: { approvalStatus: 'APPROVED', isActive: true } },
        select: { userId: true },
      })
    : null;

  return {
    artist,
    hotel,
    phoneE164,
    signupVideos,
    inviter,
    displayName: artist ? `${artist.firstName} ${artist.lastName}` : hotel!.name,
    referralCode: artist ? await generateUniqueReferralCode(artist.stageName) : undefined,
  };
}

type CheckedProfile = Awaited<ReturnType<typeof checkProfile>>;

/** The artist or hotel row, and the referral, for an account that has none yet. */
async function createProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  data: ArtistRegistration | HotelRegistration,
  checked: CheckedProfile
) {
  const { artist, hotel, signupVideos, inviter, referralCode } = checked;
  if (artist) {
    await tx.artist.create({
      data: {
        userId,
        stageName: artist.stageName,
        stageNameKey: nameKey(artist.stageName),
        birthDate: artist.birthDate,
        referralCode: referralCode!,
        mainCategory: artist.mainCategory,
        categoryType: artist.categoryType,
        specificCategory: artist.specificCategory || null,
        tributeTo: artist.tributeTo,
        secondaryCategory: artist.secondaryCategory,
        discipline: disciplineLabel(artist),
        audienceTypes: artist.audienceTypes,
        languages: artist.languages,
        otherLanguages: artist.otherLanguages,
        instagramUrl: artist.instagramUrl,
        tiktokUrl: artist.tiktokUrl,
        verificationCode: newVerificationCode(),
        media: {
          create: signupVideos.map((video, position) => ({
            kind: 'VIDEO' as const,
            provider: video.provider,
            url: video.url,
            externalId: video.externalId,
            position,
          })),
        },
      },
    });
  } else if (hotel) {
    await tx.hotel.create({
      data: {
        userId,
        name: hotel.name,
        nameKey: hotelKey(hotel.name, hotel.city),
        description: hotel.description,
        city: hotel.city,
        country: hotel.country,
        address: hotel.address,
        hotelType: hotel.hotelType,
        roomCount: hotel.roomCount,
        website: hotel.website,
        instagramUrl: hotel.instagramUrl,
        tiktokUrl: hotel.tiktokUrl,
        facebookUrl: hotel.facebookUrl,
        youtubeUrl: hotel.youtubeUrl,
        contactPhone: data.phone.trim(),
        repName: hotel.contactName,
        responsibleName: hotel.contactName,
        responsibleEmail: data.email,
        responsiblePhone: data.phone.trim(),
        programme: { create: hotel.programme ?? {} },
        spaces: {
          create: hotel.spaces.map((space, index) => ({
            name: space.name,
            type: space.type,
            setting: space.setting,
            capacity: space.capacity,
            description: space.description,
            hours: space.hours,
            noiseLevel: space.noiseLevel,
            position: index,
            media: { create: space.media.map((url, i) => mediaRow(url, i)) },
          })),
        },
      },
    });
  }

  if (inviter) {
    // Points are credited when this account is admitted (see admin.ts).
    await tx.referral.create({ data: { inviterUserId: inviter.userId, inviteeUserId: userId } });
  }
}

function consentRows(userId: string, req: Request) {
  const ipHash = hashIp(clientIp(req as never));
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 255) || null;
  return [CONSENT.TERMS, CONSENT.PRIVACY].map((kind) => ({ userId, kind, version: LEGAL_VERSION, granted: true, ipHash, userAgent }));
}

/** A password nobody knows, for an account opened with Google (the reset link sets a real one). */
const unusablePassword = () => `Gg1!${randomBytes(24).toString('base64url')}`;

function alertAdmins(user: { id: string; name: string; email: string; role: string }, country: string) {
  background(newRegistrationAdminAlert({
    name: user.name,
    email: user.email,
    role: user.role as 'ARTIST' | 'HOTEL',
    country,
  }).catch((err) => console.error('admin registration alert failed for user', user.id, err)), 'newRegistrationAdminAlert');
}

router.post('/register', asyncHandler(async (req: Request, res) => {
  const data = parseRegistration(req.body);
  const checked = await checkProfile(data, req);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const now = new Date();

  /* One transaction: the account, its profile, its consent and its referral
     either all exist or none do. Profile creation used to be best-effort,
     which left accounts with no artist or hotel row that every screen then
     failed on. */
  let user: { id: string; email: string; name: string; role: string };
  try {
    user = await prismaAdmin.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          name: checked.displayName,
          passwordHash,
          role: data.role,
          language: data.locale,
          phone: data.phone.trim(),
          phoneE164: checked.phoneE164,
          country: data.country,
          acceptedTermsAt: now,
          acceptedTermsVersion: LEGAL_VERSION,
        },
        select: { id: true, email: true, name: true, role: true },
      });
      await tx.consentRecord.createMany({ data: consentRows(created.id, req) });
      await createProfile(tx, created.id, data, checked);
      return created;
    });
  } catch (error) {
    const fields = conflictFromUniqueError(error);
    if (fields) throw new CustomError(Object.values(fields)[0], 409, { fields, code: 'IDENTITY_TAKEN' });
    throw error;
  }

  // After the commit, and not awaited: an account with an unsent e-mail is
  // recoverable (resend-verification), a registration reported as failed
  // when it succeeded is not.
  background(verificationEmail(user.email, user.name, verifyLinkFor(user)).catch((err) =>
    console.error('verification email failed for user', user.id, err)
  ), 'verificationEmail');
  alertAdmins(user, data.country);

  // No session: the account cannot act until it is confirmed and admitted.
  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, role: user.role, name: user.name, email: user.email, approvalStatus: 'PENDING', emailVerified: false },
      status: 'PENDING_REVIEW',
      message: 'Votre demande a bien été enregistrée. Confirmez votre adresse e-mail, puis attendez la validation de votre compte par notre équipe.',
    },
  });
}));

// -------------------------------------------------- complete a Google account

/**
 * The profile of an account opened with Google. The form is the registration
 * form; the address and the role are the account's own and cannot change
 * here. Once it is in, the account waits for an administrator like any other
 * application, and the session that sent it stops working.
 */
router.post('/complete-profile', authenticateApplicant, asyncHandler(async (req: AuthRequest, res) => {
  const account = await prismaAdmin.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, role: true, approvalStatus: true },
  });
  if (!account || account.approvalStatus !== 'INCOMPLETE') {
    throw new CustomError('Ce profil a déjà été envoyé.', 409, { code: 'PROFILE_ALREADY_SENT' });
  }

  const data = parseRegistration({ ...req.body, role: account.role, email: account.email, password: unusablePassword() });
  const checked = await checkProfile(data, req, true);

  let user: { id: string; email: string; name: string; role: string };
  try {
    user = await prismaAdmin.$transaction(async (tx) => {
      // Guarded on the status, so two submits cannot both create a profile.
      const moved = await tx.user.updateMany({
        where: { id: account.id, approvalStatus: 'INCOMPLETE' },
        data: {
          name: checked.displayName,
          language: data.locale,
          phone: data.phone.trim(),
          phoneE164: checked.phoneE164,
          country: data.country,
          approvalStatus: 'PENDING',
        },
      });
      if (moved.count !== 1) throw new CustomError('Ce profil a déjà été envoyé.', 409, { code: 'PROFILE_ALREADY_SENT' });
      await createProfile(tx, account.id, data, checked);
      return { id: account.id, email: account.email, name: checked.displayName, role: account.role };
    });
  } catch (error) {
    const fields = conflictFromUniqueError(error);
    if (fields) throw new CustomError(Object.values(fields)[0], 409, { fields, code: 'IDENTITY_TAKEN' });
    throw error;
  }

  alertAdmins(user, data.country);

  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, role: user.role, name: user.name, email: user.email, approvalStatus: 'PENDING', emailVerified: true },
      status: 'PENDING_REVIEW',
      message: 'Votre profil a bien été envoyé. Attendez la validation de votre compte par notre équipe.',
    },
  });
}));

// --------------------------------------------------------- availability check

/**
 * Live feedback for the registration form: is this address usable, is this
 * phone or name taken? Answers only for the fields sent, and only with the
 * problems found - an empty `fields` means everything sent is fine.
 *
 * This does say whether an e-mail is registered. So does the register
 * endpoint itself (it has to), so nothing new is disclosed; both sit behind a
 * database-backed rate limit.
 */
const availabilitySchema = z.object({
  email: z.string().max(254).optional(),
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  stageName: z.string().max(60).optional(),
  hotelName: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
});

router.post('/check-availability', asyncHandler(async (req, res) => {
  const probe = availabilitySchema.parse(req.body);
  const fields: Record<string, string> = {};
  let suggestion: string | undefined;

  let email: string | undefined;
  if (probe.email) {
    const verdict = checkEmail(probe.email);
    if (!verdict.ok) {
      fields.email = verdict.message!;
      suggestion = verdict.suggestion;
    } else if (!(await domainAcceptsMail(verdict.email.split('@')[1]))) {
      fields.email = 'Ce domaine n’accepte pas d’e-mails. Vérifiez votre adresse.';
    } else {
      email = verdict.email;
    }
  }

  let phoneE164: string | null = null;
  if (probe.phone) {
    phoneE164 = normalizePhone(probe.phone, probe.country);
    if (!phoneE164) fields.phone = 'Numéro de téléphone invalide pour ce pays';
  }

  const conflicts = await findIdentityConflicts({
    email,
    phoneE164,
    stageName: probe.stageName,
    hotelName: probe.hotelName,
    hotelCity: probe.city,
  });

  res.json({ success: true, data: { fields: { ...conflicts, ...fields }, ...(suggestion ? { suggestion } : {}) } });
}));

// ------------------------------------------------------------------- login

const loginSchema = z.object({
  email: loginEmailSchema,
  password: z.string({ required_error: 'Indiquez votre mot de passe' }).min(1, 'Indiquez votre mot de passe').max(128),
});

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      approvalStatus: true,
      approvalNote: true,
      isActive: true,
      emailVerified: true,
    },
  });

  // The password is checked before any account state is revealed, so this
  // endpoint cannot be used to learn which addresses are registered.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) {
    throw new CustomError('E-mail ou mot de passe incorrect.', 401, { code: 'BAD_CREDENTIALS' });
  }

  assertCanSignIn(user);

  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: sessionUserSelect });

  res.json({
    success: true,
    data: { user: profile, token: tokens.session.sign(user) },
  });
}));

/** Refuses, with the reason, an account that may not open a session yet or any more. */
function assertCanSignIn(user: {
  approvalStatus: string;
  approvalNote: string | null;
  isActive: boolean;
  emailVerified: boolean;
}) {
  if (user.approvalStatus === 'PENDING') {
    if (!user.emailVerified) {
      throw new CustomError(
        'Confirmez d’abord votre adresse e-mail : cliquez sur le lien que nous vous avons envoyé. Vous pouvez en demander un nouveau.',
        403,
        { code: 'EMAIL_NOT_VERIFIED' }
      );
    }
    throw new CustomError(
      'Votre demande d’inscription est en cours d’examen. Vous recevrez un e-mail dès qu’elle aura été traitée.',
      403,
      { code: 'PENDING_REVIEW' }
    );
  }

  if (user.approvalStatus === 'REJECTED') {
    throw new CustomError(
      user.approvalNote
        ? `Votre demande d’inscription n’a pas été retenue. Motif : ${user.approvalNote}`
        : 'Votre demande d’inscription n’a pas été retenue.',
      403,
      { code: 'REJECTED' }
    );
  }

  if (!user.isActive) {
    throw new CustomError(
      user.approvalNote
        ? `Ce compte a été suspendu. Motif : ${user.approvalNote}`
        : 'Ce compte a été suspendu. Contactez l’administrateur du programme.',
      403,
      { code: 'SUSPENDED' }
    );
  }
}

// ------------------------------------------------------- sign in with Google

/**
 * An existing account with the Google address signs straight in, under the
 * same rules as a password. No account yet: the answer carries a signup token
 * and the names Google knows, and /google/start opens the account once they
 * have chosen artist or hotel.
 */
router.post('/google', asyncHandler(async (req, res) => {
  const { credential } = z.object({ credential: z.string().min(1).max(4096) }).parse(req.body);
  const google = await verifyGoogleCredential(credential);

  const user = await prisma.user.findUnique({
    where: { email: google.email },
    select: { id: true, role: true, approvalStatus: true, approvalNote: true, isActive: true, emailVerified: true },
  });

  if (!user) {
    return res.json({
      success: true,
      data: {
        status: 'NEEDS_REGISTRATION',
        signupToken: tokens.googleSignup.sign(google),
        email: google.email,
        firstName: google.givenName,
        lastName: google.familyName,
        name: google.name,
      },
    });
  }

  // Google has just proved the inbox, which is all the confirmation link does.
  if (!user.emailVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
    user.emailVerified = true;
  }

  assertCanSignIn(user);

  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: sessionUserSelect });
  res.json({ success: true, data: { status: 'SIGNED_IN', user: profile, token: tokens.session.sign(user) } });
}));

/**
 * Open the account Google vouched for, as an artist or a hotel. It starts
 * INCOMPLETE: it can sign in, but only to fill in its profile (see
 * authenticateApplicant). Nobody sees it and it cannot be booked; the profile
 * then goes to an administrator, because anyone can open a Google account.
 */
router.post('/google/start', asyncHandler(async (req, res) => {
  const body = z
    .object({
      signupToken: z.string().min(1).max(4096),
      role: z.enum(['ARTIST', 'HOTEL'], { errorMap: () => ({ message: 'Choisissez un type de compte.' }) }),
      acceptTerms: z.literal(true, {
        errorMap: () => ({ message: 'Vous devez accepter les conditions générales et la politique de confidentialité' }),
      }),
      locale: z.enum(['fr', 'en']).optional().default('fr'),
    })
    .parse(req.body);

  let google;
  try {
    google = tokens.googleSignup.verify(body.signupToken);
  } catch {
    throw new CustomError('La connexion avec Google a expiré. Recommencez avec le bouton Google.', 400, {
      code: 'GOOGLE_EXPIRED',
    });
  }

  const taken = await prisma.user.findUnique({ where: { email: google.email }, select: { id: true } });
  if (taken) {
    throw new CustomError('Un compte existe déjà pour cette adresse. Connectez-vous avec Google.', 409, {
      code: 'IDENTITY_TAKEN',
    });
  }

  const now = new Date();
  let user;
  try {
    user = await prismaAdmin.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: google.email,
          name: google.name || google.email.split('@')[0],
          passwordHash: await bcrypt.hash(unusablePassword(), 12),
          role: body.role,
          language: body.locale,
          approvalStatus: 'INCOMPLETE',
          emailVerified: true,
          emailVerifiedAt: now,
          acceptedTermsAt: now,
          acceptedTermsVersion: LEGAL_VERSION,
        },
        select: { id: true, role: true },
      });
      await tx.consentRecord.createMany({ data: consentRows(created.id, req) });
      return created;
    });
  } catch (error) {
    if (conflictFromUniqueError(error)) {
      throw new CustomError('Un compte existe déjà pour cette adresse. Connectez-vous avec Google.', 409, {
        code: 'IDENTITY_TAKEN',
      });
    }
    throw error;
  }

  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: sessionUserSelect });
  res.status(201).json({ success: true, data: { user: profile, token: tokens.session.sign(user) } });
}));

// ---------------------------------------------------------- session upkeep

router.post('/refresh', authenticateApplicant, asyncHandler(async (req: AuthRequest, res) => {
  res.json({ success: true, data: { token: tokens.session.sign(req.user!) } });
}));

router.get('/me', authenticateApplicant, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: sessionUserSelect });
  if (!user) throw new CustomError('Compte introuvable.', 404);
  res.json({ success: true, data: { user } });
}));

/** End every session for the current user, including this one. */
router.post('/logout-all', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { sessionsValidFrom: new Date() } });
  res.json({ success: true, message: 'Toutes vos sessions ont été fermées. Reconnectez-vous.' });
}));

// ------------------------------------------------------- email confirmation

router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = z.object({ token: z.string().min(1).max(2048) }).parse(req.body);

  let payload;
  try {
    payload = tokens.emailVerification.verify(token);
  } catch {
    throw new CustomError('Ce lien de confirmation est invalide ou a expiré. Demandez-en un nouveau.', 400, {
      code: 'LINK_INVALID',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, emailVerified: true, approvalStatus: true },
  });
  // A link for an address the account no longer uses confirms nothing.
  if (!user || user.email !== payload.email) {
    throw new CustomError('Ce lien de confirmation est invalide.', 400, { code: 'LINK_INVALID' });
  }

  // Idempotent: following the link twice is a normal thing to do.
  if (!user.emailVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
  }

  res.json({
    success: true,
    data: {
      email: user.email,
      approvalStatus: user.approvalStatus,
      message:
        user.approvalStatus === 'APPROVED'
          ? 'Adresse confirmée. Vous pouvez vous connecter.'
          : 'Adresse confirmée. Votre demande est en cours d’examen par notre équipe.',
    },
  });
}));

/** Same answer whether or not the address exists or is already confirmed. */
router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = z.object({ email: loginEmailSchema }).parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (user && !user.emailVerified) {
    background(verificationEmail(user.email, user.name, verifyLinkFor(user)).catch((err) =>
      console.error('verification email resend failed for user', user.id, err)
    ), 'verificationEmail');
  }
  res.json({
    success: true,
    message: 'Si un compte non confirmé existe pour cette adresse, un nouveau lien vient de lui être envoyé.',
  });
}));

// ---------------------------------------------------------- password reset

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = z.object({ email: loginEmailSchema }).parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (user) {
    const link = `${config.frontendUrl}/reset-password?token=${tokens.passwordReset.sign(user)}`;
    if (process.env.NODE_ENV === 'development') {
      // Development only, and only to this machine's console.
      console.log(`[dev] password reset link for ${user.email}: ${link}`);
    }
    // Not awaited and never surfaced: the response is identical either way,
    // so it cannot reveal whether the address exists.
    background(passwordResetEmail(user.email, user.name, link).catch((err) =>
      console.error('password reset email failed for user', user.id, err)
    ), 'passwordResetEmail');
  }

  res.json({
    success: true,
    message: 'Si un compte existe pour cette adresse, vous allez recevoir un lien de réinitialisation.',
  });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = z.object({ token: z.string().min(1).max(2048), password: passwordSchema }).parse(req.body);

  let payload;
  try {
    payload = tokens.passwordReset.verify(token);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new CustomError('Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.', 400, { code: 'LINK_INVALID' });
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, passwordHash: true, emailVerified: true },
  });
  // Single use: once the password changes, the fingerprint no longer matches.
  if (!user || payload.pwh !== passwordFingerprint(user.passwordHash)) {
    throw new CustomError('Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.', 400, { code: 'LINK_INVALID' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      // Every session opened with the old password ends here.
      sessionsValidFrom: new Date(),
      // Following a link sent to the inbox proves the inbox.
      ...(user.emailVerified ? {} : { emailVerified: true, emailVerifiedAt: new Date() }),
    },
  });

  res.json({ success: true, message: 'Mot de passe modifié. Vous pouvez vous connecter.' });
}));

export { router as authRoutes };

// Exported for the admin route, which re-sends a confirmation link.
export { verifyLinkFor };
