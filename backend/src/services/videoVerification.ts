import crypto from 'crypto';
import { prismaAdmin } from '../db';

/**
 * Is this video the artist's own?
 *
 * Anyone can paste a link to someone else's performance. The proof asked for
 * is the one a stranger cannot fake: each artist gets a short personal code
 * (TA-7K3Q9X), writes it into the description of one of their videos, and
 * presses "Vérifier". We read the description back from the provider; if the
 * code is there, the person controls that channel, and every other video of
 * theirs from the same channel is verified with it. The code can be removed
 * from the description afterwards.
 *
 *   YouTube  oEmbed for the channel, the public watch page for the description
 *   Vimeo    oEmbed gives both
 *   Instagram has no public API left for this; those links, and uploaded
 *            files, are verified by hand from the admin panel.
 *
 * Nothing here throws on a network failure: a provider that cannot be reached
 * leaves the video unverified and says so.
 */

const TIMEOUT_MS = 8000;
const UA = 'Mozilla/5.0 (compatible; TravelArtVerifier/1.0; +https://travel-art.vercel.app)';

export interface VideoFacts {
  /** False when the provider says the video does not exist or is private. */
  exists: boolean;
  authorName: string | null;
  authorUrl: string | null;
  /** Description text, when the provider exposes it. */
  description: string | null;
}

/** Unambiguous characters only: no 0/O, 1/I/L. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function newVerificationCode(): string {
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `TA-${out}`;
}

/** The artist's code, issued on first use. */
export async function ensureVerificationCode(artistId: string): Promise<string> {
  const artist = await prismaAdmin.artist.findUnique({ where: { id: artistId }, select: { verificationCode: true } });
  if (artist?.verificationCode) return artist.verificationCode;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = newVerificationCode();
    try {
      const updated = await prismaAdmin.artist.updateMany({ where: { id: artistId, verificationCode: null }, data: { verificationCode: code } });
      if (updated.count === 1) return code;
      const again = await prismaAdmin.artist.findUnique({ where: { id: artistId }, select: { verificationCode: true } });
      if (again?.verificationCode) return again.verificationCode;
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error; // a collision: draw again
    }
  }
  throw new Error(`could not issue a verification code for artist ${artistId}`);
}

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string } | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'follow' });
    return { status: res.status, body: await res.text() };
  } catch {
    return null;
  }
}

/** Normalise a channel address so two spellings of the same channel compare equal. */
export function channelKey(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '').replace(/^m\./, '')}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return null;
  }
}

/** Read a JSON string literal that starts right after `"key":"` in a page. */
function extractJsonString(html: string, key: string): string | null {
  const marker = `"${key}":"`;
  const start = html.indexOf(marker);
  if (start === -1) return null;
  let i = start + marker.length;
  let raw = '';
  while (i < html.length) {
    const ch = html[i];
    if (ch === '\\') {
      raw += ch + html[i + 1];
      i += 2;
      continue;
    }
    if (ch === '"') break;
    raw += ch;
    i += 1;
  }
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return null;
  }
}

export async function fetchVideoFacts(provider: string, externalId: string | null, url: string): Promise<VideoFacts | null> {
  // Off in the offline test suite, read per call so a test can turn it on.
  if (process.env.CHECK_VIDEO_LINKS === '0') return null;
  if (provider === 'YOUTUBE' && externalId) {
    const watch = `https://www.youtube.com/watch?v=${externalId}`;
    const oembed = await fetchText(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`);
    if (!oembed) return null;
    // 400 is what YouTube answers for an id that does not exist.
    if ([400, 401, 403, 404].includes(oembed.status)) {
      return { exists: false, authorName: null, authorUrl: null, description: null };
    }
    if (oembed.status !== 200) return null;
    let meta: any = {};
    try {
      meta = JSON.parse(oembed.body);
    } catch {
      return null;
    }
    // The consent cookies keep European requests from landing on a consent wall.
    const page = await fetchText(`${watch}&hl=fr`, { 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8', Cookie: 'CONSENT=YES+1; SOCS=CAI' });
    const description = page && page.status === 200 ? extractJsonString(page.body, 'shortDescription') : null;
    return { exists: true, authorName: meta.author_name ?? null, authorUrl: meta.author_url ?? null, description };
  }

  if (provider === 'VIMEO' && externalId) {
    const oembed = await fetchText(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${externalId}`)}`);
    if (!oembed) return null;
    if (oembed.status === 404 || oembed.status === 403) return { exists: false, authorName: null, authorUrl: null, description: null };
    if (oembed.status !== 200) return null;
    try {
      const meta = JSON.parse(oembed.body);
      return { exists: true, authorName: meta.author_name ?? null, authorUrl: meta.author_url ?? null, description: meta.description ?? null };
    } catch {
      return null;
    }
  }

  void url;
  return null;
}

export type VerifyOutcome =
  | { status: 'VERIFIED'; method: 'CODE_IN_DESCRIPTION' | 'SAME_CHANNEL' }
  | { status: 'UNVERIFIED'; reason: 'CODE_NOT_FOUND' | 'UNREACHABLE' | 'NOT_FOUND' | 'MANUAL_ONLY' };

const MANUAL_PROVIDERS = new Set(['INSTAGRAM', 'UPLOAD', 'LINK']);

/**
 * Check one video. Records the channel it belongs to, and verifies it when
 * the artist's code is in its description or when the same channel is
 * already proven. A proof by code also verifies the artist's other videos
 * from that channel.
 */
export async function verifyArtistVideo(mediaId: string, artistId: string): Promise<VerifyOutcome> {
  const media = await prismaAdmin.media.findFirst({
    where: { id: mediaId, artistId, kind: 'VIDEO' },
    select: { id: true, provider: true, externalId: true, url: true, verification: true },
  });
  if (!media) throw new Error('media not found');
  if (media.verification === 'VERIFIED') return { status: 'VERIFIED', method: 'SAME_CHANNEL' };
  if (MANUAL_PROVIDERS.has(media.provider)) return { status: 'UNVERIFIED', reason: 'MANUAL_ONLY' };

  const facts = await fetchVideoFacts(media.provider, media.externalId, media.url);
  if (!facts) return { status: 'UNVERIFIED', reason: 'UNREACHABLE' };
  if (!facts.exists) return { status: 'UNVERIFIED', reason: 'NOT_FOUND' };

  await prismaAdmin.media.update({ where: { id: media.id }, data: { authorName: facts.authorName, authorUrl: facts.authorUrl } });

  const code = await ensureVerificationCode(artistId);
  const now = new Date();
  const key = channelKey(facts.authorUrl);

  if (facts.description && facts.description.toUpperCase().includes(code)) {
    await prismaAdmin.media.update({
      where: { id: media.id },
      data: { verification: 'VERIFIED', verificationMethod: 'CODE_IN_DESCRIPTION', verifiedAt: now, verificationNote: null },
    });
    if (key) await verifySameChannel(artistId, key, now);
    return { status: 'VERIFIED', method: 'CODE_IN_DESCRIPTION' };
  }

  if (key && (await channelIsProven(artistId, key))) {
    await prismaAdmin.media.update({
      where: { id: media.id },
      data: { verification: 'VERIFIED', verificationMethod: 'SAME_CHANNEL', verifiedAt: now, verificationNote: null },
    });
    return { status: 'VERIFIED', method: 'SAME_CHANNEL' };
  }

  return { status: 'UNVERIFIED', reason: 'CODE_NOT_FOUND' };
}

/** A channel counts as proven once one of the artist's videos from it carries the code, or an admin verified one. */
async function channelIsProven(artistId: string, key: string): Promise<boolean> {
  const proven = await prismaAdmin.media.findMany({
    where: { artistId, kind: 'VIDEO', verification: 'VERIFIED', verificationMethod: { in: ['CODE_IN_DESCRIPTION', 'ADMIN'] }, authorUrl: { not: null } },
    select: { authorUrl: true },
  });
  return proven.some((m) => channelKey(m.authorUrl) === key);
}

/** Verify the artist's other videos from a channel just proven (by code or by an admin). */
export async function verifyOtherVideosFromChannel(artistId: string, authorUrl: string | null) {
  const key = channelKey(authorUrl);
  if (key) await verifySameChannel(artistId, key, new Date());
}

async function verifySameChannel(artistId: string, key: string, now: Date) {
  const others = await prismaAdmin.media.findMany({
    where: { artistId, kind: 'VIDEO', verification: 'UNVERIFIED', provider: { in: ['YOUTUBE', 'VIMEO'] } },
    select: { id: true, provider: true, externalId: true, url: true, authorUrl: true },
  });
  for (const other of others) {
    let authorUrl = other.authorUrl;
    if (!authorUrl) {
      const facts = await fetchVideoFacts(other.provider, other.externalId, other.url);
      authorUrl = facts?.authorUrl ?? null;
      if (facts) await prismaAdmin.media.update({ where: { id: other.id }, data: { authorName: facts.authorName, authorUrl } });
    }
    if (channelKey(authorUrl) === key) {
      await prismaAdmin.media.update({
        where: { id: other.id },
        data: { verification: 'VERIFIED', verificationMethod: 'SAME_CHANNEL', verifiedAt: now },
      });
    }
  }
}

/**
 * On adding a link: does the video exist, whose channel is it, and is that
 * channel already proven? Best effort - a provider that does not answer
 * leaves the video as added, unverified.
 */
export async function inspectNewVideo(mediaId: string, artistId: string): Promise<void> {
  try {
    await verifyArtistVideo(mediaId, artistId);
  } catch (error) {
    console.error('video inspection failed for media', mediaId, error);
  }
}

/** For sign-up: links that the provider says do not exist. Unreachable providers are given the benefit of the doubt. */
export async function missingVideos(videos: { provider: string; externalId: string; url: string }[]): Promise<number[]> {
  const results = await Promise.all(videos.map((v) => fetchVideoFacts(v.provider, v.externalId, v.url)));
  return results.flatMap((facts, i) => (facts && !facts.exists ? [i] : []));
}
