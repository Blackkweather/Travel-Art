/**
 * Shared TypeScript types and interfaces
 * Used across the application to reduce duplication
 */

/**
 * Common API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Common form field states
 */
export interface FormFieldState {
  value: string;
  error?: string;
  touched: boolean;
  required?: boolean;
}

/**
 * Loading states
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Common date range
 */
export interface DateRange {
  from: Date | string;
  to: Date | string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Notification types
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Common filter options
 */
export interface FilterOptions {
  search?: string;
  category?: string;
  tags?: string[];
  dateRange?: DateRange;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Common entity with timestamps
 */
export interface TimestampedEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * User roles
 */
export type UserRole = 'ARTIST' | 'HOTEL' | 'ADMIN' | 'TRAVELER';

/**
 * Common status types
 */
export type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';

/**
 * Address structure
 */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Contact information
 */
export interface ContactInfo {
  email: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

/**
 * Common error structure
 */
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}







