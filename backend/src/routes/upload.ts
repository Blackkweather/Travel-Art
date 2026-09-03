import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { put, del } from '@vercel/blob';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { prisma } from '../db';
import { detectImageType, looksLikeMarkup } from '../services/fileType';

const router = Router();

// Serverless filesystems are ephemeral and per-instance, so uploaded files
// written to disk disappear between invocations. Use Vercel Blob whenever a
// token is present and fall back to local disk for development.
const useBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const localUploadDir = path.join(__dirname, '../../uploads/profile-pictures');

// Files are held in memory and forwarded to Blob, or written to disk locally.
const storage = multer.memoryStorage();

/**
 * A cheap first pass only.
 *
 * multer runs this before the body is buffered, so the bytes are not available
 * yet and the declared Content-Type is all there is to test. It rejects the
 * obviously wrong early to avoid buffering 5MB of nonsense - it is NOT the
 * control that decides what a file is. That happens in assertRealImage(), once
 * the bytes exist.
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier invalide. Seules les images JPEG, PNG, GIF et WebP sont acceptées.'));
  }
};

/**
 * The control that actually decides. Reads the file's own leading bytes and
 * returns the type they prove, ignoring everything the request claimed.
 */
const assertRealImage = (file: Express.Multer.File) => {
  const detected = detectImageType(file.buffer);
  if (!detected) {
    throw new CustomError(
      'Ce fichier n’est pas une image valide. Formats acceptés : JPEG, PNG, GIF, WebP.',
      400
    );
  }
  if (looksLikeMarkup(file.buffer)) {
    throw new CustomError('Ce fichier a été refusé pour des raisons de sécurité.', 400);
  }
  return detected;
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

/**
 * Persists an uploaded file and returns the URL clients should use.
 * Blob returns an absolute URL; the local fallback returns a path served by
 * the /uploads static handler.
 */
const storeFile = async (file: Express.Multer.File): Promise<string> => {
  // Extension and Content-Type both come from the detected type. Taking the
  // extension from originalname let the uploader choose what the file would be
  // saved as; passing file.mimetype to put() let them choose what it would be
  // served as. The filename itself is discarded entirely - a UUID replaces it,
  // so a crafted name cannot traverse a path or collide with another user's.
  const detected = assertRealImage(file);
  const key = `profile-pictures/${randomUUID()}${detected.ext}`;

  if (useBlobStorage) {
    const blob = await put(key, file.buffer, {
      access: 'public',
      contentType: detected.mime
    });
    return blob.url;
  }

  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
  fs.writeFileSync(path.join(localUploadDir, path.basename(key)), file.buffer);
  return `/uploads/${key}`;
};

/** Removes a stored file. Missing files are not treated as an error. */
const removeFile = async (url: string): Promise<void> => {
  if (url.startsWith('http')) {
    await del(url);
    return;
  }

  // Local fallback. Resolve inside the upload directory so a crafted URL
  // cannot escape it.
  const filePath = path.join(localUploadDir, path.basename(url));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Error handling middleware for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  // Anything that is not a multer error belongs to whoever threw it - most
  // importantly the 401 from `authenticate`, which used to be rewritten to 400
  // here and left the client unable to tell "sign in" from "bad file".
  if (err) {
    return next(err);
  }
  next();
};

// Upload profile picture
router.post('/profile-picture', authenticate, upload.single('profilePicture'), handleMulterError, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    throw new CustomError('No file uploaded', 400);
  }

  const user = req.user!;
  const fileUrl = await storeFile(req.file);

  // Update user's profile picture based on role
  if (user.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({
      where: { userId: user.id }
    });

    if (!artist) {
      throw new CustomError('Artist profile not found', 404);
    }

    await prisma.artist.update({
      where: { id: artist.id },
      data: { profilePicture: fileUrl }
    });
  } else if (user.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({
      where: { userId: user.id }
    });

    if (!hotel) {
      throw new CustomError('Hotel profile not found', 404);
    }

    await prisma.hotel.update({
      where: { id: hotel.id },
      data: { profilePicture: fileUrl }
    });
  }

  res.json({
    success: true,
    data: {
      url: fileUrl,
      message: 'Profile picture uploaded successfully'
    }
  });
}));

// Upload multiple media files (images/videos for portfolio)
router.post('/media', authenticate, upload.array('media', 10), handleMulterError, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    throw new CustomError('No files uploaded', 400);
  }

  const user = req.user!;
  const files = req.files as Express.Multer.File[];
  const urls = await Promise.all(files.map(storeFile));

  // For artists, add to their media gallery
  if (user.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({
      where: { userId: user.id }
    });

    if (!artist) {
      throw new CustomError('Artist profile not found', 404);
    }

    // Parse existing media URLs
    let existingUrls: string[] = [];
    if (artist.mediaUrls) {
      try {
        existingUrls = JSON.parse(artist.mediaUrls);
      } catch {
        existingUrls = [];
      }
    }

    // Add new URLs
    const updatedUrls = [...existingUrls, ...urls];

    await prisma.artist.update({
      where: { id: artist.id },
      data: { mediaUrls: JSON.stringify(updatedUrls) }
    });
  }

  res.json({
    success: true,
    data: {
      urls,
      message: 'Media files uploaded successfully'
    }
  });
}));

// Delete uploaded file
router.delete('/file', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    throw new CustomError('File URL is required', 400);
  }

  // Verify the file belongs to the user
  const user = req.user!;
  let authorized = false;

  if (user.role === 'ARTIST') {
    const artist = await prisma.artist.findUnique({
      where: { userId: user.id }
    });

    if (artist) {
      if (artist.profilePicture === url) {
        authorized = true;
        await prisma.artist.update({
          where: { id: artist.id },
          data: { profilePicture: null }
        });
      } else if (artist.mediaUrls) {
        const mediaUrls = JSON.parse(artist.mediaUrls);
        if (mediaUrls.includes(url)) {
          authorized = true;
          const updatedUrls = mediaUrls.filter((u: string) => u !== url);
          await prisma.artist.update({
            where: { id: artist.id },
            data: { mediaUrls: JSON.stringify(updatedUrls) }
          });
        }
      }
    }
  } else if (user.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({
      where: { userId: user.id }
    });

    if (hotel && hotel.profilePicture === url) {
      authorized = true;
      await prisma.hotel.update({
        where: { id: hotel.id },
        data: { profilePicture: null }
      });
    }
  }

  if (!authorized) {
    throw new CustomError('Unauthorized to delete this file', 403);
  }

  await removeFile(url);

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
}));

export { router as uploadRoutes };
