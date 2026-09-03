import React from 'react'
import LegalLayout from '@/components/LegalLayout'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      eyebrow="Conditions"
      title={t('Conditions générales d’utilisation')}
      lede={t('Merci de lire attentivement ces conditions avant d’utiliser Travel Art.')}
    >
      <SEOHead
        title={t('Conditions générales d’utilisation — Travel Art')}
        description={t('Les conditions qui régissent l’utilisation de la plateforme Travel Art par les artistes et les établissements.')}
      />
        <h2>1. Acceptation</h2>
        <p>
          {t('En accédant au site ou en l’utilisant, vous acceptez d’être lié par les présentes conditions. Si vous ne les acceptez pas, n’utilisez pas la plateforme.')}
        </p>

        <h2>2. Comptes</h2>
        <ul>
          <li>{t('Vous êtes responsable de la sécurité de votre compte et de l’exactitude des informations que vous y renseignez.')}</li>
          <li>{t('Nous pouvons suspendre ou fermer un compte en cas de manquement à ces conditions ou d’usage abusif.')}</li>
        </ul>

        <h2>{t('3. Réservations et paiements')}</h2>
        <ul>
          <li>{t('Les hôtels acquièrent des crédits et les artistes peuvent souscrire une adhésion.')}</li>
          <li>{t('Les paiements sont traités par des prestataires tiers, selon leurs propres conditions.')}</li>
          <li>{t('Les annulations et remboursements suivent les conditions affichées au moment de la réservation.')}</li>
        </ul>

        <h2>4. Usage acceptable</h2>
        <ul>
          <li>{t('Aucune activité illicite, nuisible ou abusive.')}</li>
          <li>{t('Respect de la propriété intellectuelle et de la vie privée d’autrui.')}</li>
        </ul>

        <h2>{t('5. Responsabilité')}</h2>
        <p>
          {t('Le service est fourni « en l’état », sans garantie. Dans la limite permise par la loi, nous ne saurions être tenus responsables des dommages indirects ou accessoires.')}
        </p>

        <h2>6. Modifications</h2>
        <p>
          {t('Nous pouvons faire évoluer ces conditions. La poursuite de l’utilisation du service vaut acceptation de la version modifiée.')}
        </p>

        <h2>7. Contact</h2>
        <p>
          Une question sur ces conditions ? Écrivez à <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
        </p>
    </LegalLayout>
  )
}

export default TermsPage
