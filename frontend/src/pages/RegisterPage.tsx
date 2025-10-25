import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { RegisterData } from '@/types'
import toast from 'react-hot-toast'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getLogoUrl } from '@/config/assets'

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') as 'ARTIST' | 'HOTEL' | null

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterData>({
    defaultValues: {
      role: role || 'ARTIST'
    }
  })

  const watchedRole = watch('role')

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      await registerUser(data)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="flex items-center justify-center py-20 pt-32 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full space-y-8"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-8">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-20 w-auto"
            />
          </div>
          <h2 className="text-4xl font-serif font-bold text-navy mb-4">
            Join Travel Art
          </h2>
          <p className="text-lg text-gray-600">
            Create your account and start your journey
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-navy mb-4">I am a</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  watchedRole === 'ARTIST' 
                    ? 'border-gold bg-gold/5 shadow-md' 
                    : 'border-gray-200 hover:border-gold/50'
                }`}>
                  <input
                    {...register('role', { required: 'Please select your role' })}
                    type="radio"
                    value="ARTIST"
                    className="sr-only"
                  />
                  <div className={`text-center transition-colors duration-300 ${
                    watchedRole === 'ARTIST' ? 'text-gold' : 'text-gray-600'
                  }`}>
                    <div className="text-4xl mb-3">◆</div>
                    <div className="font-semibold text-lg mb-1">Artist</div>
                    <div className="text-sm opacity-80">Perform & Create</div>
                  </div>
                  {watchedRole === 'ARTIST' && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-gold rounded-full"></div>
                  )}
                </label>
                
                <label className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  watchedRole === 'HOTEL' 
                    ? 'border-gold bg-gold/5 shadow-md' 
                    : 'border-gray-200 hover:border-gold/50'
                }`}>
                  <input
                    {...register('role', { required: 'Please select your role' })}
                    type="radio"
                    value="HOTEL"
                    className="sr-only"
                  />
                  <div className={`text-center transition-colors duration-300 ${
                    watchedRole === 'HOTEL' ? 'text-gold' : 'text-gray-600'
                  }`}>
                    <div className="text-4xl mb-3">◈</div>
                    <div className="font-semibold text-lg mb-1">Hotel</div>
                    <div className="text-sm opacity-80">Host & Entertain</div>
                  </div>
                  {watchedRole === 'HOTEL' && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-gold rounded-full"></div>
                  )}
                </label>
              </div>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-navy mb-2">
                Full Name
              </label>
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-colors duration-200"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-navy mb-2">
                Email Address
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-colors duration-200"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-navy mb-2">
                Password
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-colors duration-200"
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
            />
            <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-gold hover:text-gold-600 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-gold hover:text-gold-600 font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold/90 text-navy font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-gold hover:text-gold-600 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
      </div>
      
      <Footer />
    </div>
  )
}

export default RegisterPage


