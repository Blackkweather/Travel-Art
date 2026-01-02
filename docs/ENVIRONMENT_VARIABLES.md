# Environment Variables Documentation

Complete guide to all environment variables used in the Travel Art application.

## Backend Environment Variables

Location: `backend/.env`

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Port number for the backend server |
| `NODE_ENV` | No | `development` | Environment mode: `development`, `production`, `test` |

### JWT Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | - | Secret key for signing JWT tokens. **Must be changed in production!** |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration time (e.g., `7d`, `24h`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token expiration time |

**Security Note:** Generate a strong random secret:
```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | - | Database connection string |

**Development (SQLite):**
```env
DATABASE_URL="file:./prisma/dev.db"
```

**Production (PostgreSQL):**
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**Supabase Example:**
```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin for backend |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend application URL |

**Production Example:**
```env
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Time window for rate limiting (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Maximum requests per window |

### File Upload Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_FILE_SIZE` | No | `10485760` | Maximum file size in bytes (10MB) |
| `UPLOAD_PATH` | No | `./uploads` | Directory for uploaded files |

### Email Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | - | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASS` | No | - | SMTP password |
| `FROM_EMAIL` | No | `noreply@travelart.com` | Default sender email address |

**Example (Gmail):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@travelart.com
```

**Example (SendGrid):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@travelart.com
```

### Payment Configuration (Stripe)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | No | - | Stripe secret key (starts with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | No | - | Stripe webhook signing secret (starts with `whsec_`) |

**Getting Stripe Keys:**
1. Sign up at https://stripe.com
2. Go to Developers > API keys
3. Copy your secret key
4. For webhooks, go to Developers > Webhooks and create an endpoint

### Clerk Authentication (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLERK_SECRET_KEY` | No | - | Clerk secret key (starts with `sk_`) |
| `CLERK_PUBLISHABLE_KEY` | No | - | Clerk publishable key (starts with `pk_`) |
| `CLERK_WEBHOOK_SECRET` | No | - | Clerk webhook signing secret |

**Getting Clerk Keys:**
1. Sign up at https://clerk.com
2. Create a new application
3. Go to API Keys section
4. Copy secret and publishable keys
5. For webhooks, go to Webhooks section and create endpoint

---

## Frontend Environment Variables

Location: `frontend/.env`

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | - | Backend API URL |

**Development:**
```env
VITE_API_URL=http://localhost:4000/api
```

**Production:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Clerk Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes** | - | Clerk publishable key (starts with `pk_`) |

### CDN Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_CDN_PROVIDER` | No | `local` | CDN provider: `local`, `cloudinary`, `jsdelivr`, `cloudflare`, `aws`, `vercel` |
| `VITE_USE_CLOUDINARY` | No | `false` | Whether to use Cloudinary for assets |
| `VITE_CLOUDINARY_CLOUD_NAME` | No | - | Cloudinary cloud name |
| `VITE_CLOUDINARY_VERSION` | No | - | Cloudinary version |

**Cloudinary Example:**
```env
VITE_CDN_PROVIDER=cloudinary
VITE_USE_CLOUDINARY=true
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_VERSION=v1
```

### Logo URL Overrides (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_LOGO_FINAL_URL` | No | - | Override URL for main logo |
| `VITE_LOGO_TRANSPARENT_URL` | No | - | Override URL for transparent logo |

---

## Environment Setup Guide

### 1. Development Setup

**Backend:**
```bash
cd backend
cp env.example .env
# Edit .env with your values
```

**Frontend:**
```bash
cd frontend
cp env.example .env
# Edit .env with your values
```

### 2. Production Setup

**Render.com:**
1. Go to your service settings
2. Navigate to Environment
3. Add all required variables
4. Save changes

**Environment Variables Checklist:**

Backend:
- [ ] `PORT`
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (strong random value)
- [ ] `DATABASE_URL`
- [ ] `CORS_ORIGIN`
- [ ] `FRONTEND_URL`
- [ ] `STRIPE_SECRET_KEY` (if using payments)
- [ ] `CLERK_SECRET_KEY` (if using Clerk)

Frontend:
- [ ] `VITE_API_URL`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY`

### 3. Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use different secrets for dev/prod**
3. **Rotate secrets regularly**
4. **Use strong random values for JWT_SECRET**
5. **Limit CORS_ORIGIN to specific domains in production**
6. **Use environment-specific database URLs**

### 4. Validation

**Backend:**
The app will validate required variables on startup. Missing required variables will cause errors.

**Frontend:**
Vite will replace `VITE_*` variables at build time. Missing variables will be `undefined`.

### 5. Troubleshooting

**Database Connection Issues:**
- Verify `DATABASE_URL` format
- Check database is accessible
- Verify credentials

**CORS Errors:**
- Ensure `CORS_ORIGIN` matches frontend URL
- Check `FRONTEND_URL` is correct
- Verify no trailing slashes

**Authentication Issues:**
- Verify `JWT_SECRET` is set
- Check token expiration settings
- Verify Clerk keys if using Clerk

**File Upload Issues:**
- Check `UPLOAD_PATH` exists and is writable
- Verify `MAX_FILE_SIZE` is sufficient
- Check file permissions

---

## Example .env Files

### Backend (.env)
```env
# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database
DATABASE_URL="file:./prisma/dev.db"

# CORS
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@travelart.com

# Stripe (Optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Clerk (Optional)
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_WEBHOOK_SECRET=
```

### Frontend (.env)
```env
# API
VITE_API_URL=http://localhost:4000/api

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# CDN (Optional)
VITE_CDN_PROVIDER=local
VITE_USE_CLOUDINARY=false
```

---

**Last Updated:** December 2024





