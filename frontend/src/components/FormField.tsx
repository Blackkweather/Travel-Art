import React, { useId, useState, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { t } from '@/i18n'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  hint?: string
  required?: boolean
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
      required = false,
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
    /* The label used to be a bare <label> beside an <input> with no id, so it
       named nothing: screen readers announced an unlabelled edit box and
       clicking the label did not focus the field. */
    const autoId = useId()
    const fieldId = props.id || autoId
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
    const isPasswordField = type === 'password'
    const inputType = isPasswordField && showPassword ? 'text' : type

    return (
      <div className="w-full space-y-2">
        {label && (
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            htmlFor={fieldId}
            className="form-label flex items-center gap-2"
          >
            <span>{label}</span>
            {required && <span className="text-gold -ml-1" aria-hidden="true">*</span>}
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
              id={fieldId}
              type={inputType}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              disabled={disabled || isLoading}
              onChange={props.onChange}
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              className={`
                form-input
                input-field
                ${icon ? 'has-left-icon' : ''}
                ${isPasswordField && showPasswordToggle ? 'has-right-icon' : ''}
                ${error ? 'border-[var(--state-critical-line)] focus:ring-[var(--state-critical)] focus:border-[var(--state-critical)]' : ''}
                ${disabled || isLoading ? 'bg-surface opacity-60 cursor-not-allowed' : 'bg-surface-raised'}
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
                aria-label={showPassword ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {hint && !error && (
            <p id={hintId} className="mt-1.5 text-xs text-content-secondary">
              {hint}
            </p>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              id={errorId}
              className="field-error"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
