import React, { useState, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  hint?: string
  showPasswordToggle?: boolean
  isLoading?: boolean
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      icon,
      hint,
      type = 'text',
      showPasswordToggle = false,
      isLoading = false,
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordField = type === 'password'
    const inputType = isPasswordField && showPassword ? 'text' : type

    return (
      <div className="w-full space-y-2">
        {label && (
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="form-label flex items-center gap-2"
          >
            <span>{label}</span>
            {hint && (
              <span className="text-xs text-gray-400 font-normal ml-auto" title={hint}>
                ℹ️
              </span>
            )}
          </motion.label>
        )}

        <div className="relative group">
          {/* Input wrapper with icon - VISIBLE */}
          <div className="input-wrapper">
            {icon && (
              <div className="input-icon">
                {icon}
              </div>
            )}

            <input
              ref={ref}
              type={inputType}
              disabled={disabled || isLoading}
              onChange={props.onChange}
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              className={`
                form-input
                input-field
                ${icon ? 'has-left-icon' : ''}
                ${isPasswordField && showPasswordToggle ? 'has-right-icon' : ''}
                ${error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''}
                ${disabled || isLoading ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'bg-white'}
                ${className}
              `}
              {...props}
            />

            {/* Password toggle */}
            {isPasswordField && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </div>
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export default FormField
