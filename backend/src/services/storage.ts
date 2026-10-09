import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { put, del } from '@vercel/blob';
import { DetectedType } from './fileType';

/**
 * Where uploaded files go.
 *
 * Vercel Blob whenever a token is present; the local `uploads/` folder in
 * development. Serverless filesystems are ephemeral, so the local fallback is
 * for a developer's machine only.
 *
 * Deletion is the dangerous half. It used to take any URL a caller had
 * managed to put in their own profile - and the profile accepted any URL - so
 * an artist could paste another user's photo address into their gallery and
 * then "delete" it. Callers now pass a storage key that only ever came from
 * this module, read back from a media row the caller owns.
 */

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const LOCAL_ROOT = path.join(__dirname, '../../uploads');

export interface StoredFile {
  url: string;
  storageKey: string;
}

export async function storeFile(buffer: Buffer, type: DetectedType, folder: 'profile-pictures' | 'media' | 'claims'): Promise<StoredFile> {
  // The name is a UUID and the extension comes from the detected type: nothing
  // the uploader typed reaches the path or the served Content-Type.
  const storageKey = `${folder}/${randomUUID()}${type.ext}`;

  if (useBlob()) {
    const blob = await put(storageKey, buffer, { access: 'public', contentType: type.mime, addRandomSuffix: false });
    return { url: blob.url, storageKey };
  }

  const target = path.join(LOCAL_ROOT, storageKey);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buffer);
  return { url: `/uploads/${storageKey}`, storageKey };
}

/** True for an address this module could have produced. */
export function isOwnStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url) || url.startsWith('/uploads/');
}

/** Best effort: a file that is already gone is not an error. */
export async function removeStoredFile(url: string, storageKey: string): Promise<void> {
  try {
    if (/^https:\/\//i.test(url)) {
      if (useBlob()) await del(url);
      return;
    }
    // Resolve inside the upload root, so a crafted key cannot escape it.
    const target = path.resolve(LOCAL_ROOT, storageKey);
    if (target.startsWith(path.resolve(LOCAL_ROOT) + path.sep) && fs.existsSync(target)) fs.unlinkSync(target);
  } catch (error) {
    console.error('could not remove stored file', storageKey, error);
  }
}

/** The storage key of an address this module produced, or null. */
export function storageKeyFromUrl(url: string): string | null {
  if (!isOwnStorageUrl(url)) return null;
  return url.startsWith('/uploads/') ? url.slice('/uploads/'.length) : url.replace(/^https:\/\/[^/]+\//, '');
}
