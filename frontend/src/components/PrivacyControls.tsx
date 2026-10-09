import React, { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { privacyApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * Articles 15 and 17, where a person can actually reach them.
 *
 * Both rights already exist as endpoints; a right nobody can find is not one
 * they have, so they live on the account page rather than in a support inbox.
 */
const PrivacyControls: React.FC = () => {
  const { token, logout } = useAuthStore()
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  /* The export is a file behind an Authorization header, so an anchor cannot
     fetch it - the browser would send the request without the token. It is
     pulled as a blob and handed to the browser as a download instead. */
  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(privacyApi.exportUrl(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'travel-art-mes-donnees.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('Vos données ont été téléchargées.'))
    } catch (error) {
      console.error('Export failed', error)
      toast.error(t('Le téléchargement a échoué. Réessayez dans un instant.'))
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await privacyApi.deleteAccount(password)
      toast.success(t('Votre compte a été supprimé.'))
      logout()
      window.location.href = '/'
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message ||
          t('La suppression a échoué. Vérifiez votre mot de passe.')
      )
      setDeleting(false)
    }
  }

  return (
    <section className="panel p-6 mt-8" data-testid="privacy-controls">
      <h2 className="font-serif text-2xl text-content mb-2">{t('Vos données')}</h2>
      <p className="text-sm text-content-secondary mb-6 max-w-[62ch]">
        {t('Vous pouvez à tout moment obtenir une copie de ce que nous détenons à votre sujet, ou fermer votre compte.')}
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary text-sm inline-flex items-center gap-2"
          data-testid="export-data"
        >
          <Download className="w-4 h-4" />
          {exporting ? t('Préparation…') : t('Télécharger mes données')}
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-secondary text-sm inline-flex items-center gap-2 text-[var(--state-critical)]"
          data-testid="open-delete-account"
        >
          <Trash2 className="w-4 h-4" />
          {t('Supprimer mon compte')}
        </button>
      </div>

      {open && (
        <div className="mt-6 border border-line rounded-card p-5 bg-surface">
          <h3 className="font-medium text-content mb-2">{t('Supprimer définitivement votre compte')}</h3>
          <p className="text-sm text-content-secondary mb-4 max-w-[62ch]">
            {t('Vos informations personnelles seront effacées. Les écritures comptables liées à vos paiements sont conservées sans vous identifier, comme la loi l’exige. Cette action est irréversible.')}
          </p>

          <div className="space-y-3 max-w-md">
            <div>
              <label className="form-label" htmlFor="delete-password">{t('Votre mot de passe')}</label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full"
                data-testid="delete-password"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="delete-confirm">
                {t('Tapez SUPPRIMER pour confirmer')}
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="form-input w-full"
                data-testid="delete-confirm"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={() => { setOpen(false); setPassword(''); setConfirm('') }}
              className="btn-secondary text-sm"
            >
              {t('Annuler')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              /* Both the password and the exact word: the server demands them
                 too, so a bypassed form gains nothing. */
              disabled={deleting || confirm !== 'SUPPRIMER' || password.length === 0}
              className="btn-primary text-sm"
              data-testid="confirm-delete-account"
            >
              {deleting ? t('Suppression…') : t('Supprimer définitivement')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default PrivacyControls
