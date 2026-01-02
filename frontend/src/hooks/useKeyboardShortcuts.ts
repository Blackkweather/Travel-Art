import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function useAppKeyboardShortcuts() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Ctrl/Cmd + K: Quick navigation (common pattern)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        // Could open a command palette or search here
        // For now, just navigate to dashboard if logged in
        if (user) {
          navigate('/dashboard')
        }
      }

      // Escape: Close modals or go back
      if (event.key === 'Escape') {
        // This is handled by individual components
        // Just prevent default if needed
      }

      // Ctrl/Cmd + /: Show keyboard shortcuts help
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault()
        // Could show a help modal here
        console.log('Keyboard shortcuts help (to be implemented)')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate, user])
}
