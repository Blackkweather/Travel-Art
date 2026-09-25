import { describe, it, expect } from 'vitest';
import { normalizeImageUrl } from '../imageUrl';

describe('normalizeImageUrl', () => {
  it('returns empty string for null/undefined', () => {
    expect(normalizeImageUrl(null)).toBe('');
    expect(normalizeImageUrl(undefined)).toBe('');
  });

  it('returns absolute URLs as-is', () => {
    const url = 'https://example.com/image.jpg';
    expect(normalizeImageUrl(url)).toBe(url);
  });

  it('returns data URLs as-is', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(normalizeImageUrl(dataUrl)).toBe(dataUrl);
  });

  it('returns upload paths as-is', () => {
    const uploadPath = '/uploads/profile-pictures/image.jpg';
    expect(normalizeImageUrl(uploadPath)).toBe(uploadPath);
  });

  it('returns static /images paths as-is', () => {
    // Seed data and placeholder artwork point here directly; there is no
    // /api/images route, so these must never be prefixed with /api.
    const path = '/images/hero/ombre.webp';
    expect(normalizeImageUrl(path)).toBe(path);
  });

  it('prepends API base URL for other relative paths', () => {
    const relativePath = 'artists/portfolio/photo.png';
    const result = normalizeImageUrl(relativePath);
    expect(result).toContain('/api/');
    expect(result).toContain('artists/portfolio/photo.png');
  });
});








