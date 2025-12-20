import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

export type MessageType = 'success' | 'error' | 'warning' | 'info'

interface MessageProps {
  type: MessageType
  message: string
  title?: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
  dismissible?: boolean
  icon?: React.ReactNode
}

const Message: React.FC<MessageProps> = ({
  type,
  message,
  title,
  onClose,
  autoClose = true,
  duration = 5000,
  dismissible = true,
  icon
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: 'text-green-900',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      title: 'text-red-900',
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      title: 'text-yellow-900',
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: 'text-blue-900',
      text: 'text-blue-800'
    }
  }

  const styles = typeStyles[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`
        flex items-start gap-4
        p-4 rounded-lg border
        ${styles.bg} ${styles.border}
        shadow-md
      `}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {icon || styles.icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        {title && (
          <h3 className={`font-semibold ${styles.title} mb-1`}>
            {title}
          </h3>
        )}
        <p className={`text-sm ${styles.text}`}>
          {message}
        </p>
      </div>

      {/* Close Button */}
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className={`
            flex-shrink-0
            p-1 rounded-lg
            hover:bg-white/50
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold
          `}
          aria-label="Close message"
        >
          <XCircle className="w-5 h-5 opacity-50 hover:opacity-75" />
        </button>
      )}
    </motion.div>
  )
}

/**
 * Message Container Component
 * Stacks multiple messages with animations
 */
interface MessageContainerProps {
  messages: Array<MessageProps & { id: string }>
  onRemoveMessage?: (id: string) => void
}

export const MessageContainer: React.FC<MessageContainerProps> = ({
  messages,
  onRemoveMessage
}) => {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm pointer-events-auto">
      <AnimatePresence>
        {messages.map((msg) => (
          <Message
            key={msg.id}
            {...msg}
            onClose={() => onRemoveMessage?.(msg.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Inline Message Component
 * For form-level validation messages
 */
interface InlineMessageProps extends Omit<MessageProps, 'icon'> {
  fullWidth?: boolean
}

export const InlineMessage: React.FC<InlineMessageProps> = ({
  type,
  message,
  title,
  dismissible = false,
  fullWidth = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={fullWidth ? 'w-full' : ''}
    >
      <Message
        type={type}
        message={message}
        title={title}
        dismissible={dismissible}
        onClose={() => setIsVisible(false)}
        autoClose={false}
        {...props}
      />
    </motion.div>
  )
}

export default Message
