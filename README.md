# Travel Art 🎨

A luxury platform connecting artists with hotels for unique cultural exchange experiences. Artists can showcase their talents at premium hotel venues, while hotels can offer their guests exceptional entertainment and cultural experiences.

![Travel Art](https://img.shields.io/badge/version-1.0.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![React](https://img.shields.io/badge/React-18.2-blue) ![Node.js](https://img.shields.io/badge/Node.js-22.16-green)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### For Artists
- 🎭 Create and manage professional profiles
- 📅 Set availability calendar
- 💰 Manage bookings and earnings
- 📸 Upload portfolio images and videos
- 🌍 Showcase artistic disciplines
- ⭐ Receive ratings and reviews

### For Hotels
- 🏨 Create hotel profiles with performance spaces
- 🔍 Search and discover artists
- 📖 View artist portfolios and availability
- 💳 Credit-based booking system
- 📊 Manage bookings and artist relationships
- ⭐ Rate and review artists

### Platform Features
- 🔐 Secure authentication (Clerk + JWT)
- 💳 Stripe payment integration
- 📧 Email notifications
- 🎵 Ambient audio with scroll-based volume control
- 📱 Fully responsive design
- ♿ Accessibility features
- 🌐 Multi-language support (partial)

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **GSAP** - Advanced animations
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Clerk** - Authentication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** (production) / **SQLite** (development)
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Zod** - Schema validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - Rate limiting

### DevOps & Tools
- **Render.com** - Hosting platform
- **GitHub** - Version control
- **Cypress** - E2E testing
- **Vitest** - Unit testing
- **ESLint** - Linting
- **Docker** - Containerization (optional)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **PostgreSQL** (for production) or SQLite (for development)
- **Clerk Account** (for authentication) - [Sign up](https://clerk.com/)
- **Stripe Account** (for payments) - [Sign up](https://stripe.com/)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Blackkweather/Travel-Art.git
   cd Travel-Art
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Set up environment variables** (see [Environment Variables](#environment-variables))

6. **Set up the database** (see [Database Setup](#database-setup))

## 🔐 Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Copy the example file
cp backend/env.example backend/.env
```

Required variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database Configuration
# For development (SQLite):
DATABASE_URL="file:./prisma/dev.db"

# For production (PostgreSQL):
DATABASE_URL="postgresql://user:password@localhost:5432/travelart"

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (Optional, sent over Resend - see backend/src/services/email.ts)
RESEND_API_KEY=re_your_api_key
RESEND_FROM=Travel Art <noreply@travelart.com>
ADMIN_NOTIFY_EMAIL=admissions@travelart.com

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
# Copy the example file
cp frontend/env.example frontend/.env
```

```env
# API Configuration - leave unset for a same-origin deployment (the backend
# serves the built frontend and answers /api/* itself); only set this when
# the frontend and API are on different origins.
VITE_API_URL=

# CDN Configuration (Optional)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_VERSION=v1
VITE_USE_CLOUDINARY=false
```

## 🏃 Running the Project

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

**Backend:**
```bash
npm run dev:backend
# Backend runs on http://localhost:4000
```

**Frontend:**
```bash
npm run dev:frontend
# Frontend runs on http://localhost:5173
```

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
Travel-Art/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── __tests__/      # Backend tests
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── config.ts       # Configuration
│   │   ├── db.ts           # Database connection
│   │   └── index.ts        # Express app entry
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   ├── uploads/            # Uploaded files
│   └── package.json
│
├── frontend/               # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json
│
├── services/               # Microservices (optional)
├── package.json            # Root package.json
└── README.md
```

## 📜 Available Scripts

### Root Scripts

```bash
# Development
npm run dev                 # Run both frontend and backend
npm run dev:backend        # Run backend only
npm run dev:frontend       # Run frontend only

# Build
npm run build              # Build both frontend and backend
npm run build:backend      # Build backend only
npm run build:frontend     # Build frontend only

# Start
npm start                   # Start production server

# Database
npm run migrate             # Run database migrations
npm run seed               # Seed database with sample data

# Testing
npm test                    # Run all tests
npm run test:backend       # Run backend tests
npm run test:frontend      # Run frontend tests
npm run test:e2e           # Run E2E tests
npm run test:e2e:open      # Open Cypress UI
npm run test:e2e:headless # Run E2E tests headless

# Linting
npm run lint                # Lint both frontend and backend
npm run lint:backend        # Lint backend
npm run lint:frontend       # Lint frontend
```

### Backend Scripts

```bash
cd backend

npm run dev                 # Start development server with hot reload
npm run build               # Build TypeScript to JavaScript
npm start                   # Start production server
npm run migrate             # Run Prisma migrations
npm run seed                # Seed database
npm test                    # Run tests
npm run lint                # Lint code
```

### Frontend Scripts

```bash
cd frontend

npm run dev                 # Start Vite dev server
npm run build               # Build for production
npm run preview             # Preview production build
npm test                    # Run unit tests
npm run test:e2e           # Run E2E tests
npm run lint                # Lint code
npm run lint:fix            # Fix linting issues
```

## 🗄 Database Setup

### Development (SQLite)

SQLite is used by default in development. No additional setup required.

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed
```

### Production (PostgreSQL)

1. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb travelart
   ```

2. **Update DATABASE_URL in backend/.env**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/travelart"
   ```

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Seed database (optional)**
   ```bash
   npm run seed
   ```

### Database Schema

The database schema is defined in `backend/prisma/schema.prisma`. Main models:

- **User** - User accounts
- **Artist** - Artist profiles
- **Hotel** - Hotel profiles
- **Booking** - Booking records
- **Rating** - Reviews and ratings
- **Credit** - Credit system
- **Transaction** - Payment transactions
- **Referral** - Referral system
- **Trip** - Travel experiences
- **Availability** - Artist/hotel availability

## 📚 API Documentation

### Base URL

- **Development:** `http://localhost:4000/api`
- **Production:** `https://your-domain.com/api`

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token

#### Artists
- `GET /api/artists` - List artists
- `GET /api/artists/:id` - Get artist details
- `GET /api/artists/me` - Get current artist profile
- `PUT /api/artists/me` - Update artist profile
- `POST /api/artists/search` - Search artists

#### Hotels
- `GET /api/hotels` - List hotels
- `GET /api/hotels/:id` - Get hotel details
- `GET /api/hotels/me` - Get current hotel profile
- `PUT /api/hotels/me` - Update hotel profile

#### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `GET /api/bookings/:id` - Get booking details

#### Uploads
- `POST /api/upload/profile-picture` - Upload profile picture

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error message here"
  }
}
```

## 🚢 Deployment

### Render.com Deployment

The project is configured for deployment on Render.com.

1. **Connect your GitHub repository** to Render
2. **Create a Web Service** for the backend
3. **Create a Static Site** for the frontend
4. **Set up PostgreSQL database** on Render
5. **Configure environment variables** in Render dashboard
6. **Deploy**

See `render.yaml` for deployment configuration.

### Environment Variables for Production

Ensure all environment variables are set in your hosting platform:

- Database URL
- JWT Secret
- Clerk keys
- Stripe keys
- CORS origins
- Frontend URL

## 🧪 Testing

### Backend Tests

```bash
npm run test:backend
```

Tests are located in `backend/src/__tests__/`

### Frontend Tests

```bash
# Unit tests
npm run test:frontend

# E2E tests
npm run test:e2e
```

### Running All Tests

```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint for code quality
- Write tests for new features
- Update documentation as needed

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem:** Cannot connect to database

**Solution:**
- Check `DATABASE_URL` in `.env`
- Ensure database is running
- Verify credentials are correct
- For PostgreSQL, check if database exists

#### Port Already in Use

**Problem:** Port 4000 or 5173 already in use

**Solution:**
```bash
# Find process using port
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill process or change PORT in .env
```

#### Module Not Found Errors

**Problem:** Cannot find module errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Do this for root, backend, and frontend
```

#### Prisma Client Not Generated

**Problem:** Prisma client errors

**Solution:**
```bash
cd backend
npx prisma generate
```

#### CORS Errors

**Problem:** CORS errors in browser

**Solution:**
- Check `CORS_ORIGIN` in backend `.env`
- Ensure frontend URL matches `CORS_ORIGIN`
- Check browser console for specific error

#### File Upload Issues

**Problem:** Profile pictures not uploading

**Solution:**
- Check `UPLOAD_PATH` exists and is writable
- Verify `MAX_FILE_SIZE` is sufficient
- Check file permissions on upload directory

## 📝 License

This project is proprietary and confidential.

## 👥 Contact

For questions or support, please contact the development team.

---

**Built with ❤️ by the Travel Art Team**








