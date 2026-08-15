import React from 'react'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08101D]">
      <SimpleNavbar />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">À propos de Travel Art</h1>
        <p className="text-white/60 mb-10">Réunir les artistes et les hôtels d’exception, partout dans le monde.</p>

        <section className="space-y-6 text-white/75">
          <h2 className="text-2xl font-serif font-semibold text-white">Notre mission</h2>
          <p>
            Travel Art fait le lien entre les artistes interprètes et les hôtels d’exception qui
            souhaitent enrichir l’expérience de leurs clients. Nous croyons que l’art et la culture
            doivent pouvoir se vivre partout, et que les artistes méritent des scènes à la hauteur
            de leur travail.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Ce que nous faisons</h2>
          <p>
            Nous mettons à disposition une plateforme où les hôtels découvrent, invitent et
            organisent les résidences d’artistes vérifiés. Nous prenons en charge l’ensemble du
            parcours : vérification des profils, gestion des disponibilités et confirmation des
            réservations.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Pour les artistes</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Créez un profil professionnel qui présente votre travail et vos disponibilités</li>
            <li>Entrez en relation avec des hôtels d’exception à la recherche d’artistes</li>
            <li>Gérez vos dates et votre calendrier depuis un tableau de bord clair</li>
            <li>Construisez votre réputation grâce aux avis vérifiés</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Pour les hôtels</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Parcourez une sélection d’artistes vérifiés</li>
            <li>Filtrez par discipline, par ville et par disponibilité</li>
            <li>Réservez vos dates avec un simple solde de crédits</li>
            <li>Offrez à vos clients une expérience culturelle singulière</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Nos valeurs</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Exigence :</strong> un niveau élevé attendu des artistes comme des hôtels</li>
            <li><strong>Clarté :</strong> des conditions et des échanges transparents à chaque étape</li>
            <li><strong>Accompagnement :</strong> un interlocuteur dédié des deux côtés</li>
            <li><strong>Amélioration continue :</strong> une plateforme qui évolue avec ses utilisateurs</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-white mt-8">Nous écrire</h2>
          <p>
            Une question, une remarque ? Écrivez-nous à{' '}
            <a className="text-gold hover:underline" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AboutPage














