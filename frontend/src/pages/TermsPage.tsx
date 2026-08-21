import React from 'react'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SimpleNavbar />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-content mb-6">Conditions générales d’utilisation</h1>
        <p className="text-content-secondary mb-10">Merci de lire attentivement ces conditions avant d’utiliser Travel Art.</p>

        <section className="space-y-6 text-content-secondary">
          <h2 className="text-2xl font-serif font-semibold text-content">1. Acceptation</h2>
          <p>
            En accédant au site ou en l’utilisant, vous acceptez d’être lié par les présentes conditions. Si vous ne les acceptez pas, n’utilisez pas la plateforme.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-content">2. Comptes</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Vous êtes responsable de la sécurité de votre compte et de l’exactitude des informations que vous y renseignez.</li>
            <li>Nous pouvons suspendre ou fermer un compte en cas de manquement à ces conditions ou d’usage abusif.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-content">3. Réservations et paiements</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Les hôtels acquièrent des crédits et les artistes peuvent souscrire une adhésion.</li>
            <li>Les paiements sont traités par des prestataires tiers, selon leurs propres conditions.</li>
            <li>Les annulations et remboursements suivent les conditions affichées au moment de la réservation.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-content">4. Usage acceptable</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Aucune activité illicite, nuisible ou abusive.</li>
            <li>Respect de la propriété intellectuelle et de la vie privée d’autrui.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-content">5. Responsabilité</h2>
          <p>
            Le service est fourni « en l’état », sans garantie. Dans la limite permise par la loi, nous ne saurions être tenus responsables des dommages indirects ou accessoires.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-content">6. Modifications</h2>
          <p>
            Nous pouvons faire évoluer ces conditions. La poursuite de l’utilisation du service vaut acceptation de la version modifiée.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-content">7. Contact</h2>
          <p>
            Une question sur ces conditions ? Écrivez à <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default TermsPage





















