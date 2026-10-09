import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * "Send me a new confirmation link." The API answers the same way whether or
 * not the address exists, so this only ever says the request was taken.
 * A minute's pause between presses keeps it from being hammered.
 */
const ResendVerification: React.FC<{ email: string; className?: string }> = ({ email, className }) => {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const send = async () => {
    setState('sending')
    try {
      await authApi.resendVerification(email)
      setState('sent')
      toast.success(t('Si un compte non confirmé existe pour cette adresse, un nouveau lien vient de lui être envoyé.'))
      setTimeout(() => setState('idle'), 60_000)
    } catch (error: any) {
      setState('idle')
      toast.error(error?.response?.data?.error?.message || t('Envoi impossible pour le moment.'))
    }
  }

  return (
    <button type="button" onClick={send} disabled={!email || state !== 'idle'} className={className ?? 'btn-secondary'}>
      {state === 'sending' ? t('Envoi…') : state === 'sent' ? t('Lien envoyé') : t('Renvoyer le lien de confirmation')}
    </button>
  )
}

export default ResendVerification
