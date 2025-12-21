import React from 'react'
import { ArtistRegistrationFlow, HotelRegistrationFlow } from '@/components/registration'
import { useSearchParams } from 'react-router-dom'

const RegisterPage: React.FC = () => {
  const [params] = useSearchParams()
  const roleParam = (params.get('role') || '').toUpperCase()
  const isHotel = roleParam === 'HOTEL'
  return isHotel ? <HotelRegistrationFlow /> : <ArtistRegistrationFlow />
}

export default RegisterPage
