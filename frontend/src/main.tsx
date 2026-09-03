import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { I18nProvider, t } from './i18n'
import './index.css'

// Two global error handlers used to sit here. Both existed only to swallow
// what the ambient-audio YouTube iframe threw at React - postMessage
// cross-origin warnings, and removeChild/insertBefore failures caused by
// YouTube mutating DOM that React believed it owned. One of them monkey-
// patched window.console.error. The iframe is gone, so what they were
// suppressing cannot happen; keeping them would only hide real errors.

// index.html carries a static French title, which is right for the default
// language and wrong once someone switches. Set before the first render, so
// there is no flash of the other language in the tab; a page that sets its own
// title through SEOHead still wins, because its effect runs after this.
document.title = t('Travel Art — Résidences d’artistes en hôtellerie d’exception')

const isDev = import.meta.env.MODE === 'development'

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
        <I18nProvider>
          <App />
        </I18nProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#B99851',
              color: '#14161A',
            },
            success: {
              iconTheme: {
                primary: '#14161A',
                secondary: '#B99851',
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
