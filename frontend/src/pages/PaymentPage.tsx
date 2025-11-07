import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, CreditCard as CardIcon, Shield } from 'lucide-react'
import { BillingForm, BillingDetails } from '@/components/payment/BillingForm'
import { PaymentMethods, PaymentMethod } from '@/components/payment/PaymentMethods'
import { SummaryBox } from '@/components/payment/SummaryBox'
import PaymentReceipt from '@/components/payment/PaymentReceipt'
import { getLogoUrl } from '@/config/assets'

type CardDetails = {
  number: string
  expiry: string
  cvv: string
}

type MockTransaction = {
  transactionId: string
  reference: string
  method: string
  amount: number
  currency: string
  status: 'APPROVED' | 'DECLINED'
  processedAt: string
  payerEmail?: string
  cardLast4?: string
}

type PaymentResponse = {
  success: boolean
  transaction: MockTransaction
}

const TRANSACTION_STORAGE_KEY = 'travel-art:last-transaction'

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

function createMockTransaction(method: string, amount: number, currency: string, billing: BillingDetails, card?: CardDetails): MockTransaction {
  const timestamp = new Date()
  const last4 = card?.number ? card.number.slice(-4) : undefined
  return {
    transactionId: `txn_${Math.random().toString(36).slice(2, 10)}`,
    reference: `TA-${timestamp.getTime().toString(36).toUpperCase()}`,
    method,
    amount,
    currency,
    status: 'APPROVED',
    processedAt: timestamp.toISOString(),
    payerEmail: billing.email,
    cardLast4: last4,
  }
}

// Mock payment processors that simulate external providers
async function processStripePayment(billing: BillingDetails, card: CardDetails, brand: string, amount: number, currency: string): Promise<PaymentResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transaction: createMockTransaction(`${brand.toUpperCase()} (Stripe)`, amount, currency, billing, card),
      })
    }, 900)
  })
}

async function processPayPalPayment(billing: BillingDetails, amount: number, currency: string): Promise<PaymentResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        transaction: createMockTransaction('PayPal', amount, currency, billing),
      })
    }, 900)
  })
}

const fieldRequired = 'This field is required'

const PaymentPage: React.FC = () => {
  const [billing, setBilling] = useState<BillingDetails>(initialBilling)
  const [card, setCard] = useState<CardDetails>(initialCard)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [transaction, setTransaction] = useState<MockTransaction | null>(null)

  const isCardMethod = useMemo(() => method && ['visa', 'mastercard', 'maestro', 'amex', 'other'].includes(method), [method])

  const subtotal = 1499
  const taxRate = 0.2
  const tax = useMemo(() => Math.round(subtotal * taxRate * 100) / 100, [subtotal, taxRate])
  const total = useMemo(() => Math.round((subtotal + tax) * 100) / 100, [subtotal, tax])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as MockTransaction
        setTransaction(parsed)
        setSuccess(true)
      }
    } catch (error) {
      console.warn('Failed to load stored transaction', error)
    }
  }, [])

  useEffect(() => {
    if (!transaction) {
      localStorage.removeItem(TRANSACTION_STORAGE_KEY)
      return
    }
    try {
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transaction))
    } catch (error) {
      console.warn('Failed to persist transaction', error)
    }
  }, [transaction])

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
    setTransaction(null)
    try {
      let result: PaymentResponse | null = null
      if (method === 'paypal') {
        result = await processPayPalPayment(billing, total, '€')
      } else if (isCardMethod && method) {
        result = await processStripePayment(billing, card, method, total, '€')
      }
      if (result?.success) {
        setSuccess(true)
        setErrors({})
        setTransaction(result.transaction)
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

                {transaction && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <PaymentReceipt
                      transaction={transaction}
                      onDownload={async () => {
                        try {
                          const jsPDFModule = await import('jspdf')
                          const jsPDF = (jsPDFModule.default || jsPDFModule) as typeof import('jspdf')
                          const pdf = new (jsPDF as any)()
                          
                          const marginLeft = 20
                          const marginTop = 20
                          let cursor = marginTop
                          const pageWidth = pdf.internal.pageSize.getWidth()
                          const pageHeight = pdf.internal.pageSize.getHeight()

                          // Load and add logo
                          try {
                            const logoUrl = getLogoUrl('final')
                            // Convert logo URL to base64 for PDF
                            const logoResponse = await fetch(logoUrl)
                            const logoBlob = await logoResponse.blob()
                            const logoBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader()
                              reader.onloadend = () => resolve(reader.result as string)
                              reader.readAsDataURL(logoBlob)
                            })
                            
                            // Add logo at top (50x20mm)
                            pdf.addImage(logoBase64, 'PNG', marginLeft, cursor, 50, 20)
                            cursor += 25
                          } catch (logoError) {
                            console.warn('Could not load logo, continuing without it', logoError)
                            // Add text header if logo fails
                            pdf.setFontSize(20)
                            pdf.setTextColor(11, 31, 63) // Navy color
                            pdf.text('Travel Art', marginLeft, cursor)
                            cursor += 10
                          }

                          // Receipt title
                          pdf.setFontSize(18)
                          pdf.setTextColor(11, 31, 63) // Navy color
                          pdf.text('Payment Receipt', marginLeft, cursor)
                          cursor += 12

                          // Date
                          pdf.setFontSize(10)
                          pdf.setTextColor(100, 100, 100) // Gray
                          const paymentDate = new Date(transaction.processedAt)
                          pdf.text(`Date: ${paymentDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}`, marginLeft, cursor)
                          cursor += 15

                          // Divider line
                          pdf.setDrawColor(200, 200, 200)
                          pdf.line(marginLeft, cursor, pageWidth - marginLeft, cursor)
                          cursor += 10

                          // Payment details
                          pdf.setFontSize(11)
                          pdf.setTextColor(0, 0, 0) // Black

                          const details: Array<{ label: string; value: string; highlight?: boolean }> = [
                            { label: 'Transaction ID', value: transaction.transactionId },
                            { label: 'Reference Number', value: transaction.reference },
                            { label: 'Payment Method', value: transaction.method },
                            { label: 'Status', value: transaction.status, highlight: true },
                            { label: 'Amount Paid', value: `${transaction.currency}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: true },
                            { label: 'Payment Date', value: paymentDate.toLocaleString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) },
                          ]

                          if (transaction.payerEmail) {
                            details.push({ label: 'Email', value: transaction.payerEmail })
                          }
                          if (transaction.cardLast4) {
                            details.push({ label: 'Card Number', value: `•••• ${transaction.cardLast4}` })
                          }

                          details.forEach(({ label, value, highlight }) => {
                            if (cursor > pageHeight - 30) {
                              pdf.addPage()
                              cursor = marginTop
                            }
                            
                            pdf.setFontSize(9)
                            pdf.setTextColor(100, 100, 100) // Gray for labels
                            pdf.text(label + ':', marginLeft, cursor)
                            
                            pdf.setFontSize(11)
                            if (highlight) {
                              pdf.setTextColor(11, 31, 63) // Navy for highlighted values
                              pdf.setFont('helvetica', 'bold')
                            } else {
                              pdf.setTextColor(0, 0, 0) // Black for regular values
                              pdf.setFont('helvetica', 'normal')
                            }
                            pdf.text(value, marginLeft + 60, cursor)
                            
                            cursor += 8
                          })

                          cursor += 5
                          
                          // Divider line
                          pdf.setDrawColor(200, 200, 200)
                          pdf.line(marginLeft, cursor, pageWidth - marginLeft, cursor)
                          cursor += 10

                          // Footer
                          pdf.setFontSize(8)
                          pdf.setTextColor(100, 100, 100)
                          pdf.setFont('helvetica', 'italic')
                          pdf.text(
                            'Thank you for your payment. This receipt serves as proof of payment.',
                            marginLeft,
                            cursor,
                            { maxWidth: pageWidth - (marginLeft * 2) }
                          )
                          cursor += 8
                          pdf.text(
                            'For questions, please contact support@travelart.com',
                            marginLeft,
                            cursor
                          )

                          // Save PDF
                          pdf.save(`receipt-${transaction.reference}-${paymentDate.toISOString().split('T')[0]}.pdf`)
                        } catch (error) {
                          console.error('Error generating receipt PDF:', error)
                          alert('Failed to generate receipt PDF. Please try again.')
                        }
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <SummaryBox subtotal={subtotal} taxRate={taxRate} currency="€" />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentPage









