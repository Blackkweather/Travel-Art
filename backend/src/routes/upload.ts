import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { prisma } from '../db';

const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only images
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

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
  if (err) {
    console.error('❌ Upload error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  next();
};

// Upload profile picture
router.post('/profile-picture', authenticate, upload.single('profilePicture'), handleMulterError, asyncHandler(async (req: AuthRequest, res) => {
  console.log('📤 Upload request received');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request file:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'No file');
  
  if (!req.file) {
    console.error('❌ No file in request');
    console.error('Request headers:', req.headers);
    throw new CustomError('No file uploaded', 400);
  }

  const user = req.user!;
  console.log('👤 User:', { id: user.id, role: user.role });
  const fileUrl = `/uploads/profile-pictures/${req.file.filename}`;
  console.log('📁 File URL:', fileUrl);

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
router.post('/media', authenticate, upload.array('media', 10), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    throw new CustomError('No files uploaded', 400);
  }

  const user = req.user!;
  const files = req.files as Express.Multer.File[];
  const urls = files.map(file => `/uploads/profile-pictures/${file.filename}`);

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
      } catch (e) {
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
  
  if (!url) {
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

  // Delete the physical file
  const filePath = path.join(__dirname, '../..', url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
}));

export { router as uploadRoutes };













