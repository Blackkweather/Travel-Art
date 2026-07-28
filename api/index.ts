// Vercel Function entry point.
//
// Every /api/* request is rewritten here (see vercel.ts) and handed to the same
// Express app used in local development, so routing and middleware stay in one
// place. The backend is compiled to backend/dist during the build.
import app from '../backend/dist/index.js';

export default app;
