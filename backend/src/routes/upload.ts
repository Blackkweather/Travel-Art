import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { prisma } from '../db';
import { detectImageType, looksLikeMarkup } from '../services/fileType';
import { removeStoredFile, storageKeyFromUrl, storeFile } from '../services/storage';
import { mediaSelect, toMediaDTO } from '../views/media';

const router = Router();

export const MAX_IMAGES = 30;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * A cheap first pass on the declared type, to avoid buffering obvious
 * nonsense. Not the control that decides - assertRealImage() reads the bytes.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new CustomError('Formats acceptés : JPEG, PNG, GIF, WebP.', 400));
  },
});

/** The file's own leading bytes decide what it is, not the request. */
function assertRealImage(file: Express.Multer.File) {
  const detected = detectImageType(file.buffer);
  if (!detected) throw new CustomError('Ce fichier n’est pas une image valide. Formats acceptés : JPEG, PNG, GIF, WebP.', 400);
  if (looksLikeMarkup(file.buffer)) throw new CustomError('Ce fichier a été refusé pour des raisons de sécurité.', 400);
  return detected;
}

const handleMulterError = (err: any, _req: any, _res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image trop lourde : 5 Mo maximum.'
        : err.code === 'LIMIT_FILE_COUNT'
          ? '10 images maximum par envoi.'
          : 'Envoi du fichier impossible.';
    return next(new CustomError(message, 400));
  }
  next(err);
};

async function ownerOf(userId: string, role: string) {
  if (role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({ where: { userId }, select: { id: true, profilePicture: true } });
    if (!artist) throw new CustomError('Profil artiste introuvable.', 404);
    return { kind: 'artist' as const, ...artist };
  }
  if (role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({ where: { userId }, select: { id: true, profilePicture: true } });
    if (!hotel) throw new CustomError('Profil hôtel introuvable.', 404);
    return { kind: 'hotel' as const, ...hotel };
  }
  throw new CustomError('Accès refusé.', 403);
}

async function setProfilePicture(owner: Awaited<ReturnType<typeof ownerOf>>, url: string | null) {
  if (owner.kind === 'artist') await prisma.artist.update({ where: { id: owner.id }, data: { profilePicture: url } });
  else await prisma.hotel.update({ where: { id: owner.id }, data: { profilePicture: url } });

  // The picture being replaced goes too, if it is a file we stored.
  const previousKey = owner.profilePicture ? storageKeyFromUrl(owner.profilePicture) : null;
  if (owner.profilePicture && previousKey && owner.profilePicture !== url) {
    await removeStoredFile(owner.profilePicture, previousKey);
  }
}

router.post(
  '/profile-picture',
  authenticate,
  authorize('ARTIST', 'HOTEL'),
  upload.single('profilePicture'),
  handleMulterError,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) throw new CustomError('Aucun fichier reçu.', 400);
    const type = assertRealImage(req.file);
    const owner = await ownerOf(req.user!.id, req.user!.role);
    const stored = await storeFile(req.file.buffer, type, 'profile-pictures');
    await setProfilePicture(owner, stored.url);
    res.json({ success: true, data: { url: stored.url, message: 'Photo de profil mise à jour.' } });
  })
);

router.delete('/profile-picture', authenticate, authorize('ARTIST', 'HOTEL'), asyncHandler(async (req: AuthRequest, res) => {
  const owner = await ownerOf(req.user!.id, req.user!.role);
  await setProfilePicture(owner, null);
  res.json({ success: true, data: { url: null } });
}));

/** Gallery photos. Each becomes a media row owned by the caller. */
router.post(
  '/media',
  authenticate,
  authorize('ARTIST', 'HOTEL'),
  upload.array('media', 10),
  handleMulterError,
  asyncHandler(async (req: AuthRequest, res) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) throw new CustomError('Aucun fichier reçu.', 400);

    // Every file is checked before any is stored, so a bad one in a batch
    // does not leave the good ones half-written.
    const types = files.map(assertRealImage);
    const owner = await ownerOf(req.user!.id, req.user!.role);
    const ownerWhere: { artistId?: string; hotelId?: string } =
      owner.kind === 'artist' ? { artistId: owner.id } : { hotelId: owner.id };

    const existing = await prisma.media.count({ where: { ...ownerWhere, kind: 'IMAGE' } });
    if (existing + files.length > MAX_IMAGES) {
      throw new CustomError(`${MAX_IMAGES} photos maximum. Il vous reste ${Math.max(MAX_IMAGES - existing, 0)} place(s).`, 400);
    }

    const created = [];
    for (let i = 0; i < files.length; i++) {
      const stored = await storeFile(files[i].buffer, types[i], 'media');
      created.push(
        await prisma.media.create({
          data: {
            artistId: ownerWhere.artistId,
            hotelId: ownerWhere.hotelId,
            kind: 'IMAGE',
            provider: 'UPLOAD',
            url: stored.url,
            storageKey: stored.storageKey,
            position: existing + i,
          },
          select: mediaSelect,
        })
      );
    }

    const media = created.map(toMediaDTO);
    res.status(201).json({ success: true, data: { media, urls: media.map((m) => m.url) } });
  })
);

export { router as uploadRoutes };
