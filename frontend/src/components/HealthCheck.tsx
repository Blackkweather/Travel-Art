import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface HealthStatus {
  backend: 'connected' | 'disconnected' | 'checking'
  database: 'connected' | 'disconnected' | 'unknown'
  message: string
}

export const HealthCheck: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [status, setStatus] = useState<HealthStatus>({
    backend: 'checking',
    database: 'unknown',
    message: 'Checking backend connection...'
  })

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        const data = await response.json()
        
        console.log('[Health Check]', data)
        
        setStatus({
          backend: response.ok ? 'connected' : 'disconnected',
          database: data.database === 'connected' ? 'connected' : 'disconnected',
          message: response.ok 
            ? 'Backend connected successfully' 
            : `Backend error: ${response.statusText}`
        })
      } catch (error) {
        console.error('[Health Check Error]', error)
        setStatus({
          backend: 'disconnected',
          database: 'unknown',
          message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (status.backend === 'checking') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Loader className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-gray-600">{status.message}</span>
      </div>
    )
  }

  const isHealthy = status.backend === 'connected' && status.database === 'connected'

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isHealthy ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600">System healthy</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-600">{status.message}</span>
        </>
      )}
    </div>
  )
}

export default HealthCheck
