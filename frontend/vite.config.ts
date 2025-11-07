import type { UserConfig } from 'vite'
import path from 'path'

// Dynamic import to handle missing packages gracefully
let reactPlugin: any = null
try {
  reactPlugin = require('@vitejs/plugin-react')
} catch (e) {
  console.warn('@vitejs/plugin-react not found, using basic config')
}

// https://vitejs.dev/config/
export default {
  plugins: reactPlugin ? [reactPlugin()] : [],
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
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
} satisfies UserConfig



