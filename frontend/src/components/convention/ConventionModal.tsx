import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Download, FileSignature, X } from 'lucide-react'
import { fieldErrors, hotelSignatureSchema, participantSignatureSchema } from '@shared/validation'
import { conventionsApi } from '@/utils/api'
import type { ConventionBlock, ConventionView } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import { t } from '@/i18n'

/**
 * The convention of one booking: the document as both parties will sign it,
 * and, for the party whose turn it is, the form that signs it.
 *
 * The document text is the contract and stays in French whatever the
 * interface language: what is signed is the French text.
 */

interface Props {
  bookingId: string
  onClose: () => void
  /** After a signature; `finalized` when it was the last one. */
  onSigned?: (finalized: boolean) => void
}

const PARTY_LABEL: Record<string, string> = {
  HOTEL: 'L’hôtel',
  PARTICIPANT: 'L’artiste',
  COORDINATOR: 'Le coordinateur',
}

const Block: React.FC<{ block: ConventionBlock }> = ({ block }) => {
  switch (block.kind) {
    case 'title':
      return <h2 className="text-center font-serif text-xl font-bold text-content">{block.text}</h2>
    case 'subtitle':
      return <p className="mb-4 text-center italic text-content-secondary">{block.text}</p>
    case 'heading':
      return <h3 className="mt-5 font-semibold text-content">{block.text}</h3>
    case 'subheading':
      return <h4 className="mt-3 text-sm font-semibold uppercase tracking-wide text-content-secondary">{block.text}</h4>
    case 'paragraph':
      return <p className={`mt-1.5 ${block.strong ? 'font-semibold text-content' : 'text-content'}`}>{block.text}</p>
    case 'field':
      return (
        <p className="mt-1">
          <span className="font-semibold text-content">{block.label} : </span>
          <span className="break-words text-content">{block.value}</span>
        </p>
      )
    case 'list':
      return (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-content">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'rule':
      return <hr className="my-4 border-gold/50" />
    case 'signature':
      return (
        <div className={`mt-3 rounded-card border p-3 ${block.signedAt ? 'border-gold' : 'border-line'}`}>
          <p className="font-semibold text-content">{block.label}</p>
          {block.lines.map((line, i) => (
            <p key={i} className={line.startsWith('Signé') ? 'italic text-content-secondary' : 'text-content'}>
              {line}
            </p>
          ))}
        </div>
      )
  }
}

const HOTEL_FIELDS: { key: string; label: string; required?: boolean; hint?: string }[] = [
  { key: 'legalName', label: 'Dénomination (raison sociale)', required: true },
  { key: 'legalForm', label: 'Forme juridique', hint: 'SARL, SA, SAS…' },
  { key: 'address', label: 'Adresse du siège ou de l’établissement', required: true },
  { key: 'registrationNumber', label: 'RC / numéro d’immatriculation' },
  { key: 'taxId', label: 'ICE / identifiant fiscal' },
  { key: 'signatoryName', label: 'Nom du signataire', required: true },
  { key: 'signatoryTitle', label: 'Fonction du signataire', required: true, hint: 'Gérant, directeur…' },
]

const PARTICIPANT_FIELDS: { key: string; label: string; required?: boolean; hint?: string }[] = [
  { key: 'fullName', label: 'Nom complet (tel que sur votre pièce d’identité)', required: true },
  { key: 'address', label: 'Adresse postale', required: true },
  { key: 'idDocument', label: 'Numéro de CIN ou de passeport', required: true, hint: 'Il n’apparaît que dans la convention.' },
]

const ConventionModal: React.FC<Props> = ({ bookingId, onClose, onSigned }) => {
  const [view, setView] = useState<ConventionView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [accept, setAccept] = useState(false)
  const [typedName, setTypedName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = () =>
    conventionsApi
      .get(bookingId)
      .then((res) => {
        const data = res.data.data as ConventionView
        setView(data)
        if (data.prefill) setForm((f) => ({ ...data.prefill, ...f }))
      })
      .catch((e) => setError(e?.response?.data?.error?.message || t('Impossible de charger la convention.')))

  useEffect(() => {
    load()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  const fields = view?.party === 'HOTEL' ? HOTEL_FIELDS : PARTICIPANT_FIELDS
  const signatoryKey = view?.party === 'HOTEL' ? 'signatoryName' : 'fullName'

  const submit = async () => {
    if (!view) return
    const body = { ...form, accept, typedName, termsHash: view.termsHash }
    const schema = view.party === 'HOTEL' ? hotelSignatureSchema : participantSignatureSchema
    const check = schema.safeParse(body)
    if (!check.success) {
      setErrors(fieldErrors(check.error))
      return
    }
    setSending(true)
    try {
      const res = await conventionsApi.sign(bookingId, body)
      const finalized = Boolean(res.data.data?.finalized)
      toast.success(
        finalized
          ? t('Convention signée par toutes les parties. Elle vous est envoyée par e-mail.')
          : t('Signature enregistrée. La convention attend maintenant la signature de l’autre partie.')
      )
      onSigned?.(finalized)
      setErrors({})
      await load()
    } catch (e: any) {
      const apiError = e?.response?.data?.error
      if (apiError?.fields) setErrors(apiError.fields)
      if (apiError?.code === 'TERMS_CHANGED') await load()
      toast.error(apiError?.message || t('La signature n’a pas pu être enregistrée.'))
    } finally {
      setSending(false)
    }
  }

  const download = async () => {
    setDownloading(true)
    try {
      await conventionsApi.downloadPdf(bookingId)
    } catch {
      toast.error(t('Le téléchargement a échoué. Réessayez.'))
    } finally {
      setDownloading(false)
    }
  }

  const err = (key: string) => (errors[key] ? <p className="mt-1 text-sm text-[var(--state-critical)]">{t(errors[key])}</p> : null)

  // On the body: the booking cards animate with transforms, and a fixed
  // element inside a transformed one is positioned against the card, not the
  // screen.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(11,31,63,0.55)] p-2 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="convention-title"
        className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-line bg-surface-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-4">
          <div className="min-w-0">
            <h2 id="convention-title" className="font-serif text-lg font-semibold text-content">
              {t('Convention tripartite')} {view ? <span className="text-content-secondary">· {view.reference}</span> : null}
            </h2>
            {view && (
              <p className="mt-1 text-sm text-content-secondary">
                {view.status === 'SIGNED'
                  ? t('Signée par toutes les parties le {date}.', { date: new Date(view.finalizedAt!).toLocaleDateString('fr-FR') })
                  : view.signatures.length
                    ? `${t('Déjà signée par')} : ${view.signatures.map((s) => t(PARTY_LABEL[s.party])).join(', ')}`
                    : t('Aucune signature pour le moment.')}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {view && (
              <button type="button" className="btn-outline btn-sm" onClick={download} disabled={downloading} data-testid="convention-download">
                <Download className="mr-1 h-4 w-4" aria-hidden="true" />
                {view.status === 'SIGNED' ? t('PDF signé') : t('PDF (projet)')}
              </button>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={onClose} aria-label={t('Fermer')}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && <div className="notice-critical">{error}</div>}
          {!view && !error && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}
          {view && (
            <>
              <article lang="fr" className="rounded-card border border-line bg-surface p-4 text-[0.875rem] leading-relaxed sm:p-6" data-testid="convention-document">
                {view.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </article>

              {view.canSign && (
                <section className="mt-6 space-y-4" aria-labelledby="sign-title" data-testid="convention-sign-form">
                  <h3 id="sign-title" className="flex items-center gap-2 font-serif text-lg font-semibold text-content">
                    <FileSignature className="h-5 w-5 text-gold" aria-hidden="true" />
                    {view.party === 'HOTEL' ? t('Signer pour l’hôtel') : t('Signer la convention')}
                  </h3>
                  <p className="text-sm text-content-secondary">
                    {view.party === 'HOTEL'
                      ? t('Ces informations identifient l’hôtel dans la convention. Elles sont gardées pour vos prochaines conventions.')
                      : t('Votre adresse et votre pièce d’identité n’apparaissent que dans la convention, que seuls l’hôtel et notre équipe reçoivent.')}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.key} className={f.key === 'address' ? 'sm:col-span-2' : ''}>
                        <label className="form-label" htmlFor={`sign-${f.key}`}>
                          {t(f.label)}
                          {f.required ? ' *' : ''}
                        </label>
                        <input
                          id={`sign-${f.key}`}
                          className="form-input w-full"
                          value={form[f.key] ?? ''}
                          onChange={(e) => {
                            setForm((v) => ({ ...v, [f.key]: e.target.value }))
                            setErrors((x) => ({ ...x, [f.key]: '' }))
                          }}
                          autoComplete="off"
                        />
                        {f.hint && <p className="mt-1 text-[0.8125rem] text-content-secondary">{t(f.hint)}</p>}
                        {err(f.key)}
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-3 text-sm text-content">
                    <input type="checkbox" className="mt-1" checked={accept} onChange={(e) => setAccept(e.target.checked)} data-testid="convention-accept" />
                    <span>{t('J’ai lu l’intégralité de la convention ci-dessus et je l’accepte librement, y compris l’échange sans rémunération, les conditions d’annulation et le droit marocain.')}</span>
                  </label>
                  {err('accept')}

                  <div>
                    <label className="form-label" htmlFor="sign-typed-name">
                      {t('Tapez « {name} » pour signer', { name: form[signatoryKey] || t('votre nom') })}
                    </label>
                    <input id="sign-typed-name" className="form-input w-full font-serif text-lg" value={typedName} onChange={(e) => setTypedName(e.target.value)} autoComplete="off" />
                    {err('typedName')}
                    {err('termsHash')}
                  </div>

                  <div className="flex justify-end">
                    <button type="button" className="btn-primary" onClick={submit} disabled={sending} data-testid="convention-sign">
                      {sending ? t('Signature…') : t('Signer électroniquement')}
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConventionModal
