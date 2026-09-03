import React from 'react'
import LegalLayout from '@/components/LegalLayout'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalLayout
      eyebrow={t('Confidentialité')}
      title={t('Politique de confidentialité')}
      lede={`Dernière mise à jour : ${new Date().getFullYear()}`}
    >
      <SEOHead
        title={t('Politique de confidentialité — Travel Art')}
        description={t('Quelles données Travel Art collecte, pourquoi, combien de temps elles sont conservées et comment exercer vos droits.')}
      />
        <p>
          {t('Nous prenons votre vie privée au sérieux. Cette politique décrit les données personnelles que nous collectons, l’usage que nous en faisons et les choix dont vous disposez. En utilisant notre site et nos services, vous acceptez cette politique.')}
        </p>

        <h2>{t('Les données que nous collectons')}</h2>
        <ul>
          <li>{t('Les informations de compte : nom, adresse e-mail, rôle (artiste ou hôtel) et contenu du profil.')}</li>
          <li>{t('Les données d’usage : pages consultées, actions effectuées, appareil et navigateur utilisés.')}</li>
          <li>{t('Les données de réservation et de paiement traitées par nos prestataires.')}</li>
        </ul>

        <h2>{t('L’usage que nous en faisons')}</h2>
        <ul>
          <li>{t('Fournir, maintenir et améliorer la plateforme.')}</li>
          <li>{t('Faciliter la mise en relation entre artistes et hôtels, les échanges et les réservations.')}</li>
          <li>{t('Prévenir la fraude, les abus et les incidents de sécurité.')}</li>
          <li>{t('Vous adresser les communications liées au service. Vous pouvez vous désabonner des e-mails non essentiels.')}</li>
        </ul>

        <h2>{t('Partage des données')}</h2>
        <p>
          {t('Nous ne vendons aucune donnée personnelle. Nous transmettons un minimum d’informations à nos prestataires, uniquement pour faire fonctionner la plateforme (hébergement, mesure d’audience, paiements). Lorsque la loi l’exige, nous pouvons communiquer des informations aux autorités.')}
        </p>

        <h2>{t('Vos choix')}</h2>
        <ul>
          <li>{t('Consulter, modifier ou supprimer les informations de votre profil depuis votre compte.')}</li>
          <li>{t('Gérer vos préférences d’e-mails via les liens de désabonnement.')}</li>
          <li>{t('Régler la gestion des cookies et du stockage local depuis votre navigateur.')}</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Pour toute question ou demande relative à vos données, écrivez-nous à <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
        </p>
    </LegalLayout>
  )
}

export default PrivacyPolicyPage
