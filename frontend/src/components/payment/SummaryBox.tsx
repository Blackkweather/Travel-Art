import React from 'react'

type SummaryBoxProps = {
  subtotal: number
  taxRate?: number // e.g., 0.2 for 20%
  currency?: string
}

export const SummaryBox: React.FC<SummaryBoxProps> = ({ subtotal, taxRate = 0.2, currency = '€' }) => {
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100

  const format = (n: number) => `${currency}${n.toLocaleString()}`

  return (
    <div className="card-luxury sticky top-6">
      <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">Order Summary</h2>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-navy">{format(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tax ({Math.round(taxRate * 100)}%)</span>
          <span className="font-medium text-navy">{format(tax)}</span>
        </div>
        <div className="h-px bg-gray-200" />
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-navy">Total</span>
          <span className="font-bold text-navy">{format(total)}</span>
        </div>
      </div>
    </div>
  )
}

export default SummaryBox





