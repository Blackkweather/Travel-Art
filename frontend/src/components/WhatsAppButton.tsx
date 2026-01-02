import React from 'react'
import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phoneNumber?: string
  message?: string
  className?: string
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ 
  phoneNumber = '33123456789', // Default French number format (no +)
  message = 'Hello Travel Art, I would like to know more about your services',
  className = ''
}) => {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group ${className}`}
      aria-label="Contact us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
      <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-white bg-gray-900 px-3 py-1.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        WhatsApp Us
      </span>
    </a>
  )
}

export default WhatsAppButton

