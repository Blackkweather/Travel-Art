import React, { ButtonHTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  isSuccess?: boolean
  loadingText?: string
  successText?: string
  successDuration?: number
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  gold: 'btn-gold',
  outline: 'btn-gold-outline'
}

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl'
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      isLoading = false,
      isSuccess = false,
      loadingText = 'Loading...',
      successText = 'Success!',
      successDuration = 2000,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading || isSuccess

    React.useEffect(() => {
      if (isSuccess) {
        const timer = setTimeout(() => {
          // Reset success state if needed - you might want to pass a callback for this
        }, successDuration)
        return () => clearTimeout(timer)
      }
    }, [isSuccess, successDuration])

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          relative
          inline-flex items-center justify-center gap-2
          transition-all duration-300
          disabled:opacity-60 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold
          ${className}
        `}
        {...(props as any)}
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{successText}</span>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{loadingText}</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              {icon && iconPosition === 'left' && icon}
              <span>{children}</span>
              {icon && iconPosition === 'right' && icon}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'

export default LoadingButton
