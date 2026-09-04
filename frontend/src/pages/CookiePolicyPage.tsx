import React from 'react'
import LegalLayout from '@/components/LegalLayout'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

const CookiePolicyPage: React.FC = () => {
  return (
    <LegalLayout
      eyebrow="Cookies"
      title={t('Politique relative aux cookies')}
      lede={t('Comment nous utilisons les cookies et les technologies similaires.')}
    >
      <SEOHead
        title={t('Politique relative aux cookies — Travel Art')}
        description={t('Les cookies et technologies similaires utilisés par Travel Art, et comment régler vos préférences.')}
      />
        <h2>{t('Que sont les cookies ?')}</h2>
        <p>
          {t('Les cookies sont de petits fichiers texte enregistrés sur votre appareil. Ils permettent au site de fonctionner et nous aident à en mesurer l’usage et à le personnaliser.')}
        </p>

        <h2>{t('Comment nous les utilisons')}</h2>
        <ul>
          <li>{t('Cookies indispensables à l’authentification et au fonctionnement du site.')}</li>
          <li>{t('Cookies de mesure d’audience, pour comprendre l’usage et améliorer nos services.')}</li>
          <li>{t('Cookies de préférences, pour mémoriser vos réglages.')}</li>
        </ul>

        <h2>{t('Gérer les cookies')}</h2>
        <p>
          {t('Vous pouvez gérer les cookies depuis les réglages de votre navigateur. Désactiver certains d’entre eux peut altérer le fonctionnement du site.')}
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question sur cette politique, écrivez à <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
        </p>
    </LegalLayout>
  )
}

export default CookiePolicyPage
