import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import 'leaflet/dist/leaflet.css'

// Get Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Warn if Clerk key is missing
if (!PUBLISHABLE_KEY) {
  console.warn("⚠️ Clerk Publishable Key is missing. Authentication features will be disabled.")
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// App content without Clerk wrapper
const AppContent = (
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
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        {AppContent}
      </ClerkProvider>
    ) : (
      AppContent
    )}
  </React.StrictMode>,
)





















