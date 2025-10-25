# Travel Art API Documentation

## Base URL
- Development: `http://localhost:4000/api`
- Production: `https://api.travelart.com/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "role": "ARTIST" | "HOTEL",
  "name": "string",
  "email": "string",
  "password": "string",
  "locale": "string" // optional, defaults to "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "role": "string",
      "name": "string",
      "email": "string",
      "createdAt": "string"
    },
    "token": "string"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
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
    "user": {
      "id": "string",
      "role": "string",
      "name": "string",
      "email": "string",
      "artist": {}, // if role is ARTIST
      "hotel": {}   // if role is HOTEL
    },
    "token": "string"
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string"
  }
}
```

#### GET /auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "role": "string",
      "name": "string",
      "email": "string",
      "country": "string",
      "language": "string",
      "createdAt": "string",
      "artist": {}, // if role is ARTIST
      "hotel": {}   // if role is HOTEL
    }
  }
}
```

### Artists

#### GET /artists
Search and filter artists.

**Query Parameters:**
- `discipline` (string, optional): Filter by discipline
- `location` (string, optional): Filter by location/country
- `dateFrom` (string, optional): Filter by availability start date
- `dateTo` (string, optional): Filter by availability end date
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "artists": [
      {
        "id": "string",
        "bio": "string",
        "discipline": "string",
        "priceRange": "string",
        "images": ["string"],
        "videos": ["string"],
        "mediaUrls": ["string"],
        "ratingBadge": "string", // e.g., "Top 10% Performer"
        "user": {
          "id": "string",
          "name": "string",
          "country": "string"
        },
        "availability": []
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

#### GET /artists/:id
Get public artist profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "bio": "string",
    "discipline": "string",
    "priceRange": "string",
    "membershipStatus": "string",
    "images": ["string"],
    "videos": ["string"],
    "mediaUrls": ["string"],
    "ratingBadge": "string",
    "user": {
      "id": "string",
      "name": "string",
      "country": "string",
      "createdAt": "string"
    },
    "availability": []
  }
}
```

#### POST /artists
Create or update artist profile.

**Headers:** `Authorization: Bearer <token>` (Artist only)

**Request Body:**
```json
{
  "bio": "string",
  "discipline": "string",
  "priceRange": "string",
  "images": "string", // JSON string
  "videos": "string", // JSON string
  "mediaUrls": "string" // JSON string
}
```

#### POST /artists/:id/availability
Set artist availability.

**Headers:** `Authorization: Bearer <token>` (Artist only)

**Request Body:**
```json
{
  "dateFrom": "string", // ISO date string
  "dateTo": "string"    // ISO date string
}
```

### Hotels

#### GET /hotels/:id
Get hotel profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "location": {
      "city": "string",
      "country": "string",
      "coords": {
        "lat": 0,
        "lng": 0
      }
    },
    "contactPhone": "string",
    "images": ["string"],
    "performanceSpots": [
      {
        "name": "string",
        "type": "lounge" | "resto" | "pool" | "ballroom",
        "capacity": 0
      }
    ],
    "rooms": [
      {
        "id": "string",
        "name": "string",
        "capacity": 0
      }
    ],
    "repName": "string",
    "user": {
      "id": "string",
      "name": "string",
      "country": "string",
      "createdAt": "string"
    },
    "availabilities": []
  }
}
```

#### POST /hotels
Create or update hotel profile.

**Headers:** `Authorization: Bearer <token>` (Hotel only)

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "location": "string", // JSON string
  "contactPhone": "string",
  "images": "string", // JSON string
  "performanceSpots": "string", // JSON string
  "rooms": "string", // JSON string
  "repName": "string"
}
```

#### POST /hotels/:id/rooms
Add room availability.

**Headers:** `Authorization: Bearer <token>` (Hotel only)

**Request Body:**
```json
{
  "roomId": "string",
  "dateFrom": "string", // ISO date string
  "dateTo": "string",   // ISO date string
  "price": 0 // optional
}
```

#### POST /hotels/:id/credits/purchase
Purchase credits.

**Headers:** `Authorization: Bearer <token>` (Hotel only)

**Request Body:**
```json
{
  "amount": 0,
  "credits": 0
}
```

#### GET /hotels/:id/artists
Browse artists with filters.

**Headers:** `Authorization: Bearer <token>` (Hotel only)

**Query Parameters:** Same as `/artists` endpoint

#### POST /hotels/:id/bookings
Request booking.

**Headers:** `Authorization: Bearer <token>` (Hotel only)

**Request Body:**
```json
{
  "artistId": "string",
  "startDate": "string", // ISO date string
  "endDate": "string",   // ISO date string
  "specialRequests": "string" // optional
}
```

#### POST /hotels/:id/bookings/:bookingId/confirm
Confirm booking (consumes credits).

**Headers:** `Authorization: Bearer <token>` (Hotel only)

#### POST /hotels/:id/bookings/:bookingId/rate
Rate artist after stay.

**Headers:** `Authorization: Bearer <token>` (Hotel only)

**Request Body:**
```json
{
  "stars": 1-5,
  "textReview": "string"
}
```

### Admin

#### GET /admin/dashboard
Get admin dashboard data.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 0,
      "totalArtists": 0,
      "totalHotels": 0,
      "activeBookings": 0,
      "totalRevenue": 0
    },
    "recentBookings": [],
    "topArtists": [],
    "topHotels": []
  }
}
```

#### GET /admin/users
Get all users with pagination.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `role` (string, optional): Filter by role
- `search` (string, optional): Search by name or email

#### POST /admin/users/:id/suspend
Suspend user.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "reason": "string"
}
```

#### POST /admin/users/:id/activate
Activate user.

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### GET /admin/bookings
Get all bookings with pagination.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `status` (string, optional): Filter by status

#### GET /admin/export
Export data as CSV.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `type` (string, required): "bookings" or "users"

### Common

#### POST /referrals
Create referral.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "inviteeEmail": "string",
  "inviteeName": "string"
}
```

#### GET /top
Get top artists or hotels.

**Query Parameters:**
- `type` (string, required): "artists" or "hotels"
- `period` (string, optional): "month" (default)

#### GET /stats
Get public platform statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalArtists": 0,
    "totalHotels": 0,
    "totalBookings": 0,
    "activeBookings": 0
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "string",
    "stack": "string" // only in development
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to 100 requests per 15 minutes per IP address.




