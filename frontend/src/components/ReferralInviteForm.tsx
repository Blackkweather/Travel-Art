import React, { useState } from 'react'
import toast from 'react-hot-toast'
import FormField from './FormField'
import { commonApi } from '@/utils/api'
import { checkEmail } from '@shared/validation'
import { t } from '@/i18n'

/**
 * Invite an artist by e-mail. The message carries the inviter's referral
 * link; points are credited when the invited person is admitted, not when
 * they sign up.
 */
const ReferralInviteForm: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const local: Record<string, string> = {}
    if (name.trim().length < 2) local.inviteeName = 'Indiquez le nom de la personne'
    const verdict = checkEmail(email)
    if (!verdict.ok) local.inviteeEmail = verdict.message!
    if (Object.keys(local).length) return setErrors(local)

    setSending(true)
    try {
      await commonApi.inviteReferral({ inviteeName: name.trim(), inviteeEmail: verdict.email })
      toast.success(t('Invitation envoyée à {email}', { email: verdict.email }))
      setName('')
      setEmail('')
      setErrors({})
    } catch (error: any) {
      setErrors(error?.response?.data?.error?.fields ?? {})
      toast.error(error?.response?.data?.error?.message || t('L’invitation n’a pas pu être envoyée'))
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={send} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" noValidate>
      <FormField label={t('Nom')} value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, inviteeName: '' })) }} error={errors.inviteeName ? t(errors.inviteeName) : undefined} maxLength={50} />
      <FormField type="email" label="E-mail" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, inviteeEmail: '' })) }} error={errors.inviteeEmail ? t(errors.inviteeEmail) : undefined} />
      <button type="submit" disabled={sending} className="btn-primary">{sending ? t('Envoi…') : t('Envoyer l’invitation')}</button>
    </form>
  )
}

export default ReferralInviteForm
