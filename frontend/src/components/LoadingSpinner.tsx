import React from 'react'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="compass-loader"></div>
      <p className="text-navy font-medium">Loading...</p>
    </div>
  )
}

export default LoadingSpinner




