import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

import { LoginCredentials } from '@/types'
import toast from 'react-hot-toast'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import BrandWordmark from '@/components/BrandWordmark'
import ResendVerification from '@/components/ResendVerification'
import { t } from '@/i18n'
import SEOHead from '@/components/SEOHead'

/** Why the last session ended, said once when the sign-in page opens. */
const SESSION_END_MESSAGE: Record<string, string> = {
  expired: 'Votre session a expiré. Reconnectez-vous.',
  revoked: 'Vous avez été déconnecté de tous vos appareils. Reconnectez-vous.',
  inactive: 'Ce compte n’est plus actif. Contactez-nous si vous pensez qu’il s’agit d’une erreur.',
}

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  // Set when sign-in is refused because the address is not confirmed yet.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [notice] = useState(() => {
    const reason = useAuthStore.getState().sessionEndReason
    return reason ? SESSION_END_MESSAGE[reason] : null
  })
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginCredentials>()

  // Pressing the browser back button can land here on the stale /login
  // history entry left over from before a previous sign-in - send an
  // already-authenticated visitor straight back to their dashboard instead
  // of showing them an empty login form that looks like they were logged out.
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true)
    setUnverifiedEmail(null)
    try {
      // Use local database authentication
      const { login } = useAuthStore.getState()
      await login(data)

      toast.success(t('Bon retour'))
      // replace: true keeps /login out of history so the back button can't
      // land on it again after a successful sign-in
      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      if (error.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(data.email)
      const errorMessage = error.response?.data?.error?.message ||
                          t('Connexion impossible. Vérifiez vos identifiants.')
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SEOHead
        title={t('Connexion — Travel Art')}
        description={t('Accédez à votre espace Travel Art : vos résidences, vos réservations et votre profil.')}
      />
      <SimpleNavbar />
      <main id="contenu">

      <div className="flex items-center justify-center py-20 pt-32 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <BrandWordmark className="h-24 w-auto text-navy dark:text-cream" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-content gold-underline">
            {t('Bon retour')}
          </h1>
          <p className="mt-2 text-content-secondary">
            {t('Connectez-vous à votre compte Travel Art')}
          </p>
        </div>

        {notice && (
          <div role="status" className="rounded-card border border-line bg-surface-sunken px-4 py-3 text-sm text-content">
            {t(notice)}
          </div>
        )}

        {unverifiedEmail && (
          <div role="alert" className="space-y-3 rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-content">
            <p>{t('Confirmez d’abord votre adresse e-mail : cliquez sur le lien que nous vous avons envoyé.')}</p>
            <ResendVerification email={unverifiedEmail} className="btn-secondary btn-sm" />
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                {t('Adresse e-mail')}
              </label>
              <input
                id="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                name="email"
                type="email"
                className="form-input"
                placeholder={t('Saisissez votre e-mail')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-sm text-[var(--state-critical)]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                {t('Mot de passe')}
              </label>
              <input
                id="password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
                name="password"
                type="password"
                className="form-input"
                placeholder={t('Saisissez votre mot de passe')}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-sm text-[var(--state-critical)]">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="remember-me" className="flex items-center min-h-[44px] cursor-pointer">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-gold focus:ring-gold border-line rounded-card"
              />
              <span className="ml-2 block text-sm text-content-secondary">
                {t('Se souvenir de moi')}
              </span>
            </label>

            <div className="text-sm">
              <Link to="/forgot-password" className="inline-flex items-center min-h-[44px] text-gold hover:text-gold-800">
                {t('Mot de passe oublié ?')}
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary btn-lg w-full"
            >
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-content-secondary">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-gold hover:text-gold-800 font-medium">
                {t('Créer un compte')}
              </Link>
            </p>
          </div>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-8 text-center">
            <p className="text-sm text-content-secondary">
              {t('Identifiants de démonstration (développement) :')}
            </p>
          </div>
        )}
      </motion.div>
      </div>

      </main>
      <Footer />
    </div>
  )
}

export default LoginPage
