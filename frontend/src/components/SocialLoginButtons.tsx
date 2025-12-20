import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Loader2 } from 'lucide-react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

interface SocialLoginButtonsProps {
  onGoogleClick?: () => Promise<void> | void
  onFacebookClick?: () => Promise<void> | void
  onMicrosoftClick?: () => Promise<void> | void
  onEmailClick?: () => Promise<void> | void
  isLoading?: boolean
  variant?: 'login' | 'register'
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleClick,
  onFacebookClick,
  onMicrosoftClick,
  onEmailClick,
  isLoading = false,
  variant = 'login'
}) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const handleClick = async (provider: string, callback?: () => Promise<void> | void) => {
    if (!callback) {
      toast.error(`${provider} integration coming soon`)
      return
    }

    try {
      setLoadingProvider(provider)
      await Promise.resolve(callback())
    } catch (error: any) {
      console.error(`${provider} login error:`, error)
      toast.error(`${provider} login failed. Please try again.`)
    } finally {
      setLoadingProvider(null)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  const socialButtons = [
    {
      id: 'google',
      label: 'Google',
      color: 'hover:bg-red-50 border-red-100',
      bgGradient: 'bg-red-50',
      textColor: 'text-red-600',
      onClick: onGoogleClick,
      icon: <Icon icon="simple-icons:google" className="w-5 h-5" />
    },
    {
      id: 'facebook',
      label: 'Facebook',
      color: 'hover:bg-blue-50 border-blue-100',
      bgGradient: 'bg-blue-50',
      textColor: 'text-blue-600',
      onClick: onFacebookClick,
      icon: <Icon icon="simple-icons:facebook" className="w-5 h-5" />
    },
    {
      id: 'microsoft',
      label: 'Microsoft',
      color: 'hover:bg-sky-50 border-sky-100',
      bgGradient: 'bg-sky-50',
      textColor: 'text-sky-600',
      onClick: onMicrosoftClick,
      icon: <Icon icon="simple-icons:microsoft" className="w-5 h-5" />
    }
  ]

  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500 font-medium text-xs uppercase tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Buttons - Full Width with Text */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3 mb-6"
      >
        {socialButtons.map((button) => (
          <motion.button
            key={button.id}
            variants={buttonVariants}
            onClick={() => handleClick(button.label, button.onClick)}
            disabled={isLoading || loadingProvider !== null}
            className={`
              relative overflow-hidden
              w-full
              flex items-center justify-center gap-3
              px-6 py-3 rounded-lg
              border-2 ${button.color}
              ${button.bgGradient}
              transition-all duration-300
              disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold
              hover:shadow-md active:scale-95
              font-semibold
            `}
            aria-label={`Sign in with ${button.label}`}
            title={`Sign in with ${button.label}`}
          >
            {loadingProvider === button.id ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <div className={button.textColor}>
                  {button.icon}
                </div>
                <span className={button.textColor}>Continue with {button.label}</span>
              </>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Email Login Option */}
      {onEmailClick && (
        <motion.button
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          onClick={() => handleClick('Email', onEmailClick)}
          disabled={isLoading || loadingProvider !== null}
          className={`
            w-full
            flex items-center justify-center gap-3
            px-6 py-3 rounded-lg
            border-2 border-gray-300 bg-gray-50
            text-gray-700 font-semibold
            transition-all duration-300
            disabled:opacity-60 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold
            hover:bg-gray-100 hover:border-gray-400 hover:shadow-md
            active:scale-95
          `}
          aria-label="Sign in with email"
        >
          {loadingProvider === 'Email' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>Continue with Email</span>
            </>
          )}
        </motion.button>
      )}

      {/* Loading State Message */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </motion.div>
      )}
    </div>
  )
}

export default SocialLoginButtons
