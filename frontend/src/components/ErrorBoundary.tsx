import React, { Component, ErrorInfo, ReactNode } from 'react'
import { t } from '@/i18n'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Store error info for display
    this.setState({
      errorInfo,
    })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError)
      }
    }
    
    // Check if it's a DOM manipulation error (common with YouTube or other third-party libraries)
    const isDOMError = 
      error.message?.includes('removeChild') ||
      error.message?.includes('insertBefore') ||
      error.message?.includes('appendChild') ||
      error.message?.includes('replaceChild') ||
      error.message?.includes('Failed to execute') ||
      error.name === 'NotFoundError' ||
      error.name === 'HierarchyRequestError'
    
    if (isDOMError) {
      console.warn('⚠️ DOM manipulation error detected. This may be caused by third-party libraries (YouTube, etc.)')
      console.warn('The application will attempt to recover automatically.')
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Check if it's a DOM manipulation error - try to recover
      const isDOMError = 
        this.state.error?.message?.includes('removeChild') ||
        this.state.error?.message?.includes('insertBefore') ||
        this.state.error?.message?.includes('appendChild') ||
        this.state.error?.message?.includes('replaceChild') ||
        this.state.error?.message?.includes('Failed to execute') ||
        this.state.error?.name === 'NotFoundError' ||
        this.state.error?.name === 'HierarchyRequestError'
      
      // For DOM errors, try to render children again after a brief delay
      if (isDOMError) {
        // Auto-recover after 1 second
        setTimeout(() => {
          this.handleReset()
        }, 1000)
        
        // Show minimal error UI during recovery
        return (
          <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface-raised rounded-card shadow-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
              <p className="text-content-secondary">{t('Récupération après une erreur temporaire…')}</p>
            </div>
          </div>
        )
      }
      
      // For other errors, show full error UI
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-raised rounded-card shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-content mb-4">{t('Une erreur est survenue')}</h1>
            <p className="text-content-secondary mb-4">
              {t('Désolé, un incident inattendu s’est produit. Essayez de recharger la page.')}
            </p>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-content-secondary mb-2">
                  {t('Détail de l’erreur')}
                </summary>
                <pre className="text-xs bg-surface-sunken p-2 rounded-card overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-surface-sunken text-content-secondary rounded-card hover:bg-surface-warm transition-colors"
              >
                {t('Réessayer')}
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-navy text-white rounded-card hover:bg-navy/90 transition-colors"
              >
                {t('Recharger la page')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
