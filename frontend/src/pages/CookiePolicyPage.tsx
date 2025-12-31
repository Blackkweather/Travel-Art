import React from 'react'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream">
      <SimpleNavbar />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-6">Cookie Policy</h1>
        <p className="text-gray-600 mb-10">This page explains how we use cookies and similar technologies.</p>

        <section className="space-y-6 text-gray-700">
          <h2 className="text-2xl font-serif font-semibold text-navy">What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device to help websites work and to provide
            analytics and personalization.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy">How We Use Cookies</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Essential cookies for authentication and core functionality.</li>
            <li>Analytics cookies to understand usage and improve our services.</li>
            <li>Preference cookies to remember settings such as language.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy">Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings. Disabling some cookies may impact
            site functionality.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy">Contact</h2>
          <p>
            For questions about this policy, email <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default CookiePolicyPage





















