import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import { getLogoUrl } from '@/config/assets'
import { authApi } from '@/utils/api'
import { t } from '@/i18n'

interface ForgotPasswordForm {
  email: string
}

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.forgotPassword(data.email)
      setEmailSent(true)
      
      // In development, show the reset link if provided
      if (import.meta.env.DEV) {
        const responseData = response.data?.data as any
        if (responseData?.dev?.resetLink) {
          toast.success(t('Lien de réinitialisation généré.'), {
            duration: 10000
          })
          console.log('🔐 Password Reset Link (Dev Mode):')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log(`Reset Link: ${responseData.dev.resetLink}`)
          console.log(`Token: ${responseData.dev.token}`)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        } else {
          toast.success(t('Si un compte existe pour cette adresse, vous recevrez les instructions de réinitialisation.'))
        }
      } else {
        toast.success(t('Si un compte existe pour cette adresse, vous recevrez les instructions de réinitialisation.'))
      }
    } catch {
      // Don't reveal if email exists - always show success for security
      setEmailSent(true)
      toast.success(t('Si un compte existe pour cette adresse, vous recevrez les instructions de réinitialisation.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SimpleNavbar />
      
      <div className="flex items-center justify-center py-20 pt-32 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img loading="lazy" decoding="async" 
                src={getLogoUrl('transparent')} 
                alt="Travel Art" 
                className="h-24 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = document.getElementById('logo-fallback-forgot')
                  if (fallback) {
                    fallback.style.display = 'block'
                  }
                }}
              />
              <div id="logo-fallback-forgot" className="hidden text-4xl font-serif font-bold">
                <span className="text-content">TRAVEL</span>
                <span className="text-gold mx-2">+</span>
                <span className="text-content">ART</span>
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold text-content gold-underline">
              {t('Mot de passe oublié ?')}
            </h2>
            <p className="mt-2 text-content-secondary">
              {emailSent 
                ? t('Consultez votre boîte mail : les instructions vous y attendent.')
                : t('Indiquez votre adresse e-mail et nous vous enverrons les instructions.')
              }
            </p>
          </div>

          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="bg-[var(--state-positive-wash)] border border-[var(--state-positive-line)] rounded-card p-4">
                <p className="text-[var(--state-positive)] text-sm">
                  {t('Si un compte existe pour cette adresse, vous recevrez les instructions de réinitialisation sous peu.')}
                </p>
              </div>
              <Link
                to="/login"
                className="block text-center text-gold hover:text-gold/80 font-medium"
              >
                {t('Retour à la connexion')}
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="form-label">
                  Adresse e-mail
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="form-input"
                  placeholder={t('Saisissez votre e-mail')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[var(--state-critical)]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="text-gold hover:text-gold-600 font-medium text-sm">
                  {t('Retour à la connexion')}
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </div>
      
      <Footer />
    </div>
  )
}

export default ForgotPasswordPage

