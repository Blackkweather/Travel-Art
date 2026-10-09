import { prismaAdmin } from '../db';
import { nameKey } from '../shared/validation';

/**
 * One person, one account.
 *
 * The only uniqueness rule used to be the e-mail address, so the same artist
 * could register under five addresses with the same name and phone, and the
 * same hotel could be listed twice. Each identity now has a normalised key -
 * the e-mail lower-cased, the phone in E.164, the stage name and the hotel
 * name+city folded to letters and digits - and each key is unique in the
 * database. This module asks, before writing, which of them are taken, so the
 * form can say so field by field instead of failing on a constraint.
 *
 * The database constraints remain the authority: two registrations racing
 * each other both pass this check, and the second is stopped by the unique
 * index (see conflictFromUniqueError).
 */

export const hotelKey = (name: string, city: string) => `${nameKey(name)}|${nameKey(city)}`;

export interface IdentityProbe {
  email?: string | null;
  phoneE164?: string | null;
  stageName?: string | null;
  hotelName?: string | null;
  hotelCity?: string | null;
  /** The account being edited, which does not conflict with itself. */
  excludeUserId?: string;
}

export const CONFLICT_MESSAGES = {
  email: 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.',
  phone: 'Ce numéro de téléphone est déjà utilisé par un autre compte.',
  stageName: 'Ce nom de scène est déjà pris. Si c’est le vôtre, contactez-nous.',
  name: 'Cet hôtel est déjà inscrit dans cette ville. Si c’est le vôtre, contactez-nous.',
} as const;

/** Field -> message for every identity already held by another account. */
export async function findIdentityConflicts(probe: IdentityProbe): Promise<Record<string, string>> {
  const conflicts: Record<string, string> = {};
  const notMe = probe.excludeUserId ? { not: probe.excludeUserId } : undefined;

  const [emailOwner, phoneOwner, stageOwner, hotelOwner] = await Promise.all([
    probe.email
      ? prismaAdmin.user.findFirst({ where: { email: probe.email.toLowerCase(), id: notMe }, select: { id: true } })
      : null,
    probe.phoneE164
      ? prismaAdmin.user.findFirst({ where: { phoneE164: probe.phoneE164, id: notMe }, select: { id: true } })
      : null,
    probe.stageName && nameKey(probe.stageName)
      ? prismaAdmin.artist.findFirst({
          where: { stageNameKey: nameKey(probe.stageName), userId: notMe },
          select: { id: true },
        })
      : null,
    probe.hotelName && probe.hotelCity
      ? prismaAdmin.hotel.findFirst({
          where: { nameKey: hotelKey(probe.hotelName, probe.hotelCity), userId: notMe },
          select: { id: true },
        })
      : null,
  ]);

  if (emailOwner) conflicts.email = CONFLICT_MESSAGES.email;
  if (phoneOwner) conflicts.phone = CONFLICT_MESSAGES.phone;
  if (stageOwner) conflicts.stageName = CONFLICT_MESSAGES.stageName;
  if (hotelOwner) conflicts.name = CONFLICT_MESSAGES.name;
  return conflicts;
}

/**
 * Map a Prisma unique-constraint error (P2002) on one of the identity keys to
 * the form field it belongs to. Undefined when the error is something else.
 */
export function conflictFromUniqueError(error: any): Record<string, string> | undefined {
  if (error?.code !== 'P2002') return undefined;
  const target = ([] as string[]).concat(error?.meta?.target ?? []).join(',');
  if (target.includes('email')) return { email: CONFLICT_MESSAGES.email };
  if (target.includes('phoneE164')) return { phone: CONFLICT_MESSAGES.phone };
  if (target.includes('stageNameKey')) return { stageName: CONFLICT_MESSAGES.stageName };
  if (target.includes('nameKey')) return { name: CONFLICT_MESSAGES.name };
  return undefined;
}
