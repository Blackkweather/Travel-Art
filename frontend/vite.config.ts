import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',

    // Was `true`, which shipped 7.2MB of .map files next to a 1.8MB bundle and
    // published the original source with it. Nothing in this project consumes
    // them - there is no error tracker wired up - so they are not built at
    // all rather than written and never read. Switch to 'hidden' if a tracker
    // like Sentry is added later: that keeps the files for upload while still
    // omitting the //# sourceMappingURL comment browsers follow.
    sourcemap: false,

    rollupOptions: {
      output: {
        // Only React is named by hand. It is on every route, it is stable
        // across deploys, and pulling it out means app changes stop
        // invalidating its cached copy.
        //
        // recharts and leaflet are deliberately NOT listed. Naming them
        // hoisted each out of the lazy route that owns it - AdminAnalytics
        // and TravelerExperiences - into a chunk Vite modulepreloads from
        // index.html, so every visitor to the homepage fetched 370KB of a
        // charting library used on one admin screen. Rollup already splits
        // them correctly from the lazy() imports.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // PageTransition wraps every route, so framer-motion is on the
          // critical path whatever happens. Naming it keeps a stable 109KB
          // vendor out of the entry chunk, so shipping app code does not
          // invalidate its cached copy.
          'motion': ['framer-motion'],
        },
      },
    },
  },
} satisfies UserConfig



