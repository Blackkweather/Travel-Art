import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ArtistRegistrationFlow, HotelRegistrationFlow } from '@/components/registration'
import { profileAccount } from '@/components/GoogleSignIn'

/**
 * Where an account opened with Google lands until its profile is in. It is the
 * registration form, minus the address and password. Until it is sent the
 * account is invisible and cannot be booked; once sent, an administrator
 * reviews it like any other application.
 */
const CompleteProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user)

  if (!user) return <Navigate to="/login" replace />
  if (user.approvalStatus !== 'INCOMPLETE') return <Navigate to="/dashboard" replace />

  const account = profileAccount(user)
  return user.role === 'HOTEL' ? <HotelRegistrationFlow account={account} /> : <ArtistRegistrationFlow account={account} />
}

export default CompleteProfilePage
