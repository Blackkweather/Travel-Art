# Travel Art - Deployment Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional)
- SQLite3 (for development)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd travel-art
npm install
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# Key variables to set:
# - JWT_SECRET (generate a secure random string)
# - DATABASE_URL (default: file:./dev.db)
# - CORS_ORIGIN (default: http://localhost:3000)

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npm run migrate

# Seed the database
npm run seed
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# The frontend will proxy API requests to localhost:4000
```

### 4. Start Development Servers

From the root directory:

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:backend  # Backend on port 4000
npm run dev:frontend  # Frontend on port 3000
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Health Check: http://localhost:4000/health

## Production Deployment

### Option 1: Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# For development with hot reload
docker-compose --profile dev up -d
```

### Option 2: Manual Deployment

#### Backend Deployment

```bash
cd backend

# Set production environment variables
export NODE_ENV=production
export JWT_SECRET=your-production-secret
export DATABASE_URL=file:./prod.db
export CORS_ORIGIN=https://yourdomain.com

# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Run migrations
npm run migrate

# Seed production data (optional)
npm run seed

# Start the server
npm start
```

#### Frontend Deployment

```bash
cd frontend

# Set production environment variables
export VITE_API_URL=https://api.yourdomain.com

# Install dependencies
npm ci

# Build the application
npm run build

# Serve the built files with nginx or similar
# Copy dist/ folder to your web server
```

### Option 3: Cloud Deployment

#### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `VITE_API_URL`: Your backend API URL
3. Deploy automatically on push to main branch

#### Railway/Render (Backend)

1. Connect your GitHub repository
2. Set environment variables:
   - `NODE_ENV`: production
   - `JWT_SECRET`: Generate a secure secret
   - `DATABASE_URL`: Use Railway's PostgreSQL or keep SQLite
   - `CORS_ORIGIN`: Your frontend domain
3. Deploy automatically

## Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database Configuration
DATABASE_URL="file:./prod.db"

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (for future implementation)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@travelart.com

# Payment Configuration (for future implementation)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Frontend (.env)

```env
VITE_API_URL=https://api.yourdomain.com
```

## Database Management

### Migrations

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Seeding

```bash
# Seed development database
cd backend
npm run seed

# Seed production database (be careful!)
npm run seed
```

## Monitoring and Logging

### Health Checks

- Backend: `GET /health`
- Returns: `{"status": "OK", "timestamp": "2024-01-01T00:00:00.000Z"}`

### Logging

The application logs to stdout. In production, consider using:
- Winston for structured logging
- Sentry for error tracking
- CloudWatch/DataDog for monitoring

## Security Considerations

1. **JWT Secret**: Use a strong, random secret (32+ characters)
2. **CORS**: Configure CORS_ORIGIN to your actual domain
3. **Rate Limiting**: Adjust rate limits based on your needs
4. **HTTPS**: Always use HTTPS in production
5. **Database**: Consider using PostgreSQL for production instead of SQLite
6. **File Uploads**: Implement proper file validation and storage

## Scaling Considerations

1. **Database**: Migrate from SQLite to PostgreSQL for production
2. **File Storage**: Use AWS S3 or similar for file uploads
3. **Caching**: Implement Redis for session storage and caching
4. **Load Balancing**: Use nginx or similar for load balancing
5. **CDN**: Use CloudFront or similar for static assets

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure DATABASE_URL is correct
2. **CORS Errors**: Check CORS_ORIGIN configuration
3. **JWT Errors**: Verify JWT_SECRET is set correctly
4. **Port Conflicts**: Ensure ports 3000 and 4000 are available

### Debug Mode

```bash
# Enable debug logging
export DEBUG=travel-art:*

# Run with debug
npm run dev
```

## Backup and Recovery

### Database Backup

```bash
# SQLite backup
cp backend/dev.db backend/backup-$(date +%Y%m%d).db

# PostgreSQL backup (if using)
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Recovery

```bash
# Restore from backup
cp backend/backup-20240101.db backend/dev.db

# Or restore PostgreSQL
psql $DATABASE_URL < backup-20240101.sql
```

## Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried fields
2. **Image Optimization**: Compress and resize uploaded images
3. **Caching**: Implement Redis caching for frequently accessed data
4. **CDN**: Use CDN for static assets
5. **Database Connection Pooling**: Configure proper connection limits

## Maintenance

### Regular Tasks

1. **Database Cleanup**: Remove old bookings, expired sessions
2. **Log Rotation**: Rotate application logs
3. **Security Updates**: Keep dependencies updated
4. **Backup Verification**: Test backup restoration procedures
5. **Performance Monitoring**: Monitor response times and error rates



