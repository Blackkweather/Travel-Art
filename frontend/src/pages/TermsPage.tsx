import React from 'react'
import SimpleNavbar from '@/components/SimpleNavbar'
import Footer from '@/components/Footer'

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream">
      <SimpleNavbar />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-10">Please read these terms carefully before using Travel Art.</p>

        <section className="space-y-6 text-gray-700">
          <h2 className="text-2xl font-serif font-semibold text-navy">1. Agreement</h2>
          <p>
            By accessing or using the site, you agree to be bound by these Terms. If you do not agree,
            do not use the platform.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy">2. Accounts</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining account security and accurate information.</li>
            <li>We may suspend or terminate accounts for policy violations or misuse.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy">3. Bookings & Payments</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Hotels purchase credits and artists may pay membership fees.</li>
            <li>Payments are processed by third-party providers under their terms.</li>
            <li>Cancellations and refunds follow the policies shown at booking time.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy">4. Acceptable Use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>No unlawful, harmful, or abusive activities.</li>
            <li>Respect intellectual property and privacy of others.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy">5. Liability</h2>
          <p>
            The service is provided “as is” without warranties. To the maximum extent permitted by law,
            we are not liable for indirect, incidental, or consequential damages.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy">6. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use constitutes acceptance of the
            revised Terms.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy">7. Contact</h2>
          <p>
            Questions about these Terms? Contact <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default TermsPage





















