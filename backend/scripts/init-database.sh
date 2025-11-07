#!/bin/bash

# Database Initialization Script for Travel Art
# This script initializes the database on first deployment

set -e

echo "🚀 Travel Art - Database Initialization"
echo "========================================"

# Navigate to backend directory
cd "$(dirname "$0")/.." || exit 1

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL environment variable not set"
    echo "   Using default: file:./prisma/dev.db"
    export DATABASE_URL="file:./prisma/dev.db"
fi

echo "📊 Database URL: $DATABASE_URL"

# Check if database directory exists
DB_DIR="./prisma"
if [ ! -d "$DB_DIR" ]; then
    echo "📁 Creating prisma directory..."
    mkdir -p "$DB_DIR"
fi

# Check if migrations exist
if [ ! -d "$DB_DIR/migrations" ]; then
    echo "⚠️  No migrations found. Creating initial migration..."
    npx prisma migrate dev --name init --create-only || true
fi

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || {
    echo "❌ Migration failed. Attempting to create database..."
    npx prisma migrate dev --name init || true
    npx prisma migrate deploy || true
}

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Check if database needs seeding
DB_EXISTS=false
if [ -f "./prisma/dev.db" ] || [ -f "./prisma/prod.db" ]; then
    DB_EXISTS=true
fi

if [ "$DB_EXISTS" = false ] || [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run seed || echo "⚠️  Seeding failed or skipped"
else
    echo "ℹ️  Database exists. Skipping seed (set SEED_DATABASE=true to force)"
fi

echo ""
echo "✅ Database initialization complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify database connection with: npx prisma studio"
echo "   2. Check health endpoint: curl http://localhost:4000/health"
echo "   3. Test login with demo credentials"





















