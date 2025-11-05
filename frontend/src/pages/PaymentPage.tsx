import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, CreditCard as CardIcon, Shield } from 'lucide-react'
import { BillingForm, BillingDetails } from '@/components/payment/BillingForm'
import { PaymentMethods, PaymentMethod } from '@/components/payment/PaymentMethods'
import { SummaryBox } from '@/components/payment/SummaryBox'

type CardDetails = {
  number: string
  expiry: string
  cvv: string
}

const initialBilling: BillingDetails = {
  fullName: '',
  email: '',
  phone: '',
  country: '',
  address: '',
  postalCode: ''
}

const initialCard: CardDetails = {
  number: '',
  expiry: '',
  cvv: ''
}

// Placeholder functions for real integrations
async function processStripePayment(_billing: BillingDetails, _card: CardDetails, _brand: string) {
  return new Promise<{ success: boolean }>((resolve) => setTimeout(() => resolve({ success: true }), 900))
}

async function processPayPalPayment(_billing: BillingDetails) {
  return new Promise<{ success: boolean }>((resolve) => setTimeout(() => resolve({ success: true }), 900))
}

const fieldRequired = 'This field is required'

const PaymentPage: React.FC = () => {
  const [billing, setBilling] = useState<BillingDetails>(initialBilling)
  const [card, setCard] = useState<CardDetails>(initialCard)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const isCardMethod = useMemo(() => method && ['visa', 'mastercard', 'maestro', 'amex', 'other'].includes(method), [method])

  function updateBilling(patch: Partial<BillingDetails>) {
    setBilling((prev) => ({ ...prev, ...patch }))
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}

    if (!billing.fullName.trim()) nextErrors.fullName = fieldRequired
    if (!billing.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email)) nextErrors.email = 'Enter a valid email'
    if (!billing.phone.trim()) nextErrors.phone = fieldRequired
    if (!billing.country.trim()) nextErrors.country = fieldRequired
    if (!billing.address.trim()) nextErrors.address = fieldRequired
    if (!billing.postalCode.trim()) nextErrors.postalCode = fieldRequired

    if (!method) nextErrors.method = 'Select a payment method'

    if (isCardMethod) {
      if (!card.number.trim() || card.number.replace(/\s/g, '').length < 12) nextErrors.cardNumber = 'Enter a valid card number'
      if (!card.expiry.trim() || !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(card.expiry)) nextErrors.cardExpiry = 'Use MM/YY'
      if (!card.cvv.trim() || card.cvv.length < 3) nextErrors.cardCvv = 'Enter a valid CVV'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSuccess(false)
    try {
      let result = { success: false }
      if (method === 'paypal') {
        result = await processPayPalPayment(billing)
      } else if (isCardMethod && method) {
        result = await processStripePayment(billing, card, method)
      }
      if (result.success) {
        setSuccess(true)
        setErrors({})
        // reset form in mock flow
        setBilling(initialBilling)
        setCard(initialCard)
        setMethod(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">Checkout</h1>
          <p className="text-gray-600">Complete your billing details and choose a payment method.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BillingForm value={billing} onChange={updateBilling} errors={errors as any} />

              <PaymentMethods selected={method} onSelect={(m) => setMethod(m)} />

              {errors.method && (
                <div className="-mt-4">
                  <p className="text-sm text-red-600">{errors.method}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {isCardMethod && (
                  <motion.div
                    key="card-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="card-luxury"
                  >
                    <h3 className="text-lg font-serif font-semibold text-navy mb-4 flex items-center gap-2">
                      <CardIcon className="w-5 h-5 text-gold" />
                      Card Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label htmlFor="cardNumber" className="form-label">Card Number</label>
                        <input
                          id="cardNumber"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          className={`form-input w-full ${errors.cardNumber ? 'border-red-500' : ''}`}
                          placeholder="1234 5678 9012 3456"
                          value={card.number}
                          onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))
                          }
                          aria-invalid={!!errors.cardNumber}
                          aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
                        />
                        {errors.cardNumber && (
                          <p id="cardNumber-error" className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="cardExpiry" className="form-label">Expiration</label>
                        <input
                          id="cardExpiry"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          className={`form-input w-full ${errors.cardExpiry ? 'border-red-500' : ''}`}
                          placeholder="MM/YY"
                          value={card.expiry}
                          onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                          aria-invalid={!!errors.cardExpiry}
                          aria-describedby={errors.cardExpiry ? 'cardExpiry-error' : undefined}
                        />
                        {errors.cardExpiry && (
                          <p id="cardExpiry-error" className="mt-1 text-sm text-red-600">{errors.cardExpiry}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="cardCvv" className="form-label">CVV</label>
                        <input
                          id="cardCvv"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          className={`form-input w-full ${errors.cardCvv ? 'border-red-500' : ''}`}
                          placeholder="123"
                          value={card.cvv}
                          onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                          aria-invalid={!!errors.cardCvv}
                          aria-describedby={errors.cardCvv ? 'cardCvv-error' : undefined}
                        />
                        {errors.cardCvv && (
                          <p id="cardCvv-error" className="mt-1 text-sm text-red-600">{errors.cardCvv}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {method === 'paypal' && (
                  <motion.div
                    key="paypal"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="card-luxury"
                  >
                    <h3 className="text-lg font-serif font-semibold text-navy mb-4">PayPal</h3>
                    <p className="text-sm text-gray-600 mb-4">You will be redirected to PayPal to complete your purchase.</p>
                    <button
                      type="button"
                      onClick={() => handleSubmit(new Event('submit') as any)}
                      className="w-full bg-[#ffc439] hover:bg-[#f2b400] text-navy font-semibold py-3 rounded-lg transition-colors"
                      aria-label="Pay with PayPal"
                    >
                      Continue to PayPal
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="card-luxury">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Shield className="w-4 h-4 text-gold" />
                  <span>Payments are secured and encrypted.</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary disabled:opacity-60"
                >
                  {submitting ? 'Processing…' : 'Submit Payment'}
                </button>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2"
                      role="status"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Payment submitted successfully (mock).</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-1">
              <SummaryBox subtotal={1499} taxRate={0.2} currency="€" />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentPage





