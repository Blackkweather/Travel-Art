// Every /api/* request is rewritten to this single Node function by vercel.json.
//
// The Express app owns its own routing table (app.use('/api/auth', …)), so it is
// exported whole rather than split into a function per route. One function means
// one warm instance and one Prisma connection pool, which matters against a
// pooled Neon database.
//
// This was briefly an api/[...path].ts catch-all instead. That deployed, but its
// generated route only ever matched a single segment: /api/artists reached
// Express while /api/auth/me returned Vercel's own NOT_FOUND without ever
// invoking the function. An explicit rewrite is unambiguous.
//
// backend/src/index.ts skips app.listen when process.env.VERCEL is set, so
// importing it here does not try to bind a port.
export { default } from '../backend/src/index';
