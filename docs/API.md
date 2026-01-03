# Travel Art API Documentation

**Base URL:** `http://localhost:4000/api` (development) | `https://your-domain.com/api` (production)

**Version:** 1.0.0

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error message here"
  }
}
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "role": "ARTIST" | "HOTEL",
  "name": "string",
  "email": "string",
  "password": "string (min 8 chars)",
  "phone": "string (optional)",
  "locale": "string (optional, default: 'en')",
  "referralCode": "string (optional)",
  "stageName": "string (optional, for ARTIST)",
  "birthDate": "string (optional, for ARTIST)",
  "country": "string (optional, for ARTIST)",
  "artisticProfile": {
    "mainCategory": "string (optional)",
    "secondaryCategory": "string (optional)",
    "audienceType": ["string"] (optional),
    "languages": ["string"] (optional)
  } (optional, for ARTIST)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "ARTIST" | "HOTEL"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "string"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "string",
  "password": "string"
}
```

---

### Artists

#### Search Artists
```http
GET /api/artists?discipline=string&location=string&dateFrom=ISO8601&dateTo=ISO8601&page=number&limit=number
```

**Query Parameters:**
- `discipline` (optional) - Filter by artistic discipline
- `location` (optional) - Filter by location
- `dateFrom` (optional) - ISO 8601 datetime
- `dateTo` (optional) - ISO 8601 datetime
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "artists": [
      {
        "id": "string",
        "stageName": "string",
        "discipline": "string",
        "bio": "string",
        "profilePicture": "string",
        "user": {
          "id": "string",
          "name": "string",
          "email": "string",
          "country": "string"
        },
        "availability": [...]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

#### Get Artist by ID
```http
GET /api/artists/:id
```

#### Get Current Artist Profile
```http
GET /api/artists/me
Authorization: Bearer <token>
```

**Requires:** ARTIST role

#### Update Artist Profile
```http
PUT /api/artists/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "string (min 10, max 1000, optional)",
  "discipline": "string (min 2, max 50, optional)",
  "priceRange": "string (optional)",
  "stageName": "string (optional)",
  "birthDate": "string (optional)",
  "phone": "string (optional)",
  "profilePicture": "string (optional)",
  "images": "JSON string (optional)",
  "videos": "JSON string (optional)",
  "mediaUrls": "JSON string (optional)",
  "artisticProfile": "JSON string (optional)",
  "user": {
    "update": {
      "country": "string (optional)"
    }
  } (optional)
}
```

**Requires:** ARTIST role

#### Add Availability
```http
POST /api/artists/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "dateFrom": "ISO8601 datetime",
  "dateTo": "ISO8601 datetime"
}
```

**Requires:** ARTIST role

#### Remove Availability
```http
DELETE /api/artists/availability/:id
Authorization: Bearer <token>
```

**Requires:** ARTIST role

---

### Hotels

#### Get All Hotels (Admin)
```http
GET /api/hotels?page=number&limit=number
Authorization: Bearer <token>
```

**Requires:** ADMIN role

#### Get Hotel by ID
```http
GET /api/hotels/:id
```

#### Get Current Hotel Profile
```http
GET /api/hotels/me
Authorization: Bearer <token>
```

**Requires:** HOTEL role

#### Update Hotel Profile
```http
PUT /api/hotels/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string (min 2, max 100, optional)",
  "description": "string (min 10, max 1000, optional)",
  "location": "JSON string (optional)",
  "contactPhone": "string (optional)",
  "images": "JSON string (optional)",
  "performanceSpots": "JSON string (optional)",
  "rooms": "JSON string (optional)",
  "repName": "string (optional)",
  "profilePicture": "string (optional)"
}
```

**Requires:** HOTEL role

---

### Bookings

#### Get Bookings
```http
GET /api/bookings?artistId=string&hotelId=string&status=string&page=number&limit=number
Authorization: Bearer <token>
```

**Query Parameters:**
- `artistId` (optional)
- `hotelId` (optional)
- `status` (optional) - PENDING | CONFIRMED | REJECTED | COMPLETED | CANCELLED
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "string",
        "artistId": "string",
        "hotelId": "string",
        "startDate": "ISO8601",
        "endDate": "ISO8601",
        "status": "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED" | "CANCELLED",
        "creditsUsed": "number",
        "notes": "string",
        "artist": { ... },
        "hotel": { ... }
      }
    ],
    "pagination": { ... }
  }
}
```

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "hotelId": "string",
  "artistId": "string",
  "startDate": "ISO8601 datetime",
  "endDate": "ISO8601 datetime",
  "creditsUsed": "number (positive integer)",
  "notes": "string (optional)"
}
```

**Requires:** HOTEL role

#### Update Booking Status
```http
PUT /api/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED" | "CANCELLED"
}
```

#### Get Booking by ID
```http
GET /api/bookings/:id
Authorization: Bearer <token>
```

#### Submit Rating
```http
POST /api/bookings/rating
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "string",
  "hotelId": "string",
  "artistId": "string",
  "stars": "number (1-5)",
  "textReview": "string (min 10, max 500)",
  "isVisibleToArtist": "boolean (optional, default: false)"
}
```

---

### Payments

#### Get Credit Packages
```http
GET /api/payments/packages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "package-1",
      "name": "Starter Package",
      "credits": 5,
      "price": 49.99,
      "discount": 0,
      "description": "string",
      "isActive": true
    }
  ]
}
```

#### Purchase Credits
```http
POST /api/payments/credits/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "hotelId": "string",
  "packageId": "string",
  "paymentMethod": "string"
}
```

**Requires:** HOTEL role

#### Get Transactions
```http
GET /api/payments/transactions?hotelId=string&artistId=string&page=number&limit=number
Authorization: Bearer <token>
```

---

### Uploads

#### Upload Profile Picture
```http
POST /api/upload/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

profilePicture: File (image, max 5MB)
```

**Allowed Types:** JPEG, PNG, GIF, WebP

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/profile-pictures/filename.jpg",
    "message": "Profile picture uploaded successfully"
  }
}
```

#### Upload Media Files
```http
POST /api/upload/media
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: File[] (images/videos, max 10MB each)
```

#### Delete File
```http
DELETE /api/upload/file
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "string"
}
```

---

### Common

#### Get Referral Code
```http
GET /api/common/referral-code
Authorization: Bearer <token>
```

#### Check Referral Code
```http
GET /api/common/referral/:code
```

---

### Trips

#### Get All Trips
```http
GET /api/trips?status=string&page=number&limit=number
```

#### Get Trip by ID
```http
GET /api/trips/:id
```

#### Create Trip
```http
POST /api/trips
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "destination": "string",
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "status": "DRAFT" | "PUBLISHED"
}
```

#### Update Trip
```http
PUT /api/trips/:id
Authorization: Bearer <token>
```

#### Delete Trip
```http
DELETE /api/trips/:id
Authorization: Bearer <token>
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

## Rate Limiting

- **Window:** 15 minutes (900,000ms)
- **Max Requests:** 100 per window
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

## Pagination

Most list endpoints support pagination:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10-50 depending on endpoint)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## File Upload Limits

- **Profile Pictures:** 5MB max
- **Media Files:** 10MB max per file
- **Allowed Types:** JPEG, PNG, GIF, WebP (images), MP4, MOV (videos)

## Date Formats

All dates should be in ISO 8601 format:
- `2024-12-25T10:00:00Z`
- `2024-12-25T10:00:00+00:00`

## Examples

### Complete Registration Flow

```bash
# 1. Register as Artist
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ARTIST",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "stageName": "Johnny",
    "country": "USA"
  }'

# 2. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# 3. Update Profile (use token from login)
curl -X PUT http://localhost:4000/api/artists/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "I am a professional musician",
    "discipline": "Music"
  }'

# 4. Upload Profile Picture
curl -X POST http://localhost:4000/api/upload/profile-picture \
  -H "Authorization: Bearer <token>" \
  -F "profilePicture=@/path/to/image.jpg"

# 5. Add Availability
curl -X POST http://localhost:4000/api/artists/availability \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "2024-12-25T00:00:00Z",
    "dateTo": "2024-12-31T23:59:59Z"
  }'
```

---

**Last Updated:** December 2024







