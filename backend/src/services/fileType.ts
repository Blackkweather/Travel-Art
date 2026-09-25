/**
 * Identify an uploaded file from its bytes rather than its claims.
 *
 * Multer's `file.mimetype` is the Content-Type the client sent, and
 * `file.originalname` is a string the client chose. Both are attacker-controlled.
 * Filtering on mimetype means an upload only has to *say* image/png; deriving
 * the stored extension from originalname means the attacker picks the extension
 * the file is saved and later served under.
 *
 * Every value this module returns comes from the file's own leading bytes, so
 * the caller never has to trust the request to describe its own payload.
 *
 * This is signature checking, not parsing: it proves a file starts like a PNG,
 * not that the rest of it is a valid PNG. The strongest version of this control
 * re-encodes the image through a decoder and writes out fresh bytes, which
 * discards anything hidden in the tail. That needs an image library in the
 * dependency tree; until then, signature checking plus a derived extension and
 * a derived Content-Type removes the part an attacker actually controls.
 */

export interface DetectedType {
  mime: string;
  ext: string;
}

/** Magic-number signatures for the formats this product accepts. */
const SIGNATURES: Array<{
  mime: string;
  ext: string;
  test: (b: Buffer) => boolean;
}> = [
  {
    mime: 'image/jpeg',
    ext: '.jpg',
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: '.png',
    // \x89PNG\r\n\x1a\n
    test: (b) =>
      b.length > 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: 'image/gif',
    ext: '.gif',
    test: (b) => b.length > 6 && b.subarray(0, 6).toString('ascii').match(/^GIF8[79]a$/) !== null,
  },
  {
    mime: 'image/webp',
    ext: '.webp',
    // RIFF....WEBP
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

/**
 * SVG is deliberately absent from the list above.
 *
 * It is an image format that is also a document format: an .svg can carry
 * <script>, and a browser that renders it same-origin will run it. Accepting
 * user SVG is accepting stored XSS unless it is sanitised or served from a
 * separate origin. Nothing in this product needs vector uploads, so the format
 * is simply not accepted.
 */

export function detectImageType(buffer: Buffer): DetectedType | null {
  for (const sig of SIGNATURES) {
    if (sig.test(buffer)) return { mime: sig.mime, ext: sig.ext };
  }
  return null;
}

/**
 * Reject payloads that begin like an image but carry markup early on.
 *
 * A polyglot file can satisfy a signature check and still be interpreted as
 * HTML by a browser that sniffs content. `X-Content-Type-Options: nosniff` is
 * the primary defence and helmet sets it, but a cheap scan of the head costs
 * nothing and closes the case where a response somehow escapes that header.
 */
export function looksLikeMarkup(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 1024).toString('latin1').toLowerCase();
  return (
    head.includes('<!doctype html') ||
    head.includes('<html') ||
    head.includes('<script') ||
    head.includes('<?php') ||
    head.includes('<svg')
  );
}
