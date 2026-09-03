import React, { useState } from 'react'
import { Mail, Send, CheckCircle } from 'lucide-react'
import { t, getLocale } from '@/i18n'
import toast from 'react-hot-toast'
import { apiClient } from '@/utils/api'

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
      // This used to be a one-second timer with the call commented out, so the
      // form reported success and threw the address away.
      await apiClient.post('/newsletter/subscribe', {
        email,
        locale: getLocale(),
        source: variant,
      })

      setSuccess(true)
      setEmail('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      // A native alert() is the wrong register for this and blocks the page;
      // the rest of the app reports failures as toasts.
      toast.error(t('L’inscription a échoué. Veuillez réessayer.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-navy to-navy/90 text-white py-8 ${className}`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Mail className="w-6 h-6 text-gold" />
            <h3 className="text-2xl font-serif font-bold">
              {t('Restez inspiré avec Travel Art')}
            </h3>
          </div>
          <p className="text-white/75 mb-6 max-w-2xl mx-auto">
            {t('Chaque semaine, les nouvelles résidences, les expériences exclusives et les coulisses de nos hôtels.')}
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('Saisissez votre adresse e-mail')}
                className="w-full px-4 py-3 rounded-card text-content focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || success}
              className="bg-gold text-navy px-6 py-3 rounded-card font-semibold hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center space-x-2 whitespace-nowrap"
            >
              {success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{t('Inscription confirmée')}</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'Inscription…' : t('S’inscrire')}</span>
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
      <div className={`bg-surface-raised rounded-card shadow-luxury p-8 max-w-md ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-6 h-6 text-gold" />
          <h3 className="text-2xl font-serif font-bold text-content">
            {t('Notre lettre d’information')}
          </h3>
        </div>
        <p className="text-content-secondary mb-6">
          {t('Un accès privilégié aux nouvelles résidences et aux expériences de nos hôtels.')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Saisissez votre adresse e-mail')}
              className="form-input w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || success}
            className="w-full btn-primary disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{t('Inscription confirmée')}</span>
              </>
            ) : submitting ? (
              'Inscription…'
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{t('S’abonner')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  // Inline variant (default)
  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('Saisissez votre adresse e-mail')}
            className="form-input w-full"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting || success}
          className="btn-primary disabled:opacity-60 px-6 whitespace-nowrap"
        >
          {success ? '✓ Inscrit' : submitting ? '…' : 'S’inscrire'}
        </button>
      </form>
    </div>
  )
}

export default NewsletterSignup


















