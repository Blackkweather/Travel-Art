import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Building, ArrowRight } from 'lucide-react'
import { ArtistRegistrationFlow, HotelRegistrationFlow } from '@/components/registration'
import { getLogoUrl } from '@/config/assets'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'
import { t } from '@/i18n'

const RegisterPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'ARTIST' | 'HOTEL' | null>(null)
  const [hoveredRole, setHoveredRole] = useState<'ARTIST' | 'HOTEL' | null>(null)

  // If role is selected, show the appropriate registration flow with smooth transition
  if (selectedRole === 'ARTIST') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <ArtistRegistrationFlow />
      </motion.div>
    )
  }

  if (selectedRole === 'HOTEL') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <HotelRegistrationFlow />
      </motion.div>
    )
  }

  // Show role selection screen with enhanced UI
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SimpleNavbar />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-12 md:pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="inline-block mb-6"
            >
              <img decoding="async"
                src={getLogoUrl('transparent')}
                alt="Logo Travel Art"
                className="w-40 h-40 md:w-56 md:h-56 object-contain mx-auto"
              />
            </motion.div>
            {/* This carried three competing text colours at once: text-white,
                text-transparent, and a navy gradient clipped to the glyphs.
                Only one text-color utility can win, and it was text-white -
                so the page title rendered white on a white page and the
                heading was invisible. The gradient-clipped-to-text trick buys
                nothing over a solid navy heading here, so it is gone. */}
            <h1 className="mb-4">
              Rejoindre Travel Art
            </h1>
            <p className="text-lg md:text-xl text-content-secondary max-w-2xl mx-auto">
              {t('Choisissez votre rôle et commencez l’aventure')}
            </p>
          </motion.div>

          {/* Role Selection Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10"
          >
            {/* Artist Option */}
            <motion.button
              type="button"
              onHoverStart={() => setHoveredRole('ARTIST')}
              onHoverEnd={() => setHoveredRole(null)}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole('ARTIST')}
              className="group relative block w-full text-left overflow-hidden rounded-card border-2 border-line bg-[var(--surface-raised)] shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer"
            >
              {/* Gradient Overlay on Hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={false}
              />
              
              {/* Border Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-card border-2 border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={false}
              />

              <div className="relative p-10 md:p-12">
                <div className="text-center space-y-6">
                  <motion.div
                    animate={{
                      scale: hoveredRole === 'ARTIST' ? 1.1 : 1,
                      rotate: hoveredRole === 'ARTIST' ? 5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-24 h-24 rounded-control bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center mx-auto shadow-lg"
                  >
                    <User className="w-12 h-12 text-gold" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-3xl font-bold text-content mb-3 group-hover:text-gold transition-colors duration-300">
                      {t('Artiste')}
                    </h3>
                    <p className="text-lg text-content-secondary mb-4">{t('Jouer et créer')}</p>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      {t('Un formulaire en 3 étapes pour présenter votre profil, vos catégories et vos spécialités')}
                    </p>
                  </div>

                  {/* Arrow Icon */}
                  <motion.div
                    animate={{
                      x: hoveredRole === 'ARTIST' ? 5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-center justify-center gap-2 text-gold font-semibold mt-6"
                  >
                    <span>Commencer</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </div>
            </motion.button>

            {/* Hotel Option */}
            <motion.button
              type="button"
              onHoverStart={() => setHoveredRole('HOTEL')}
              onHoverEnd={() => setHoveredRole(null)}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole('HOTEL')}
              className="group relative block w-full text-left overflow-hidden rounded-card border-2 border-line bg-[var(--surface-raised)] shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer"
            >
              {/* Gradient Overlay on Hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={false}
              />
              
              {/* Border Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-card border-2 border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={false}
              />

              <div className="relative p-10 md:p-12">
                <div className="text-center space-y-6">
                  <motion.div
                    animate={{
                      scale: hoveredRole === 'HOTEL' ? 1.1 : 1,
                      rotate: hoveredRole === 'HOTEL' ? -5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-24 h-24 rounded-control bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center mx-auto shadow-lg"
                  >
                    <Building className="w-12 h-12 text-gold" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-3xl font-bold text-content mb-3 group-hover:text-gold transition-colors duration-300">
                      {t('Hôtel')}
                    </h3>
                    <p className="text-lg text-content-secondary mb-4">{t('Accueillir et programmer')}</p>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      {t('Un formulaire en 7 étapes couvrant l’ambiance, l’équipement, les conditions de collaboration et la logistique')}
                    </p>
                  </div>

                  {/* Arrow Icon */}
                  <motion.div
                    animate={{
                      x: hoveredRole === 'HOTEL' ? 5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-center justify-center gap-2 text-gold font-semibold mt-6"
                  >
                    <span>Commencer</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-sm text-content-secondary">
              Déjà un compte ?{' '}
              <a href="/login" className="text-gold font-semibold hover:underline transition-colors">
                Se connecter
              </a>
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default RegisterPage


