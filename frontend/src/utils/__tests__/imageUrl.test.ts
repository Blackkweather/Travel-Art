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

  it('prepends API base URL for relative paths', () => {
    const relativePath = 'images/logo.png';
    const result = normalizeImageUrl(relativePath);
    expect(result).toContain('/api/');
    expect(result).toContain('images/logo.png');
  });

  it('handles paths with leading slash', () => {
    const path = '/images/logo.png';
    const result = normalizeImageUrl(path);
    expect(result).toContain('/api/');
  });
});





