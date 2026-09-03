import { Link, useLocation } from 'react-router-dom'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'
import SEOHead from '@/components/SEOHead'
import { t } from '@/i18n'

/**
 * The page for a URL that does not exist.
 *
 * The router used to answer every unknown path with <Navigate to="/" />, so a
 * typo, a stale bookmark or a link to an experience that has since come down
 * dropped the visitor on the home page with no explanation - they were left
 * wondering whether they had mis-clicked or the site was broken. A crawler got
 * a redirect where it expected a 404, which is why dead URLs kept their place
 * in the index.
 *
 * It says what happened, shows the path that failed so the person can see the
 * typo, and offers the three places they were most likely heading.
 */
export default function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SEOHead
        title={t('Page introuvable — Travel Art')}
        description={t('Cette adresse ne correspond à aucune page.')}
      />
      <SimpleNavbar />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-xl">
          <span className="eyebrow">{t('Erreur 404')}</span>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl text-content">
            {t('Cette page n’existe pas')}
          </h1>
          <p className="mt-4 text-content-secondary leading-relaxed">
            {t('L’adresse demandée est peut-être erronée, ou la page a été retirée.')}
          </p>

          <p className="mt-4 text-sm text-content-secondary">
            <code className="px-2 py-1 rounded bg-surface-sunken border border-line break-all">
              {pathname}
            </code>
          </p>

          <span className="rule-reveal mt-8 block" />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="btn-gold btn-sm">
              {t('Retour à l’accueil')}
            </Link>
            <Link to="/experiences" className="btn-outline btn-sm">
              {t('Voir les expériences')}
            </Link>
            <Link to="/top-artists" className="btn-outline btn-sm">
              {t('Voir les artistes')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
