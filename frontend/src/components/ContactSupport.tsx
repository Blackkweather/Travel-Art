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
    { value: 'booking', label: 'Problème de réservation' },
    { value: 'payment', label: 'Question de facturation' },
    { value: 'profile', label: 'Aide sur le profil' },
    { value: 'technical', label: 'Problème technique' },
    { value: 'other', label: 'Autre' }
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
      toast.error('Renseignez l’objet et le message')
      return
    }

    if (message.trim().length < 10) {
      toast.error('Détaillez un peu plus votre message (10 caractères minimum)')
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
      
      toast.success('Ouverture de votre messagerie…')
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
      toast.error('Impossible d’ouvrir votre messagerie. Écrivez-nous directement à hello@travelart.com')
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="card-luxury fade-in-up-delay-3">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gold to-gold/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-content" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-content mb-3">
            Message prêt
          </h3>
          <p className="text-content-secondary mb-6">
            Votre messagerie devrait s’ouvrir dans un instant. Si ce n’est pas le cas, écrivez-nous directement à{' '}
            <a href="mailto:hello@travelart.com" className="text-gold hover:underline font-semibold">
              hello@travelart.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-content-secondary">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>Nous répondons généralement sous 24 heures</span>
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
          <div className="w-16 h-16 bg-gradient-to-br from-navy via-navy/90 to-navy/80 rounded-card flex items-center justify-center shadow-lg flex-shrink-0">
            <MessageCircle className="w-8 h-8 text-gold" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-serif font-bold text-content mb-2 gold-underline">
              Contacter l’assistance
            </h2>
            <p className="text-content-secondary leading-relaxed">
              Une question, un besoin d’accompagnement ? Notre équipe est à votre disposition.
            </p>
          </div>
        </div>

        {/* Quick Contact Options */}
        <div className="mb-8 p-6 bg-surface-sunken rounded-card border border-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-semibold text-content">Contact rapide</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="mailto:hello@travelart.com"
              className="flex items-center gap-3 p-4 bg-surface-raised rounded-card border border-line hover:border-gold hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-navy/10 rounded-card flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-colors">
                <Mail className="w-5 h-5 text-content group-hover:text-white" />
              </div>
              <div>
                <p className="font-semibold text-content text-sm">E-mail</p>
                <p className="text-xs text-content-secondary">hello@travelart.com</p>
              </div>
            </a>
            <a
              href="https://wa.me/212764998286"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-surface-raised rounded-card border border-line hover:border-green-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-card flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-content" />
              </div>
              <div>
                <p className="font-semibold text-content text-sm">WhatsApp</p>
                <p className="text-xs text-content-secondary">+212 764 998 286</p>
              </div>
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Categories */}
          <div>
            <label className="block text-sm font-semibold text-content mb-3">
              Comment pouvons-nous vous aider ?
            </label>
            <div className="flex flex-wrap gap-2">
              {quickCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleCategorySelect(category.value)}
                  className={`px-4 py-2 rounded-card text-sm font-medium transition-all ${
                    selectedCategory === category.value
                      ? 'bg-gold text-off-black shadow-md'
                      : 'bg-surface-sunken text-content-secondary hover:bg-surface-sunken border border-line'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-content mb-2">
              Objet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="En quelques mots, l’objet de votre demande…"
              className="w-full px-4 py-3.5 border border-line rounded-card focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all bg-surface-raised text-content placeholder-gray-400"
              required
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="block text-sm font-semibold text-content">
                Message <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${message.length < 10 ? 'text-red-500' : 'text-content-secondary'}`}>
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
              placeholder="Décrivez votre demande aussi précisément que possible…"
              rows={6}
              className="w-full px-4 py-3.5 border border-line rounded-card focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all resize-none bg-surface-raised text-content placeholder-gray-400"
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
                  <span>Préparation…</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Envoyer le message</span>
                </>
              )}
            </button>
            
            <a
              href="mailto:hello@travelart.com"
              className="btn-secondary flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Mail className="w-5 h-5" />
              <span>Écrire directement</span>
            </a>
          </div>

          {/* Info Footer */}
          <div className="pt-4 border-t border-line">
            <div className="flex items-start gap-3 text-sm text-content-secondary">
              <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-gold" />
              </div>
              <div>
                <p className="font-medium text-content mb-1">Délai de réponse</p>
                <p>Nous répondons généralement sous 24 heures ouvrées. Pour une urgence, privilégiez WhatsApp ou le téléphone.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactSupport

