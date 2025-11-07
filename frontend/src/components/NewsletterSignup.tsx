import React, { useState } from 'react'
import { Mail, Send, CheckCircle } from 'lucide-react'

interface NewsletterSignupProps {
  variant?: 'inline' | 'modal' | 'banner'
  className?: string
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ 
  variant = 'inline',
  className = ''
}) => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return

    setSubmitting(true)
    try {
      // In production, this would call an API endpoint
      // await apiClient.post('/newsletter/subscribe', { email })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess(true)
      setEmail('')
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to subscribe:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-navy to-navy/90 text-white py-8 ${className}`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-serif font-bold mb-3">
            Stay Inspired with Travel Art
          </h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Get weekly updates on new artist residencies, exclusive experiences, and insider stories from luxury hotels.
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 rounded-lg text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || success}
              className="bg-gold text-navy px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center space-x-2"
            >
              {success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'Subscribing...' : 'Subscribe'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div className={`bg-white rounded-xl shadow-luxury p-8 max-w-md ${className}`}>
        <h3 className="text-2xl font-serif font-bold text-navy mb-3">
          Join Our Newsletter
        </h3>
        <p className="text-gray-600 mb-6">
          Get exclusive access to new artist residencies and luxury hotel experiences.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="form-input pl-10"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || success}
            className="w-full btn-primary disabled:opacity-60"
          >
            {success ? 'Subscribed!' : submitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </div>
    )
  }

  // Inline variant (default)
  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="form-input pl-10"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting || success}
          className="btn-primary disabled:opacity-60"
        >
          {success ? '✓' : submitting ? '...' : 'Subscribe'}
        </button>
      </form>
    </div>
  )
}

export default NewsletterSignup








