import { Prisma } from '@prisma/client';

/**
 * Media as it leaves the server.
 *
 * Every owner (artist, hotel, space, trip) gets the same three things: the
 * ordered rows with their ids - which is what the owner's own screens need to
 * reorder and delete - and two plain URL lists, `images` and `videos`, which
 * is the shape every existing card and gallery already reads.
 */

export const mediaSelect = {
  id: true,
  kind: true,
  provider: true,
  url: true,
  externalId: true,
  title: true,
  position: true,
  verification: true,
  verificationMethod: true,
  authorName: true,
} satisfies Prisma.MediaSelect;

export const mediaOrder: Prisma.MediaOrderByWithRelationInput[] = [{ position: 'asc' }, { createdAt: 'asc' }];

export type MediaRow = Prisma.MediaGetPayload<{ select: typeof mediaSelect }>;

export interface MediaDTO {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  provider: string;
  url: string;
  externalId: string | null;
  title: string | null;
  /** Where to point an iframe, for providers we embed. */
  embedUrl: string | null;
  /** Shown to belong to the artist (videos; see services/videoVerification.ts). */
  verification: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  verificationMethod: string | null;
  /** The channel the provider reports, for videos. */
  channel: string | null;
}

export function toMediaDTO(row: MediaRow): MediaDTO {
  let embedUrl: string | null = null;
  if (row.provider === 'YOUTUBE' && row.externalId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${row.externalId}`;
  } else if (row.provider === 'VIMEO' && row.externalId) {
    embedUrl = `https://player.vimeo.com/video/${row.externalId}`;
  }
  return {
    id: row.id,
    kind: row.kind,
    provider: row.provider,
    url: row.url,
    externalId: row.externalId,
    title: row.title,
    embedUrl,
    verification: row.verification,
    verificationMethod: row.verificationMethod,
    channel: row.authorName,
  };
}

export function splitMedia(rows: MediaRow[] | undefined | null) {
  const media = (rows ?? []).map(toMediaDTO);
  return {
    media,
    images: media.filter((m) => m.kind === 'IMAGE').map((m) => m.url),
    videos: media.filter((m) => m.kind === 'VIDEO').map((m) => m.url),
  };
}
