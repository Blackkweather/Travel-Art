import React from 'react'
import { BOARD_LABELS, TRANSPORT_LABELS } from '@shared/validation'
import type { Booking } from '@/types'
import { t } from '@/i18n'
import { formatNumber } from '@/utils/i18n'

/**
 * The terms of one residency, as the exchange convention will write them:
 * the stay is for two, nobody is paid, and both sides' values are stated.
 * Shown to both parties from the request on, so the artist answers knowing
 * exactly what the hotel is offering. The other party's phone and e-mail
 * appear here once the residency is confirmed - not before.
 */

const nights = (start: string, end: string) =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000))

const money = (value: number | null | undefined, currency = 'EUR') =>
  value === null || value === undefined ? null : `${formatNumber(value)} ${currency === 'EUR' ? '€' : currency}`

interface Props {
  booking: Booking
  /** Whose screen this is: decides whose contact block is shown. */
  viewer: 'ARTIST' | 'HOTEL'
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
    <dt className="min-w-[11rem] text-content-secondary">{label}</dt>
    <dd className="text-content">{children}</dd>
  </div>
)

const ConventionSummary: React.FC<Props> = ({ booking, viewer }) => {
  const c = booking.convention
  const contact = viewer === 'HOTEL' ? booking.artist?.contact : booking.hotel?.contact
  const stayValue = money(c?.stayValue, c?.currency)
  const performanceValue = money(c?.performanceValue, c?.currency)

  return (
    <div className="space-y-4 text-sm">
      <dl className="space-y-2">
        <Row label={t('Séjour')}>
          {t('{n} nuit(s) pour deux personnes', { n: String(nights(booking.startDate, booking.endDate)) })}
          {c?.companionName ? ` — ${t('accompagnant')} : ${c.companionName}` : ''}
        </Row>
        {c?.roomType && <Row label={t('Chambre')}>{c.roomType}</Row>}
        {c?.boardType && <Row label={t('Formule')}>{t(BOARD_LABELS[c.boardType])}</Row>}
        {c?.includedServices && <Row label={t('Inclus en plus')}>{c.includedServices}</Row>}
        {c?.transportTerms && (
          <Row label={t('Transport')}>
            {t(TRANSPORT_LABELS[c.transportTerms])}
            {c.transportNotes ? ` — ${c.transportNotes}` : ''}
          </Row>
        )}
        {c?.performanceDescription && <Row label={t('Prestation')}>{c.performanceDescription}</Row>}
        {c?.performanceSchedule && <Row label={t('Horaires')}>{c.performanceSchedule}</Row>}
        {c?.performanceDuration && <Row label={t('Durée')}>{c.performanceDuration}</Row>}
        {c?.performanceLocation && <Row label={t('Lieu')}>{c.performanceLocation}</Row>}
        {c?.technicalConditions && <Row label={t('Technique')}>{c.technicalConditions}</Row>}
        {c?.socialContent && <Row label={t('Publications')}>{c.socialContent}</Row>}
        {(stayValue || performanceValue) && (
          <Row label={t('Valeurs échangées')}>
            {[stayValue && `${t('séjour')} ${stayValue}`, performanceValue && `${t('prestation')} ${performanceValue}`]
              .filter(Boolean)
              .join(' · ')}
          </Row>
        )}
        <Row label={t('Rémunération')}>{t('Aucune : le séjour est la contrepartie de la prestation.')}</Row>
      </dl>

      {contact && (contact.phone || contact.email) && (
        <div className="rounded-card border border-line bg-surface p-3">
          <p className="stat__label">{viewer === 'HOTEL' ? t('Contact de l’artiste') : t('Contact de l’hôtel')}</p>
          <p className="mt-1 text-content">
            {[contact.name, contact.phone, contact.email].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {booking.status === 'CANCELLED' && (
        <p className="text-content-secondary">
          {booking.cancelledByRole === 'HOTEL' ? t('Annulée par l’hôtel') : booking.cancelledByRole === 'ARTIST' ? t('Annulée par l’artiste') : t('Annulée')}
          {booking.cancelledAt ? ` ${t('le')} ${new Date(booking.cancelledAt).toLocaleDateString('fr-FR')}` : ''}
          {booking.cancellationReason ? ` — ${booking.cancellationReason}` : ''}
        </p>
      )}
      {booking.status === 'REJECTED' && booking.cancellationReason && (
        <p className="text-content-secondary">{t('Motif du refus')} : {booking.cancellationReason}</p>
      )}
    </div>
  )
}

export default ConventionSummary
