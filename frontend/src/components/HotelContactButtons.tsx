import React from 'react'
import { MessageCircle, Mail } from 'lucide-react'
import { t } from '@/i18n'

interface HotelContactButtonsProps {
  phoneNumber?: string
  email?: string
  responsibleName?: string
  hotelName?: string
  className?: string
}

const HotelContactButtons: React.FC<HotelContactButtonsProps> = ({
  phoneNumber,
  email,
  responsibleName,
  hotelName,
  className = ''
}) => {
  // Format phone number for WhatsApp (remove +, spaces, dashes)
  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/[\s\-+()]/g, '')
  }

  // Generate WhatsApp URL
  const getWhatsAppUrl = () => {
    if (!phoneNumber) return '#'
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber)
    // The message a visitor sends should be in the language they are reading
    // the site in, so these are keys rather than template literals.
    const venue = hotelName || t('votre établissement')
    const message = responsibleName
      ? t('Bonjour {name}, je souhaiterais en savoir plus sur {venue}.', {
          name: responsibleName,
          venue,
        })
      : t('Bonjour, je souhaiterais en savoir plus sur {venue}.', { venue })
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
  }

  // Generate email URL
  const getEmailUrl = () => {
    if (!email) return '#'
    const venue = hotelName || t('votre établissement')
    const subject = t('Demande de renseignements — {venue}', { venue })
    const enquiry = t('Je souhaiterais en savoir plus sur {venue}.', { venue })
    const greeting = responsibleName
      ? t('Bonjour {name},', { name: responsibleName })
      : t('Madame, Monsieur,')
    const body = `${greeting}\n\n${enquiry}\n\n${t('Bien cordialement,')}`
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const hasContactInfo = phoneNumber || email

  if (!hasContactInfo) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-lg font-serif font-semibold text-content mb-4">
        {responsibleName ? `Contact ${responsibleName}` : 'Contact Hotel'}
      </h4>
      
      <div className="flex flex-row gap-3">
        {/* WhatsApp Button - Green */}
        {phoneNumber && (
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center px-4 py-3.5 bg-[var(--state-positive)] text-white rounded-card font-medium hover:bg-[var(--state-positive)] transition"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Email Button - Outlined */}
        {email && (
          <a
            href={getEmailUrl()}
            className="flex-1 flex items-center justify-center px-4 py-3.5 border-2 border-line-strong text-content-secondary rounded-card font-medium hover:border-navy hover:text-content transition"
          >
            <Mail className="w-5 h-5 mr-2" />
            <span>E-mail</span>
          </a>
        )}
      </div>

      {/* Contact Info Display */}
      <div className="text-sm text-content-secondary space-y-1 pt-2">
        {phoneNumber && (
          <p className="flex items-center gap-2">
            <span className="text-gold font-medium">{t('Téléphone :')}</span>
            <span>{phoneNumber}</span>
          </p>
        )}
        {email && (
          <p className="flex items-center gap-2">
            <span className="text-gold font-medium">E-mail :</span>
            <span>{email}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default HotelContactButtons

