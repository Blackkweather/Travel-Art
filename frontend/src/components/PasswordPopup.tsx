import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const PASSWORD = 'MILY12345'
const STORAGE_KEY = 'travel_art_password_entered'
const PASSWORD_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes in milliseconds
const HERO_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'

// Use sessionStorage instead of localStorage - clears when browser/tab closes
const getStorage = () => {
  try {
    return sessionStorage
  } catch {
    return null
  }
}

const PasswordPopup: React.FC = () => {
  console.log('🔒🔒🔒 PasswordPopup COMPONENT LOADED AND RENDERING')
  const [isOpen, setIsOpen] = useState(true) // FORCE TRUE FOR TESTING
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log('🔒 PasswordPopup useEffect - FORCING TO SHOW')
    console.log('🔒 isOpen state:', isOpen)
    console.log('🔒 document.body exists:', !!document.body)
    document.body.style.overflow = 'hidden'
    
    // Check for reset flag in URL (for testing: ?reset-password=true)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('reset-password') === 'true') {
      const storage = getStorage()
      if (storage) {
        try {
          storage.removeItem(STORAGE_KEY)
        } catch (e) {
          console.log('Could not clear sessionStorage:', e)
        }
      }
    }
    
    // Check if password was entered and if it's still valid (within 10 minutes)
    let shouldShowPopup = true
    const storage = getStorage()
    if (storage) {
      try {
        const savedTimestamp = storage.getItem(STORAGE_KEY)
        if (savedTimestamp) {
          const timestamp = parseInt(savedTimestamp, 10)
          const now = Date.now()
          const timePassed = now - timestamp
          
          // If less than 10 minutes have passed, don't show popup
          if (timePassed < PASSWORD_EXPIRY_MS) {
            shouldShowPopup = false
          }
        }
      } catch (e) {
        // If sessionStorage is not available, show popup anyway
        console.log('sessionStorage not available, showing popup:', e)
        shouldShowPopup = true
      }
    }
    
    // FORCE SHOW FOR TESTING - REMOVE THIS LATER
    setIsOpen(true)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Simulate verification delay
    setTimeout(() => {
      if (password === PASSWORD) {
        const storage = getStorage()
        if (storage) {
          try {
            // Store current timestamp - will be cleared when browser/tab closes
            storage.setItem(STORAGE_KEY, Date.now().toString())
          } catch (e) {
            console.log('Could not save to sessionStorage:', e)
            // Still close popup even if sessionStorage fails
          }
        }
        setIsOpen(false)
        document.body.style.overflow = ''
      } else {
        setError('Incorrect password. Please try again.')
        setPassword('')
        setIsLoading(false)
      }
    }, 800) // 800ms delay for loading animation
  }

  console.log('🔒 About to render - isOpen:', isOpen, 'document:', typeof document !== 'undefined')
  
  // ALWAYS render - no early returns for debugging
  if (typeof document === 'undefined') {
    console.log('🔒 Document undefined, returning null')
    return null
  }
  
  if (!isOpen) {
    console.log('🔒 isOpen is false, returning null')
    return null
  }

  console.log('🔒 Creating portal content!')
  
  // TEST: Try rendering directly first to see if component works at all
  if (!document.body) {
    console.log('🔒 document.body not ready yet')
    return null
  }
  
  const portalContent = (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div 
        id="password-popup-container"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.85)'
        }}
      >
      {/* Blurry Background Image */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)'
        }}
      />
      
      {/* Dark Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }} />

      {/* Centered Form */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '400px',
        margin: '0 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#0B1F3F',
          fontFamily: 'serif',
          marginBottom: '10px'
        }}>
          Enter Password
        </h2>
        <p style={{
          color: '#6B7280',
          fontSize: '15px',
          marginBottom: '20px'
        }}>
          Please enter the password to access this site
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e)
                }
              }}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '2px solid #ddd',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#D4AF37'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd'
              }}
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p style={{
                marginTop: '10px',
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#D4AF37',
              color: '#0B1F3F',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (password.trim() && !isLoading) ? 'pointer' : 'not-allowed',
              opacity: (password.trim() && !isLoading) ? 1 : 0.5,
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => {
              if (password.trim() && !isLoading) {
                e.currentTarget.style.backgroundColor = '#c9a030'
              }
            }}
            onMouseOut={(e) => {
              if (password.trim() && !isLoading) {
                e.currentTarget.style.backgroundColor = '#D4AF37'
              }
            }}
          >
            {isLoading ? (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    animation: 'spin 1s linear infinite'
                  }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="32"
                    strokeDashoffset="32"
                    opacity="0.3"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="32"
                    strokeDashoffset="24"
                  />
                </svg>
                <span>Verifying...</span>
              </>
            ) : (
              'Submit'
            )}
      </button>
    </form>
  </div>
</div>
    </>
  )

  console.log('🔒 About to call createPortal with document.body:', !!document.body)
  const result = createPortal(portalContent, document.body)
  console.log('🔒 createPortal returned:', result)
  return result
}

export default PasswordPopup
