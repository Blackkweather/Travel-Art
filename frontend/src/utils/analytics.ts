/**
 * Analytics event tracking utility
 * 
 * This module provides a centralized way to track user interactions
 * and prepare for A/B testing framework integration.
 * 
 * To integrate with GA4, Plausible, or other analytics providers,
 * update the trackEvent function to send events to your chosen service.
 */

type EventCategory = 
  | 'navigation'
  | 'booking'
  | 'payment'
  | 'search'
  | 'profile'
  | 'favorite'
  | 'registration'
  | 'authentication'
  | 'experiment'

type EventAction = string
type EventLabel = string

interface AnalyticsEvent {
  category: EventCategory
  action: EventAction
  label?: EventLabel
  value?: number
  [key: string]: any
}

class Analytics {
  private enabled: boolean = true

  constructor() {
    // Check if analytics should be enabled
    this.enabled = !window.location.hostname.includes('localhost') || 
                   import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  }

  trackEvent(event: AnalyticsEvent) {
    if (!this.enabled) {
      console.log('[Analytics]', event)
      return
    }

    // GA4 integration
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event
      })
    }

    // Plausible integration
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(event.action, {
        props: {
          category: event.category,
          label: event.label,
          ...event
        }
      })
    }

    // Custom analytics endpoint (if needed)
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // }).catch(console.error)
  }

  // Navigation events
  trackPageView(path: string) {
    this.trackEvent({
      category: 'navigation',
      action: 'page_view',
      label: path
    })
  }

  pageView(path: string, title?: string) {
    this.trackEvent({
      category: 'navigation',
      action: 'page_view',
      label: path,
      pageTitle: title
    })
  }

  trackNavigationClick(destination: string) {
    this.trackEvent({
      category: 'navigation',
      action: 'nav_click',
      label: destination
    })
  }

  // Booking events
  trackBookingRequest(artistId: string, hotelId: string) {
    this.trackEvent({
      category: 'booking',
      action: 'booking_request',
      label: `artist:${artistId}`,
      artistId,
      hotelId
    })
  }

  trackBookingConfirmed(bookingId: string) {
    this.trackEvent({
      category: 'booking',
      action: 'booking_confirmed',
      label: bookingId
    })
  }

  trackBookingCancelled(bookingId: string) {
    this.trackEvent({
      category: 'booking',
      action: 'booking_cancelled',
      label: bookingId
    })
  }

  // Payment events
  trackPaymentStarted(amount: number, method: string) {
    this.trackEvent({
      category: 'payment',
      action: 'payment_started',
      label: method,
      value: amount
    })
  }

  trackPaymentCompleted(transactionId: string, amount: number) {
    this.trackEvent({
      category: 'payment',
      action: 'payment_completed',
      label: transactionId,
      value: amount
    })
  }

  // Search events
  trackSearch(query: string, filters: Record<string, any>) {
    this.trackEvent({
      category: 'search',
      action: 'search_performed',
      label: query,
      ...filters
    })
  }

  trackFilterApplied(filterType: string, value: string) {
    this.trackEvent({
      category: 'search',
      action: 'filter_applied',
      label: `${filterType}:${value}`
    })
  }

  // Profile events
  trackProfileView(profileType: 'artist' | 'hotel', profileId: string) {
    this.trackEvent({
      category: 'profile',
      action: 'profile_view',
      label: `${profileType}:${profileId}`,
      profileType,
      profileId
    })
  }

  // Favorite events
  trackFavoriteAdded(artistId: string, hotelId: string) {
    this.trackEvent({
      category: 'favorite',
      action: 'favorite_added',
      label: `artist:${artistId}`,
      artistId,
      hotelId
    })
  }

  trackFavoriteRemoved(artistId: string) {
    this.trackEvent({
      category: 'favorite',
      action: 'favorite_removed',
      label: `artist:${artistId}`,
      artistId
    })
  }

  // Registration events
  trackRegistrationStart(role: 'artist' | 'hotel' | 'traveler') {
    this.trackEvent({
      category: 'registration',
      action: 'registration_started',
      label: role
    })
  }

  trackRegistrationComplete(role: string, userId: string) {
    this.trackEvent({
      category: 'registration',
      action: 'registration_completed',
      label: role,
      userId
    })
  }

  // A/B Testing helpers
  trackExperimentView(experimentId: string, variant: string) {
    this.trackEvent({
      category: 'experiment',
      action: 'experiment_view',
      label: `${experimentId}:${variant}`,
      experimentId,
      variant
    })
  }

  trackExperimentConversion(experimentId: string, variant: string, conversionType: string) {
    this.trackEvent({
      category: 'experiment',
      action: 'experiment_conversion',
      label: `${experimentId}:${variant}:${conversionType}`,
      experimentId,
      variant,
      conversionType
    })
  }
}

export const analytics = new Analytics()

// Hook for React components
export const useAnalytics = () => {
  return analytics
}

export default analytics






