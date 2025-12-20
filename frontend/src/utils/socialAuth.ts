/**
 * Social Authentication Integration
 * Provides utilities for integrating with social login providers
 * (Google, Facebook, Microsoft)
 */

export interface SocialAuthConfig {
  googleClientId?: string
  facebookAppId?: string
  microsoftClientId?: string
}

/**
 * Initialize social authentication providers
 * These should be loaded from environment variables
 */
export const initializeSocialAuth = (config?: SocialAuthConfig) => {
  // Load Google Sign-In script
  if (config?.googleClientId) {
    loadGoogleSignInScript(config.googleClientId)
  }

  // Load Facebook SDK
  if (config?.facebookAppId) {
    loadFacebookSDK(config.facebookAppId)
  }

  // Load Microsoft SDK
  if (config?.microsoftClientId) {
    loadMicrosoftSDK(config.microsoftClientId)
  }
}

/**
 * Load Google Sign-In script
 */
const loadGoogleSignInScript = (clientId: string) => {
  if (document.getElementById('google-signin-script')) {
    return // Already loaded
  }

  const script = document.createElement('script')
  script.id = 'google-signin-script'
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true

  document.head.appendChild(script)

  // Initialize when script is loaded
  script.onload = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignIn
      })
    }
  }
}

/**
 * Load Facebook SDK
 */
const loadFacebookSDK = (appId: string) => {
  if (document.getElementById('facebook-jssdk')) {
    return // Already loaded
  }

  const script = document.createElement('script')
  script.id = 'facebook-jssdk'
  script.src = 'https://connect.facebook.net/en_US/sdk.js'
  script.async = true
  script.defer = true
  script.crossOrigin = 'anonymous'

  document.body.appendChild(script)

  script.onload = () => {
    if (window.FB) {
      window.FB.init({
        appId: appId,
        xfbml: true,
        version: 'v18.0'
      })
    }
  }
}

/**
 * Load Microsoft SDK
 */
const loadMicrosoftSDK = (clientId: string) => {
  if (document.getElementById('microsoft-signin-script')) {
    return // Already loaded
  }

  const script = document.createElement('script')
  script.id = 'microsoft-signin-script'
  script.src = 'https://alcdn.msauth.net/browser/2.26.0/js/msal-browser.min.js'
  script.async = true

  document.head.appendChild(script)
}

/**
 * Handle Google Sign-In callback
 */
const handleGoogleSignIn = async (response: any) => {
  // This should be dispatched to the app's auth handler
  const event = new CustomEvent('googleSignInSuccess', { detail: response })
  window.dispatchEvent(event)
}

/**
 * Trigger Google Sign-In
 */
export const signInWithGoogle = async (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          // Use one-tap if available
          window.google.accounts.id.renderButton(
            document.createElement('div'),
            { theme: 'outline', size: 'large' }
          )
        }
      })
    }
    // Listen for the sign-in event
    const handler = ((e: CustomEvent) => {
      window.removeEventListener('googleSignInSuccess', handler as any)
      resolve(e.detail.credential)
    }) as EventListener

    window.addEventListener('googleSignInSuccess', handler)

    // Timeout after 30 seconds
    setTimeout(() => {
      window.removeEventListener('googleSignInSuccess', handler)
      reject(new Error('Google sign-in timeout'))
    }, 30000)
  })
}

/**
 * Trigger Facebook Sign-In
 */
export const signInWithFacebook = async (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            resolve(response.authResponse.accessToken)
          } else {
            reject(new Error('Facebook login failed'))
          }
        },
        { scope: 'public_profile,email' }
      )
    } else {
      reject(new Error('Facebook SDK not loaded'))
    }
  })
}

/**
 * Trigger Microsoft Sign-In
 */
export const signInWithMicrosoft = async (msalInstance: any): Promise<string | null> => {
  try {
    const loginResponse = await msalInstance.loginPopup({
      scopes: ['user.read']
    })
    return loginResponse.accessToken
  } catch (error) {
    throw new Error('Microsoft sign-in failed')
  }
}

/**
 * Sign out from social provider
 */
export const signOutFromSocial = async (provider: 'google' | 'facebook' | 'microsoft') => {
  switch (provider) {
    case 'google':
      if (window.google) {
        window.google.accounts.id.disableAutoSelect()
      }
      break
    case 'facebook':
      if (window.FB) {
        window.FB.logout()
      }
      break
    case 'microsoft':
      // Microsoft sign-out is handled by MSAL instance
      break
  }
}

// Global type declarations for social SDKs
declare global {
  interface Window {
    google?: any
    FB?: any
    gapi?: any
  }
}

export default {
  initializeSocialAuth,
  signInWithGoogle,
  signInWithFacebook,
  signInWithMicrosoft,
  signOutFromSocial
}
