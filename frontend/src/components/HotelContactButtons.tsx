import React from 'react'
import { MessageCircle, Mail } from 'lucide-react'

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
    const message = responsibleName
      ? `Hello ${responsibleName}, I'm interested in learning more about ${hotelName || 'your hotel'}.`
      : `Hello, I'm interested in learning more about ${hotelName || 'your hotel'}.`
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
  }

  // Generate email URL
  const getEmailUrl = () => {
    if (!email) return '#'
    const subject = `Inquiry about ${hotelName || 'your hotel'}`
    const body = responsibleName
      ? `Dear ${responsibleName},\n\nI would like to know more about ${hotelName || 'your hotel'}.\n\nBest regards,`
      : `Dear Sir/Madam,\n\nI would like to know more about ${hotelName || 'your hotel'}.\n\nBest regards,`
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const hasContactInfo = phoneNumber || email

  if (!hasContactInfo) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-lg font-serif font-semibold text-navy mb-4">
        {responsibleName ? `Contact ${responsibleName}` : 'Contact Hotel'}
      </h4>
      
      <div className="flex flex-row gap-3">
        {/* WhatsApp Button - Green */}
        {phoneNumber && (
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center px-4 py-3.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Email Button - Outlined */}
        {email && (
          <a
            href={getEmailUrl()}
            className="flex-1 flex items-center justify-center px-4 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-navy hover:text-navy transition"
          >
            <Mail className="w-5 h-5 mr-2" />
            <span>Email</span>
          </a>
        )}
      </div>

      {/* Contact Info Display */}
      <div className="text-sm text-gray-600 space-y-1 pt-2">
        {phoneNumber && (
          <p className="flex items-center gap-2">
            <span className="text-gold font-medium">Phone:</span>
            <span>{phoneNumber}</span>
          </p>
        )}
        {email && (
          <p className="flex items-center gap-2">
            <span className="text-gold font-medium">Email:</span>
            <span>{email}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default HotelContactButtons

