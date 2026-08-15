import React from 'react'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08101D]">
      <SimpleNavbar />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Politique de confidentialité</h1>
        <p className="text-white/60 mb-10">Last updated: {new Date().getFullYear()}</p>

        <section className="space-y-6 text-white/75">
          <p>
            Nous prenons votre vie privée au sérieux. Cette politique décrit les données personnelles que nous collectons, l’usage que nous en faisons et les choix dont vous disposez. En utilisant notre site et nos services, vous acceptez cette politique.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Les données que nous collectons</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Les informations de compte : nom, adresse e-mail, rôle (artiste ou hôtel) et contenu du profil.</li>
            <li>Les données d’usage : pages consultées, actions effectuées, appareil et navigateur utilisés.</li>
            <li>Les données de réservation et de paiement traitées par nos prestataires.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">L’usage que nous en faisons</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fournir, maintenir et améliorer la plateforme.</li>
            <li>Faciliter la mise en relation entre artistes et hôtels, les échanges et les réservations.</li>
            <li>Prévenir la fraude, les abus et les incidents de sécurité.</li>
            <li>Vous adresser les communications liées au service. Vous pouvez vous désabonner des e-mails non essentiels.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Partage des données</h2>
          <p>
            Nous ne vendons aucune donnée personnelle. Nous transmettons un minimum d’informations à nos prestataires, uniquement pour faire fonctionner la plateforme (hébergement, mesure d’audience, paiements). Lorsque la loi l’exige, nous pouvons communiquer des informations aux autorités.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Vos choix</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Consulter, modifier ou supprimer les informations de votre profil depuis votre compte.</li>
            <li>Gérer vos préférences d’e-mails via les liens de désabonnement.</li>
            <li>Régler la gestion des cookies et du stockage local depuis votre navigateur.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Contact</h2>
          <p>
            Pour toute question ou demande relative à vos données, écrivez-nous à <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicyPage





















