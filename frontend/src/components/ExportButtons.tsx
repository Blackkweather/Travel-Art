import React, { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { adminApi } from '@/utils/api'
import { t } from '@/i18n'

/**
 * CSV and XLSX for one dataset, in one place.
 *
 * Every admin screen had grown its own export button and its own filename, and
 * two of them built the CSV in the browser from whatever page happened to be
 * loaded - so an "export" of the user list was really an export of the twenty
 * rows on screen. These go to the server, which exports the whole set and
 * writes the download to the audit log.
 */

type ExportType = 'bookings' | 'users' | 'logs'

const ExportButtons: React.FC<{ type: ExportType; className?: string }> = ({ type, className }) => {
  const [busy, setBusy] = useState<'csv' | 'xlsx' | null>(null)

  const run = async (format: 'csv' | 'xlsx') => {
    setBusy(format)
    try {
      const { response, filename } = await adminApi.exportData(type, format)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(t('Export téléchargé : {name}', { name: filename }))
    } catch (error) {
      console.error('Export failed', error)
      toast.error(t('L’export a échoué. Réessayez dans un instant.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={`flex gap-2 ${className || ''}`} data-testid={`export-${type}`}>
      <button
        type="button"
        onClick={() => run('csv')}
        disabled={busy !== null}
        className="btn-secondary text-sm inline-flex items-center gap-2"
        data-testid={`export-${type}-csv`}
      >
        <Download className="w-4 h-4" />
        {busy === 'csv' ? t('Export…') : 'CSV'}
      </button>
      <button
        type="button"
        onClick={() => run('xlsx')}
        disabled={busy !== null}
        className="btn-secondary text-sm inline-flex items-center gap-2"
        data-testid={`export-${type}-xlsx`}
      >
        <FileSpreadsheet className="w-4 h-4" />
        {busy === 'xlsx' ? t('Export…') : 'Excel'}
      </button>
    </div>
  )
}

export default ExportButtons
