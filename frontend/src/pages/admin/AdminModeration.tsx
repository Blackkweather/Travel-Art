import React, { useEffect, useState } from 'react'
import { artistsApi, hotelsApi, adminApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { User, Building, Download, Eye, Ban, CheckCircle } from 'lucide-react'
import { t } from '@/i18n'

type ArtistListItem = {
  id: string
  userId?: string
  user?: { id?: string; name?: string; email?: string }
  name?: string
  discipline?: string
}

type HotelListItem = {
  id: string
  userId?: string
  user?: { id?: string; name?: string; email?: string }
  name: string
  location?: string
}

const AdminModeration: React.FC = () => {
  const [tab, setTab] = useState<'artists' | 'hotels'>('artists')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [artists, setArtists] = useState<ArtistListItem[]>([])
  const [hotels, setHotels] = useState<HotelListItem[]>([])
  const [processing, setProcessing] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [aRes, hRes] = await Promise.all([
        artistsApi.getAll({ limit: 100 }),
        hotelsApi.getAll({ limit: 100 })
      ])
      
      // Handle artists response - can be { data: { artists: [...], pagination: {...} } } or { data: [...] }
      let artistsData: ArtistListItem[] = []
      if (aRes.data?.data) {
        if (Array.isArray(aRes.data.data)) {
          artistsData = aRes.data.data as ArtistListItem[]
        } else if (aRes.data.data.artists && Array.isArray(aRes.data.data.artists)) {
          artistsData = aRes.data.data.artists.map((a: any) => ({
            id: a.id,
            userId: a.userId,
            user: a.user,
            name: a.user?.name || a.name,
            discipline: a.discipline
          })) as ArtistListItem[]
        }
      }
      
      // Handle hotels response - can be { data: [...] } or { data: { hotels: [...], pagination: {...} } }
      let hotelsData: HotelListItem[] = []
      if (hRes.data?.data) {
        if (Array.isArray(hRes.data.data)) {
          hotelsData = hRes.data.data.map((h: any) => ({
            id: h.id,
            userId: h.userId,
            user: h.user,
            name: h.name || h.user?.name || 'Hotel',
            location: typeof h.location === 'string' ? h.location : (h.location?.city || h.location?.country || '')
          })) as HotelListItem[]
        } else if (hRes.data.data.hotels && Array.isArray(hRes.data.data.hotels)) {
          hotelsData = hRes.data.data.hotels.map((h: any) => ({
            id: h.id,
            userId: h.userId,
            user: h.user,
            name: h.name || h.user?.name || 'Hotel',
            location: typeof h.location === 'string' ? h.location : (h.location?.city || h.location?.country || '')
          })) as HotelListItem[]
        }
      }
      
      setArtists(artistsData)
      setHotels(hotelsData)
    } catch (e: any) {
      console.error('Moderation load error:', e)
      setError(e?.response?.data?.message || e?.message || 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const suspendUser = async (userId?: string) => {
    if (!userId) return
    if (!confirm('Suspend this user?')) return
    try {
      setProcessing(userId)
      await adminApi.suspendUser(userId, { reason: 'Suspicious content' })
      await load()
    } catch {
      alert('Impossible de suspendre cet utilisateur')
    } finally {
      setProcessing(null)
    }
  }

  const activateUser = async (userId?: string) => {
    if (!userId) return
    try {
      setProcessing(userId)
      await adminApi.activateUser(userId)
      await load()
    } catch {
      alert('Impossible de réactiver cet utilisateur')
    } finally {
      setProcessing(null)
    }
  }

  const exportToCSV = (data: ArtistListItem[] | HotelListItem[], type: 'artists' | 'hotels') => {
    const headers = type === 'artists' 
      ? ['ID', 'Name', 'Email', 'Discipline', 'User ID']
      : ['ID', 'Name', 'Email', 'Location', 'User ID']
    
    const rows = data.map(item => {
      const name = item.user?.name || item.name || 'N/A'
      const email = item.user?.email || 'N/A'
      const userId = item.user?.id || item.userId || 'N/A'
      
      if (type === 'artists') {
        const artist = item as ArtistListItem
        return [item.id, name, email, artist.discipline || 'N/A', userId]
      } else {
        const hotel = item as HotelListItem
        return [item.id, name, email, hotel.location || 'N/A', userId]
      }
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${type}-moderation-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="shell py-12 md:py-16">
        <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
              <h1 className="page-head__title">
                {t('Modération des contenus')}
              </h1>
              <p className="page-head__lede">
                {t('Examiner les artistes et les hôtels ; suspendre ou réactiver un compte.')}
              </p>
        </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-surface-raised border border-line rounded-card p-1">
            <button 
              onClick={() => setTab('artists')} 
              className={`px-4 py-2 rounded-card text-sm font-medium transition-all ${
                tab === 'artists' 
                  ? 'bg-surface-inverse text-white shadow-sm' 
                  : 'text-content-secondary hover:text-content hover:bg-surface'
              }`}
            >
              {t('Artistes')}
            </button>
            <button 
              onClick={() => setTab('hotels')} 
              className={`px-4 py-2 rounded-card text-sm font-medium transition-all ${
                tab === 'hotels' 
                  ? 'bg-surface-inverse text-white shadow-sm' 
                  : 'text-content-secondary hover:text-content hover:bg-surface'
              }`}
            >
              {t('Hôtels')}
            </button>
          </div>
          <button
            onClick={() => exportToCSV(tab === 'artists' ? artists : hotels, tab)}
            className="btn-ghost btn-sm"
            title="Exporter en CSV"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]"><LoadingSpinner /></div>
      ) : error ? (
        <div className="bg-surface-raised rounded-card border border-[var(--state-critical-line)] p-4 text-[var(--state-critical)]">{error}</div>
      ) : (
        <div className="bg-surface-raised rounded-card border border-line">
          {tab === 'artists' ? (
            <div className="divide-y divide-line">
              {artists.length === 0 ? (
                <div className="text-center py-12 text-content-secondary">
                  <User className="w-12 h-12 mx-auto mb-4 text-content-secondary" />
                  <p>Aucun artiste</p>
                </div>
              ) : (
                artists.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-6 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center">
                      <User className="w-6 h-6 text-content-secondary" />
                    </div>
                    <div>
                      <div className="font-semibold text-content">{a.user?.name || a.name || 'Artist'}</div>
                      <div className="text-sm text-content-secondary">{a.discipline || 'Artist'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a 
                      href={`/artist/${a.id}`}
                      className="btn-ghost btn-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Examiner
                    </a>
                    <button 
                      onClick={() => suspendUser(a.userId || a.user?.id)} 
                      disabled={processing === (a.userId || a.user?.id)} 
                      className="btn-danger btn-sm"
                    >
                      <Ban className="w-4 h-4" />
                      Suspendre
                    </button>
                    <button 
                      onClick={() => activateUser(a.userId || a.user?.id)} 
                      disabled={processing === (a.userId || a.user?.id)} 
                      className="btn-outline btn-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('Réactiver')}
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-line">
              {hotels.length === 0 ? (
                <div className="empty-state">
                  <Building className="h-6 w-6 text-content-secondary" aria-hidden="true" />
                  <p className="empty-state__title">{t('Aucun hôtel')}</p>
                </div>
              ) : (
                hotels.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-6 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center">
                      <Building className="w-6 h-6 text-content-secondary" />
                    </div>
                    <div>
                      <div className="font-semibold text-content">{h.name}</div>
                      <div className="text-sm text-content-secondary">
                        {h.location || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a 
                      href={`/hotel/${h.id}`}
                      className="btn-ghost btn-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Examiner
                    </a>
                    <button 
                      onClick={() => suspendUser(h.userId || h.user?.id)} 
                      disabled={processing === (h.userId || h.user?.id)} 
                      className="btn-danger btn-sm"
                    >
                      <Ban className="w-4 h-4" />
                      Suspendre
                    </button>
                    <button 
                      onClick={() => activateUser(h.userId || h.user?.id)} 
                      disabled={processing === (h.userId || h.user?.id)} 
                      className="btn-outline btn-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('Réactiver')}
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminModeration


