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

Sent over [Resend](https://resend.com) (`backend/src/services/email.ts`), not SMTP.
Every send degrades gracefully rather than failing the request it's part of:
with no `RESEND_API_KEY`, verification, password-reset and admin-alert emails
are skipped and logged, and registration/reset still succeed.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | No | - | Resend API key. Unset means no email is ever sent. |
| `RESEND_FROM` | No | `Travel Art <onboarding@resend.dev>` | Sender address. The default is Resend's shared sandbox sender, which works with no domain verified but is visibly not travelart.com. |
| `ADMIN_NOTIFY_EMAIL` | No | - | Address that receives a "new application to review" email on every artist/hotel registration. Unset means no one is notified. |

**Example:**
```env
RESEND_API_KEY=re_your_api_key
RESEND_FROM=Travel Art <noreply@travelart.com>
ADMIN_NOTIFY_EMAIL=admissions@travelart.com
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

---

## Frontend Environment Variables

Location: `frontend/.env`

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `/api` (relative) | Backend API URL. Leave unset for a same-origin deployment (the backend serves the built frontend and answers `/api/*` itself, which is how both Vercel and the Render setup in `render.yaml` are configured) - setting an absolute URL splits the app across two origins and makes CORS load-bearing again. |

**Only needed when the frontend and API are on different origins:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

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
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (if using payments)
- [ ] `RESEND_API_KEY` (if sending email)

Frontend:
- [ ] `VITE_API_URL` (only if the frontend and API are on different origins)

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

# Email (Optional, sent over Resend - see backend/src/services/email.ts)
RESEND_API_KEY=
RESEND_FROM=
ADMIN_NOTIFY_EMAIL=

# Stripe (Optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Frontend (.env)
```env
# API - leave unset for a same-origin deployment; see the note above
VITE_API_URL=

# CDN (Optional)
VITE_CDN_PROVIDER=local
VITE_USE_CLOUDINARY=false
```

---

**Last Updated:** December 2024








