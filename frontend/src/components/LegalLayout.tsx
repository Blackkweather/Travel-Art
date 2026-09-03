import React from 'react'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

/**
 * The shared frame for the three policy documents.
 *
 * Terms, Privacy and Cookies each carried their own copy of the same shell -
 * the same navbar, the same `container mx-auto px-6 pt-28 pb-20 max-w-4xl`, the
 * same h1 classes, the same footer - so a change to any of it had to be made
 * three times and, in practice, was not: the three had already drifted apart on
 * their heading treatment.
 *
 * The measure is the substantive change. `max-w-4xl` is 896px, which at the
 * body size these pages use runs to well over 100 characters a line - about
 * twice the width at which a reader reliably finds the start of the next line.
 * `max-w-prose` holds it to 65ch. A legal document is the page on this site
 * most likely to actually be read start to finish, so it is the page where the
 * measure matters most.
 */

interface LegalLayoutProps {
  eyebrow: string
  title: string
  lede: string
  children: React.ReactNode
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ eyebrow, title, lede, children }) => {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SimpleNavbar />

      <main className="shell pb-24 pt-32 md:pt-40">
        <header className="max-w-prose">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-6 font-serif text-[2.25rem] leading-tight text-content md:text-[3rem]">
            {title}
          </h1>
          <p className="mt-4 text-content-secondary">{lede}</p>
          <span className="rule-reveal mt-10" />
        </header>

        <div className="legal-prose">{children}</div>
      </main>

      <Footer />
    </div>
  )
}

export default LegalLayout
