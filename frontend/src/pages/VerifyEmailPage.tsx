import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { apiClient } from '@/utils/api'
import { t } from '@/i18n'

type State =
  | { kind: 'working' }
  | { kind: 'done'; approved: boolean; message: string }
  | { kind: 'failed'; message: string }

/**
 * Target of the confirmation link sent at registration.
 *
 * The request fires once and only once. React 18 mounts every component twice
 * in StrictMode, so a bare useEffect would send the token twice; the second
 * call is harmless here because the endpoint is idempotent, but it would still
 * flash an error if the first response arrived after the second. The ref
 * guards it.
 */
const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<State>({ kind: 'working' })
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    if (!token) {
      setState({ kind: 'failed', message: t('Ce lien de confirmation est incomplet.') })
      return
    }

    apiClient
      .post('/auth/verify-email', { token })
      .then((res) => {
        const data = res.data?.data ?? {}
        setState({
          kind: 'done',
          approved: data.approvalStatus === 'APPROVED',
          message: data.message ?? t('Adresse confirmée.'),
        })
      })
      .catch((err) => {
        setState({
          kind: 'failed',
          message:
            err?.response?.data?.error?.message ??
            t('Ce lien de confirmation est invalide ou a expiré.'),
        })
      })
  }, [token])

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SimpleNavbar />

      <main className="shell pb-24 pt-32 md:pt-40">
        <div className="max-w-prose">
          <span className="eyebrow">{t('Confirmation')}</span>

          {state.kind === 'working' && (
            <>
              <h1 className="mt-6 font-serif text-[2.25rem] leading-tight text-content md:text-[3rem]">
                {t('Confirmation en cours')}
              </h1>
              <div className="mt-10">
                <LoadingSpinner />
              </div>
            </>
          )}

          {state.kind === 'done' && (
            <>
              <h1 className="mt-6 font-serif text-[2.25rem] leading-tight text-content md:text-[3rem]">
                {t('Adresse confirmée')}
              </h1>
              <p className="mt-4 text-lg text-content-secondary">{state.message}</p>
              <span className="rule-reveal mt-10" />
              <div className="mt-10 flex flex-wrap gap-4">
                {state.approved ? (
                  <Link to="/login" className="btn-primary">
                    {t('Se connecter')}
                  </Link>
                ) : (
                  <Link to="/" className="btn-secondary">
                    {t('Retour à l’accueil')}
                  </Link>
                )}
              </div>
            </>
          )}

          {state.kind === 'failed' && (
            <>
              <h1 className="mt-6 font-serif text-[2.25rem] leading-tight text-content md:text-[3rem]">
                {t('Lien invalide')}
              </h1>
              <div className="notice-critical mt-6">{state.message}</div>
              <p className="mt-6 text-content-secondary">
                {t('Les liens de confirmation expirent après 24 heures. Vous pouvez en demander un nouveau depuis la page de connexion.')}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/login" className="btn-secondary">
                  {t('Aller à la connexion')}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default VerifyEmailPage
