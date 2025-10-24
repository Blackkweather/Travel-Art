# Travel Art - Luxury Hotel & Artist Exchange Platform

A production-ready web application connecting luxury hotels with artists for accommodation and experiences.

> **Applied Club Med Live-inspired redesign — Travel Art 2025**

## Features

- **Artist Portal**: Profile creation, availability management, booking tracking
- **Hotel Portal**: Artist browsing, booking management, rating system
- **Admin Dashboard**: User management, analytics, export tools
- **Credit System**: Hotel credit purchases and consumption
- **Rating System**: Hotels rate artists (numeric ratings hidden from artists)
- **Referral System**: Points-based loyalty program
- **Multi-language**: English and French support
- **Responsive Design**: Mobile-first luxury UI

## Tech Stack

- **Frontend**: React 18, TypeScript, reactbits.dev components
- **Backend**: Node.js, TypeScript, Express
- **Database**: SQLite3 with Prisma ORM
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS with Club Med Live-inspired luxury design system

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Initialize database**:
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Default Users

After seeding, you can log in with:

- **Admin**: admin@travelart.test / Password123!
- **Artist**: artist1@example.com / password123
- **Hotel**: hotel1@example.com / password123

## Project Structure

```
travel-art/
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js TypeScript backend
├── docs/             # API documentation
└── tests/            # E2E tests
```

## API Documentation

See `docs/api.md` for complete API reference.

## Testing

```bash
# Run all tests
npm run test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run E2E tests
npm run test:e2e
```

## Deployment

See `docs/deployment.md` for production deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

