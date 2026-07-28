import { routes, type VercelConfig } from '@vercel/config/v1';

// The repo is a two-part monorepo: a Vite SPA in frontend/ and an Express API
// in backend/. On Vercel the SPA is served as static output from the CDN and
// the Express app runs as a single Function behind /api/*.
export const config: VercelConfig = {
  buildCommand: 'npm run vercel-build',
  outputDirectory: 'frontend/dist',
  framework: null,

  rewrites: [
    // Everything that is not /api/* or a real static file is an SPA route and
    // must return index.html so client-side routing can take over.
    routes.rewrite('/((?!api/).*)', '/index.html'),
  ],

  headers: [
    routes.cacheControl('/assets/(.*)', {
      public: true,
      maxAge: '1 year',
      immutable: true,
    }),
  ],
};

export default config;
