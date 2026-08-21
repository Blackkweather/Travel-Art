import React from 'react'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SimpleNavbar />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-content mb-6">Politique relative aux cookies</h1>
        <p className="text-content-secondary mb-10">Cette page explique comment nous utilisons les cookies et les technologies similaires.</p>

        <section className="space-y-6 text-content-secondary">
          <h2 className="text-2xl font-serif font-semibold text-content">Que sont les cookies ?</h2>
          <p>
            Les cookies sont de petits fichiers texte enregistrés sur votre appareil. Ils permettent au site de fonctionner et nous aident à en mesurer l’usage et à le personnaliser.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-content">Comment nous les utilisons</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cookies indispensables à l’authentification et au fonctionnement du site.</li>
            <li>Cookies de mesure d’audience, pour comprendre l’usage et améliorer nos services.</li>
            <li>Cookies de préférences, pour mémoriser vos réglages.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-content">Gérer les cookies</h2>
          <p>
            Vous pouvez gérer les cookies depuis les réglages de votre navigateur. Désactiver certains d’entre eux peut altérer le fonctionnement du site.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-content">Contact</h2>
          <p>
            Pour toute question sur cette politique, écrivez à <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default CookiePolicyPage





















