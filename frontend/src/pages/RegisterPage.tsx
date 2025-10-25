import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Building, User } from 'lucide-react'
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
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-32 w-auto"
            />
          </div>
          <h2 className="text-3xl font-serif font-bold text-navy gold-underline">
            Join Travel Art
          </h2>
          <p className="mt-2 text-gray-600">
            Create your account and start your journey
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">I am a</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    {...register('role', { required: 'Please select your role' })}
                    type="radio"
                    value="ARTIST"
                    className="sr-only"
                  />
                  <div className={`w-full text-center ${watchedRole === 'ARTIST' ? 'text-gold' : 'text-gray-600'}`}>
                    <div className="text-2xl mb-2">
                      <User className="w-8 h-8 mx-auto" />
                    </div>
                    <div className="font-medium">Artist</div>
                    <div className="text-sm">Perform & Create</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    {...register('role', { required: 'Please select your role' })}
                    type="radio"
                    value="HOTEL"
                    className="sr-only"
                  />
                  <div className={`w-full text-center ${watchedRole === 'HOTEL' ? 'text-gold' : 'text-gray-600'}`}>
                    <div className="text-2xl mb-2">
                      <Building className="w-8 h-8 mx-auto" />
                    </div>
                    <div className="font-medium">Hotel</div>
                    <div className="text-sm">Host & Entertain</div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="form-label">
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
                className="form-input"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="form-label">
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
                className="form-input"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
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
                className="form-input"
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-gold hover:text-gold-600">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-gold hover:text-gold-600">
                Privacy Policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-gold hover:text-gold-600 font-medium">
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


