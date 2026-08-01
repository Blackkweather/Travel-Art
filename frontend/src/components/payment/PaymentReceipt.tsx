import React from 'react'

export type PaymentReceiptProps = {
  transaction: {
    transactionId: string
    reference: string
    method: string
    amount: number
    currency: string
    status: string
    processedAt: string
    payerEmail?: string
    cardLast4?: string
  }
  onDownload?: () => void
}

const labelClass = 'block text-xs uppercase text-content-secondary'
const valueClass = 'font-medium text-navy'

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ transaction, onDownload }) => {
  return (
    <div className="mt-4 bg-surface-raised border border-line rounded-lg p-4 text-sm text-content-secondary space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-content">Mock Receipt</h3>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="text-sm font-semibold text-gold hover:text-gold/80"
          >
            Download PDF
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <span className={labelClass}>Transaction ID</span>
          <span className={valueClass}>{transaction.transactionId}</span>
        </div>
        <div>
          <span className={labelClass}>Reference</span>
          <span className={valueClass}>{transaction.reference}</span>
        </div>
        <div>
          <span className={labelClass}>Method</span>
          <span className={valueClass}>{transaction.method}</span>
        </div>
        <div>
          <span className={labelClass}>Processed</span>
          <span className={valueClass}>{new Date(transaction.processedAt).toLocaleString()}</span>
        </div>
        <div>
          <span className={labelClass}>Amount</span>
          <span className={valueClass}>{`${transaction.currency}${transaction.amount.toLocaleString()}`}</span>
        </div>
        <div>
          <span className={labelClass}>Status</span>
          <span className={`${valueClass} text-green-700 dark:text-green-400`}>{transaction.status}</span>
        </div>
        {transaction.cardLast4 && (
          <div>
            <span className={labelClass}>Card Last 4</span>
            <span className={valueClass}>•••• {transaction.cardLast4}</span>
          </div>
        )}
        {transaction.payerEmail && (
          <div>
            <span className={labelClass}>Receipt Sent To</span>
            <span className={valueClass}>{transaction.payerEmail}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-content-secondary">
        This is a mock payment record for demo purposes. Integrate with Stripe or PayPal server-side APIs before going live.
      </p>
    </div>
  )
}

export default PaymentReceipt


















