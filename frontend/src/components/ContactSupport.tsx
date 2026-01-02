import React, { useState } from 'react'
import { Mail, MessageCircle, Send, Phone, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface ContactSupportProps {
  userRole?: string
  userName?: string
  userEmail?: string
}

const ContactSupport: React.FC<ContactSupportProps> = ({
  userRole = 'USER',
  userName = '',
  userEmail = ''
}) => {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  const quickCategories = [
    { value: 'booking', label: 'Booking Issue' },
    { value: 'payment', label: 'Payment Question' },
    { value: 'profile', label: 'Profile Help' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'other', label: 'Other' }
  ]

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    if (!subject) {
      const categoryLabel = quickCategories.find(c => c.value === category)?.label || ''
      setSubject(categoryLabel)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both subject and message')
      return
    }

    if (message.trim().length < 10) {
      toast.error('Please provide more details in your message (at least 10 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      // Create mailto link with pre-filled email
      const supportEmail = 'hello@travelart.com'
      const emailSubject = encodeURIComponent(`[${userRole}] ${selectedCategory ? `[${selectedCategory.toUpperCase()}] ` : ''}${subject}`)
      const emailBody = encodeURIComponent(
        `Hello Travel Art Support Team,\n\n` +
        `--- User Information ---\n` +
        `Name: ${userName || 'Not provided'}\n` +
        `Email: ${userEmail || 'Not provided'}\n` +
        `Role: ${userRole}\n` +
        `${selectedCategory ? `Category: ${quickCategories.find(c => c.value === selectedCategory)?.label || selectedCategory}\n` : ''}\n` +
        `--- Message ---\n` +
        `Subject: ${subject}\n\n` +
        `${message}\n\n` +
        `---\n` +
        `Best regards,\n${userName || 'User'}`
      )

      // Open email client
      window.location.href = `mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`
      
      toast.success('Opening your email client...')
      setIsSuccess(true)
      
      // Reset form after a delay
      setTimeout(() => {
        setSubject('')
        setMessage('')
        setSelectedCategory('')
        setIsSubmitting(false)
        setIsSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to open email client. Please contact us directly at hello@travelart.com')
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="card-luxury fade-in-up-delay-3">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-navy mb-3">
            Message Ready!
          </h3>
          <p className="text-gray-600 mb-6">
            Your email client should open shortly. If it doesn't, please contact us directly at{' '}
            <a href="mailto:hello@travelart.com" className="text-gold hover:underline font-semibold">
              hello@travelart.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>We typically respond within 24 hours</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-luxury fade-in-up-delay-3 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold/5 to-transparent rounded-full blur-3xl -z-0"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-navy via-navy/90 to-navy/80 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            <MessageCircle className="w-8 h-8 text-gold" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">
              Contact Support
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Have a question or need assistance? Our support team is here to help you. We're committed to providing exceptional service.
            </p>
          </div>
        </div>

        {/* Quick Contact Options */}
        <div className="mb-8 p-6 bg-gradient-to-br from-cream to-white rounded-xl border border-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-semibold text-navy">Quick Contact</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="mailto:hello@travelart.com"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gold hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-colors">
                <Mail className="w-5 h-5 text-navy group-hover:text-white" />
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Email</p>
                <p className="text-xs text-gray-500">hello@travelart.com</p>
              </div>
            </a>
            <a
              href="https://wa.me/212764998286"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-600 group-hover:text-white" />
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">WhatsApp</p>
                <p className="text-xs text-gray-500">+212 764 998 286</p>
              </div>
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Categories */}
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">
              What can we help you with?
            </label>
            <div className="flex flex-wrap gap-2">
              {quickCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleCategorySelect(category.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.value
                      ? 'bg-gold text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-navy mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your inquiry..."
              className="w-full px-4 py-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all bg-white text-navy placeholder-gray-400"
              required
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="block text-sm font-semibold text-navy">
                Message <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${message.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                {message.length} / 500 {message.length < 10 && '(min 10 characters)'}
              </span>
            </div>
            <textarea
              id="message"
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setMessage(e.target.value)
                }
              }}
              placeholder="Please provide as much detail as possible so we can assist you better..."
              rows={6}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all resize-none bg-white text-navy placeholder-gray-400"
              required
              maxLength={500}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim() || message.length < 10}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Message</span>
                </>
              )}
            </button>
            
            <a
              href="mailto:hello@travelart.com"
              className="btn-secondary flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Mail className="w-5 h-5" />
              <span>Email Directly</span>
            </a>
          </div>

          {/* Info Footer */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-gold" />
              </div>
              <div>
                <p className="font-medium text-navy mb-1">Response Time</p>
                <p>We typically respond within 24 hours during business days. For urgent matters, please use WhatsApp or phone.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactSupport

