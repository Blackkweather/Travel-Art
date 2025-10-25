# CDN Setup Guide for Travel Art Logo Assets

## Overview

Your logo wasn't showing in the live version because it was using relative paths (`/logo-transparent.png`) that work in development but fail in production. I've implemented a flexible CDN system that allows you to easily switch between local development and CDN hosting.

## What I've Done

1. **Created Asset Configuration System** (`frontend/src/config/assets.ts`)
   - Centralized asset URL management
   - Support for multiple CDN providers
   - Environment-based configuration

2. **Updated All Logo References**
   - Header component
   - Landing page
   - Login page
   - Register page
   - Partners page
   - Top Artists page
   - Footer component

3. **Environment Configuration** (`frontend/env.example`)
   - Easy switching between CDN providers
   - Development/production mode support

## CDN Options Available

### 1. Cloudinary - RECOMMENDED FOR IMAGES ⭐

**Pros:** Excellent image optimization, automatic format conversion, responsive images, free tier
**Cons:** Requires account setup

**Setup Steps:**
1. Create free Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name from the dashboard
3. Upload your logo files to Cloudinary
4. Update `frontend/.env`:
   ```env
   VITE_CDN_PROVIDER=cloudinary
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_VERSION=v1
   ```
5. Update the URLs in `frontend/src/config/assets.ts` with your actual cloud name

### 2. JSDelivr (GitHub-based) - GOOD FOR QUICK SETUP

**Pros:** Free, easy setup, reliable
**Cons:** Requires GitHub repository

**Setup Steps:**
1. Create a new GitHub repository (e.g., `travel-art-assets`)
2. Upload your logo files to the repository
3. Update `frontend/.env`:
   ```env
   VITE_CDN_PROVIDER=jsdelivr
   VITE_JSDELIVR_USERNAME=yourusername
   VITE_JSDELIVR_REPO=travel-art-assets
   VITE_JSDELIVR_BRANCH=main
   ```
4. Update the URLs in `frontend/src/config/assets.ts` with your actual GitHub details

### 3. Cloudflare R2

**Pros:** Fast, reliable, good pricing
**Cons:** Requires setup

**Setup Steps:**
1. Create Cloudflare R2 bucket
2. Upload logo files
3. Configure public access
4. Update environment variables:
   ```env
   VITE_CDN_PROVIDER=cloudflare
   VITE_CLOUDFLARE_BUCKET=your-bucket
   VITE_CLOUDFLARE_ACCOUNT=your-account
   ```

### 4. AWS S3

**Pros:** Industry standard, reliable
**Cons:** More complex setup

**Setup Steps:**
1. Create S3 bucket
2. Upload logo files
3. Configure public access
4. Update environment variables:
   ```env
   VITE_CDN_PROVIDER=aws
   VITE_AWS_BUCKET=your-bucket
   VITE_AWS_REGION=us-east-1
   ```

### 5. Vercel Blob

**Pros:** Easy integration with Vercel
**Cons:** Vercel-specific

**Setup Steps:**
1. Set up Vercel Blob storage
2. Upload logo files
3. Update environment variables:
   ```env
   VITE_CDN_PROVIDER=vercel
   VITE_VERCEL_BLOB_STORE=your-blob-store
   ```

## Quick Start (Cloudinary Method) - RECOMMENDED ⭐

1. **Create Cloudinary Account:**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for free account
   - Get your cloud name from the dashboard

2. **Upload Logo Files:**
   - In Cloudinary dashboard, click "Upload"
   - Upload your logo files:
     - `logo-transparent.png`
     - `logo-1-final.png`
     - `test-logo.png`
     - `compass-icon.svg`
     - `favicon.svg`
   - Note the public IDs (usually the filename without extension)

3. **Update Configuration:**
   ```bash
   # Create .env file in frontend directory
   cd "C:\MAMP\htdocs\Travel Art\frontend"
   cp env.example .env
   ```

4. **Edit `.env` file:**
   ```env
   VITE_MODE=production
   VITE_CDN_PROVIDER=cloudinary
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_VERSION=v1
   VITE_API_URL=https://your-api-domain.com/api
   ```

5. **Update Asset URLs:**
   Edit `frontend/src/config/assets.ts` and replace `your-cloud-name` with your actual Cloudinary cloud name.

6. **Test:**
   ```bash
   npm run build
   npm run preview
   ```

## Quick Start (JSDelivr Method)

1. **Create GitHub Repository:**
   ```bash
   # Create new repository on GitHub
   # Name it: travel-art-assets
   # Make it public
   ```

2. **Upload Logo Files:**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/travel-art-assets.git
   cd travel-art-assets
   
   # Copy logo files from your project
   cp "C:\MAMP\htdocs\Travel Art\frontend\public\logo-transparent.png" .
   cp "C:\MAMP\htdocs\Travel Art\frontend\public\logo-1-final.png" .
   cp "C:\MAMP\htdocs\Travel Art\frontend\public\test-logo.png" .
   cp "C:\MAMP\htdocs\Travel Art\frontend\public\compass-icon.svg" .
   cp "C:\MAMP\htdocs\Travel Art\frontend\public\favicon.svg" .
   
   # Commit and push
   git add .
   git commit -m "Add logo assets"
   git push origin main
   ```

3. **Update Configuration:**
   ```bash
   # Create .env file in frontend directory
   cd "C:\MAMP\htdocs\Travel Art\frontend"
   cp env.example .env
   ```

4. **Edit `.env` file:**
   ```env
   VITE_MODE=production
   VITE_CDN_PROVIDER=jsdelivr
   VITE_JSDELIVR_USERNAME=yourusername
   VITE_JSDELIVR_REPO=travel-art-assets
   VITE_JSDELIVR_BRANCH=main
   VITE_API_URL=https://your-api-domain.com/api
   ```

5. **Update Asset URLs:**
   Edit `frontend/src/config/assets.ts` and replace `yourusername` with your actual GitHub username.

6. **Test:**
   ```bash
   npm run build
   npm run preview
   ```

## Testing Your Setup

1. **Development Mode:**
   ```bash
   # Should use local assets
   VITE_CDN_PROVIDER=local npm run dev
   ```

2. **Production Mode:**
   ```bash
   # Should use CDN assets
   VITE_CDN_PROVIDER=jsdelivr npm run build
   npm run preview
   ```

## Troubleshooting

### Logo Still Not Showing?

1. **Check CDN URL:** Visit the CDN URL directly in browser
2. **Check Environment Variables:** Ensure `.env` file is correct
3. **Check Console:** Look for 404 errors in browser console
4. **Check Network Tab:** Verify requests are going to CDN

### Common Issues:

1. **CORS Errors:** Some CDNs require CORS configuration
2. **File Permissions:** Ensure files are publicly accessible
3. **Cache Issues:** Clear browser cache and CDN cache
4. **Path Issues:** Verify file paths in CDN are correct

## File Structure

### Cloudinary URLs (Recommended):
- `https://res.cloudinary.com/your-cloud-name/image/upload/v1/logo-transparent.png`
- `https://res.cloudinary.com/your-cloud-name/image/upload/v1/logo-1-final.png`
- `https://res.cloudinary.com/your-cloud-name/image/upload/v1/test-logo.png`
- `https://res.cloudinary.com/your-cloud-name/image/upload/v1/compass-icon.svg`
- `https://res.cloudinary.com/your-cloud-name/image/upload/v1/favicon.svg`

### JSDelivr URLs (Alternative):
- `https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/logo-transparent.png`
- `https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/logo-1-final.png`
- `https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/test-logo.png`
- `https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/compass-icon.svg`
- `https://cdn.jsdelivr.net/gh/yourusername/travel-art-assets@main/favicon.svg`

## Next Steps

1. Choose your preferred CDN method
2. Follow the setup steps
3. Test in both development and production
4. Deploy your updated application

The system is now flexible and will automatically use the appropriate asset URLs based on your environment configuration!
