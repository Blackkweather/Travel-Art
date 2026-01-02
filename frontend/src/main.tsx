import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import 'leaflet/dist/leaflet.css'

// Suppress YouTube iframe postMessage errors in development
// These are harmless cross-origin warnings that occur when YouTube iframe tries to communicate
const isDev = (import.meta.env as any).MODE === 'development' || window.location.hostname === 'localhost'
if (isDev) {
  const originalError = window.console.error
  window.console.error = function(...args: any[]) {
    const message = args[0]?.toString() || ''
    // Suppress YouTube postMessage cross-origin errors (harmless in development)
    if (message.includes('postMessage') && 
        (message.includes('target origin') || message.includes('Failed to execute'))) {
      return
    }
    originalError.apply(window.console, args)
  }
  
  // Also suppress uncaught errors from YouTube iframe
  window.addEventListener('error', (event) => {
    if (event.message?.includes('postMessage') && 
        (event.message.includes('target origin') || event.message.includes('Failed to execute'))) {
      event.preventDefault()
      return false
    }
  }, true)
}

// Global error handler for DOM manipulation errors
// This catches errors that might slip through ErrorBoundary
// Suppress YouTube/React DOM conflicts - these are harmless
window.addEventListener('error', (event) => {
  const error = event.error || new Error(event.message)
  const isDOMError = 
    error.message?.includes('removeChild') ||
    error.message?.includes('insertBefore') ||
    error.message?.includes('appendChild') ||
    error.message?.includes('replaceChild') ||
    error.message?.includes('Failed to execute') ||
    error.name === 'NotFoundError' ||
    error.name === 'HierarchyRequestError'
  
  // Check if it's related to YouTube player (harmless DOM conflicts)
  const isYouTubeRelated = 
    error.message?.includes('youtube') ||
    error.message?.includes('YT') ||
    error.stack?.includes('AmbientAudio') ||
    document.querySelector('[data-youtube-player]')
  
  if (isDOMError && isYouTubeRelated && !event.defaultPrevented) {
    // Suppress these errors - they're harmless conflicts between React and YouTube
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  if (isDOMError && !event.defaultPrevented) {
    console.warn('⚠️ DOM manipulation error caught globally:', error.message)
    // Don't prevent default - let ErrorBoundary handle it
  }
}, true)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// App content wrapped with ErrorBoundary for defensive rendering
// Using stable keys to prevent DOM reuse conflicts
const AppContent = (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      // Log to error tracking service in production
      if (!isDev) {
        console.error('Application error:', error, errorInfo)
        // You can add error tracking here (e.g., Sentry, LogRocket, etc.)
      }
    }}
  >
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#14b8a6',
              color: '#ffffff',
            },
            success: {
              iconTheme: {
                primary: '#ffffff',
                secondary: '#14b8a6',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: '#ef4444',
                color: '#ffffff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)

// Root component with defensive rendering
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {AppContent}
  </React.StrictMode>
)
