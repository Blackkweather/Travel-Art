import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-10">Last updated: {new Date().getFullYear()}</p>

        <section className="space-y-6 text-gray-700">
          <p>
            We value your privacy. This policy explains what personal information we collect, how we
            use it, and the choices you have. By using our website and services, you agree to this policy.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account details such as name, email, role (artist or hotel), and profile content.</li>
            <li>Usage data including pages visited, actions taken, and device/browser information.</li>
            <li>Booking and payment-related metadata handled by our payment partners.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve the platform experience.</li>
            <li>Facilitate artist–hotel discovery, communications, and bookings.</li>
            <li>Protect against fraud, abuse, and security incidents.</li>
            <li>Send service-related communications. You can opt out of non-essential emails.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">Sharing</h2>
          <p>
            We do not sell personal data. We share limited data with service providers strictly to
            operate the platform (hosting, analytics, payments). When legally required, we may share
            information with authorities.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">Your Choices</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, update, or delete your profile information from your account.</li>
            <li>Control marketing email preferences via unsubscribe links.</li>
            <li>Browser settings allow you to manage cookies and local storage.</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">Contact</h2>
          <p>
            For privacy questions or requests, contact us at <a className="text-gold" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicyPage

















