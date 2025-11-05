import React, { useEffect, useState } from 'react'
import { artistsApi, hotelsApi, adminApi } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { CheckCircle, XCircle, User, Building } from 'lucide-react'

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
        artistsApi.getAll({ limit: 10 }),
        hotelsApi.getAll({ limit: 10 })
      ])
      setArtists(((aRes.data as any)?.data ?? []) as ArtistListItem[])
      setHotels(((hRes.data as any)?.data ?? []) as HotelListItem[])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load content')
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
    } catch (e) {
      alert('Failed to suspend user')
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
    } catch (e) {
      alert('Failed to activate user')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy mb-2 gold-underline">Content Moderation</h1>
          <p className="text-gray-600">Review artists and hotels; suspend or re-activate accounts.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setTab('artists')} className={`btn-secondary ${tab==='artists' ? 'bg-navy text-white' : ''}`}>Artists</button>
          <button onClick={() => setTab('hotels')} className={`btn-secondary ${tab==='hotels' ? 'bg-navy text-white' : ''}`}>Hotels</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]"><LoadingSpinner /></div>
      ) : error ? (
        <div className="card-luxury text-red-700 bg-red-50">{error}</div>
      ) : (
        <div className="card-luxury">
          {tab === 'artists' ? (
            <div className="space-y-3">
              {artists.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center"><User className="w-5 h-5 text-gold" /></div>
                    <div>
                      <div className="font-medium text-navy">{a.user?.name || a.name || 'Artist'}</div>
                      <div className="text-sm text-gray-600">{a.discipline}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a className="btn-secondary" href={`/artist/${a.id}`}>Review</a>
                    <button onClick={() => suspendUser(a.userId || a.user?.id)} disabled={processing === (a.userId || a.user?.id)} className="text-red-600 hover:text-red-800">Suspend</button>
                    <button onClick={() => activateUser(a.userId || a.user?.id)} disabled={processing === (a.userId || a.user?.id)} className="text-green-600 hover:text-green-800">Activate</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {hotels.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center"><Building className="w-5 h-5 text-gold" /></div>
                    <div>
                      <div className="font-medium text-navy">{h.name}</div>
                      <div className="text-sm text-gray-600">{h.location || ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a className="btn-secondary" href={`/hotel/${h.id}`}>Review</a>
                    <button onClick={() => suspendUser(h.userId || h.user?.id)} disabled={processing === (h.userId || h.user?.id)} className="text-red-600 hover:text-red-800">Suspend</button>
                    <button onClick={() => activateUser(h.userId || h.user?.id)} disabled={processing === (h.userId || h.user?.id)} className="text-green-600 hover:text-green-800">Activate</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminModeration


