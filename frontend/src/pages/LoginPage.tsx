import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useSignIn, useAuth } from '@clerk/clerk-react'
import { useAuthStore } from '@/store/authStore'
import { LoginCredentials } from '@/types'
import toast from 'react-hot-toast'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getLogoUrl } from '@/config/assets'

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { isLoaded, signIn, setActive } = useSignIn()
  const auth = useAuth()
  const clerkUser = auth.isSignedIn ? (auth as any).user : null
  const { syncClerkUser } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginCredentials>()

  const onSubmit = async (data: LoginCredentials) => {
    if (!isLoaded) return
    
    setIsLoading(true)
    try {
      // Use Clerk to sign in
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      })

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId })
        
        // Sync with our backend to get user data
        if (clerkUser) {
          await syncClerkUser(clerkUser)
        }
        
        toast.success('Welcome back!')
        // Always redirect to dashboard - it will route to correct role dashboard
        navigate('/dashboard')
      } else {
        toast.error('Login incomplete. Please try again.')
      }
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || error.message || 'Login failed'
      toast.error(errorMessage)
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
          <div className="flex justify-center mb-8">
            <img 
              src={getLogoUrl('transparent')} 
              alt="Travel Art" 
              className="h-24 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = document.getElementById('logo-fallback-login')
                if (fallback) {
                  fallback.style.display = 'block'
                }
              }}
            />
            <div id="logo-fallback-login" className="hidden text-4xl font-serif font-bold">
              <span className="text-navy">TRAVEL</span>
              <span className="text-gold mx-2">+</span>
              <span className="text-navy">ART</span>
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-navy gold-underline">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your Travel Art account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
                name="email"
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
                name="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="text-gold hover:text-gold-600">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold hover:text-gold-600 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Demo credentials (Dev Only):
            </p>
          </div>
        )}
      </motion.div>
      </div>
      
      <Footer />
    </div>
  )
}

export default LoginPage
