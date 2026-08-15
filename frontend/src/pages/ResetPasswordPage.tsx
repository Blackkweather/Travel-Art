import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'
import { getLogoUrl } from '@/config/assets'
import { authApi } from '@/utils/api'

interface ResetPasswordForm {
  password: string
  confirmPassword: string
}

const ResetPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ResetPasswordForm>()

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Lien de réinitialisation invalide')
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword({ token, password: data.password })
      toast.success('Mot de passe réinitialisé')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to reset password. The token may be invalid or expired.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08101D]">
      <SimpleNavbar />
      
      {!token ? (
        <div className="flex items-center justify-center py-20 pt-32 px-4">
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              Lien invalide
            </h2>
            <p className="text-white/60 mb-4">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link to="/forgot-password" className="text-gold hover:text-gold-600 font-medium">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 pt-32 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src={getLogoUrl('transparent')} 
                  alt="Travel Art" 
                  className="h-24 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = document.getElementById('logo-fallback-reset')
                    if (fallback) {
                      fallback.style.display = 'block'
                    }
                  }}
                />
                <div id="logo-fallback-reset" className="hidden text-4xl font-serif font-bold">
                  <span className="text-white">TRAVEL</span>
                  <span className="text-gold mx-2">+</span>
                  <span className="text-white">ART</span>
                </div>
              </div>
              <h2 className="text-3xl font-serif font-bold text-white gold-underline">
                Réinitialiser le mot de passe
              </h2>
              <p className="mt-2 text-white/60">
                Saisissez votre nouveau mot de passe
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="password" className="form-label">
                  Nouveau mot de passe
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  type="password"
                  className="form-input"
                  placeholder="Saisissez le nouveau mot de passe"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmer le mot de passe
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type="password"
                  className="form-input"
                  placeholder="Confirmez le nouveau mot de passe"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="text-gold hover:text-gold-600 font-medium text-sm">
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      <Footer />
    </div>
  )
}

export default ResetPasswordPage

