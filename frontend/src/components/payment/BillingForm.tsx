import React from 'react'

export type BillingDetails = {
  fullName: string
  email: string
  phone: string
  country: string
  address: string
  postalCode: string
}

type BillingFormProps = {
  value: BillingDetails
  onChange: (patch: Partial<BillingDetails>) => void
  errors?: Partial<Record<keyof BillingDetails, string>>
}

const inputClass =
  'form-input w-full'

export const BillingForm: React.FC<BillingFormProps> = ({ value, onChange, errors = {} }) => {
  return (
    <div className="card-luxury">
      <h2 className="text-xl font-serif font-semibold text-navy mb-6 gold-underline">Billing Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fullName" className="form-label">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={value.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            className={`${inputClass} ${errors.fullName ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={value.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="form-label">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className={`${inputClass} ${errors.phone ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="form-label">Country</label>
          <select
            id="country"
            name="country"
            value={value.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className={`${inputClass} ${errors.country ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? 'country-error' : undefined}
          >
            <option value="">Select country</option>
            <option value="France">France</option>
            <option value="Spain">Spain</option>
            <option value="Portugal">Portugal</option>
            <option value="Morocco">Morocco</option>
            <option value="Italy">Italy</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="United States">United States</option>
          </select>
          {errors.country && (
            <p id="country-error" className="mt-1 text-sm text-red-600">{errors.country}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="form-label">Address</label>
          <input
            id="address"
            name="address"
            type="text"
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className={`${inputClass} ${errors.address ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address && (
            <p id="address-error" className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-4">
          <div>
            <label htmlFor="postalCode" className="form-label">Postal code</label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              value={value.postalCode}
              onChange={(e) => onChange({ postalCode: e.target.value })}
              className={`${inputClass} ${errors.postalCode ? 'border-red-500' : ''}`}
              aria-invalid={!!errors.postalCode}
              aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
            />
            {errors.postalCode && (
              <p id="postalCode-error" className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillingForm


























