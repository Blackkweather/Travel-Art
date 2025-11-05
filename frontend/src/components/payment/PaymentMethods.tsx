import React from 'react'
import { CreditCard, BadgeDollarSign, Wallet } from 'lucide-react'

export type PaymentMethod =
  | 'visa'
  | 'mastercard'
  | 'maestro'
  | 'amex'
  | 'paypal'
  | 'other'

type PaymentMethodsProps = {
  selected: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
}

const baseBtn =
  'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gold'

const brandBadge = (label: string) => (
  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{label}</span>
)

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ selected, onSelect }) => {
  const isActive = (m: PaymentMethod) => selected === m

  return (
    <div className="card-luxury">
      <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">Payment Method</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          type="button"
          className={`${baseBtn} ${isActive('visa') ? 'border-gold bg-gold/10' : 'border-gray-200 hover:bg-gray-50'}`}
          aria-pressed={isActive('visa')}
          onClick={() => onSelect('visa')}
        >
          <CreditCard className="w-4 h-4" />
          {brandBadge('VISA')}
        </button>
        <button
          type="button"
          className={`${baseBtn} ${isActive('mastercard') ? 'border-gold bg-gold/10' : 'border-gray-200 hover:bg-gray-50'}`}
          aria-pressed={isActive('mastercard')}
          onClick={() => onSelect('mastercard')}
        >
          <CreditCard className="w-4 h-4" />
          {brandBadge('Mastercard')}
        </button>
        <button
          type="button"
          className={`${baseBtn} ${isActive('maestro') ? 'border-gold bg-gold/10' : 'border-gray-200 hover:bg-gray-50'}`}
          aria-pressed={isActive('maestro')}
          onClick={() => onSelect('maestro')}
        >
          <CreditCard className="w-4 h-4" />
          {brandBadge('Maestro')}
        </button>
        <button
          type="button"
          className={`${baseBtn} ${isActive('amex') ? 'border-gold bg-gold/10' : 'border-gray-200 hover:bg-gray-50'}`}
          aria-pressed={isActive('amex')}
          onClick={() => onSelect('amex')}
        >
          <CreditCard className="w-4 h-4" />
          {brandBadge('Amex')}
        </button>
        <button
          type="button"
          className={`${baseBtn} ${isActive('paypal') ? 'border-gold bg-gold/10' : 'border-gray-200 hover:bg-gray-50'}`}
          aria-pressed={isActive('paypal')}
          onClick={() => onSelect('paypal')}
        >
          <Wallet className="w-4 h-4" />
          {brandBadge('PayPal')}
        </button>
        <button
          type="button"
          className={`${baseBtn} ${isActive('other') ? 'border-gold bg-gold/10' : 'border-gray-200 hover:bg-gray-50'}`}
          aria-pressed={isActive('other')}
          onClick={() => onSelect('other')}
        >
          <BadgeDollarSign className="w-4 h-4" />
          {brandBadge('Other')}
        </button>
      </div>
    </div>
  )
}

export default PaymentMethods





