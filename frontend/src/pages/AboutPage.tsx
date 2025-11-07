import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-6">About Travel Art</h1>
        <p className="text-gray-600 mb-10">Connecting talented artists with luxury hotels worldwide.</p>

        <section className="space-y-6 text-gray-700">
          <h2 className="text-2xl font-serif font-semibold text-navy">Our Mission</h2>
          <p>
            Travel Art is a platform that bridges the gap between talented performing artists and luxury hotels 
            seeking to enhance their guest experiences. We believe that art and culture should be accessible 
            everywhere, and that artists deserve opportunities to showcase their talents in unique settings around 
            the world.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">What We Do</h2>
          <p>
            We provide a seamless booking platform where hotels can discover, book, and manage performances 
            by verified artists. Our platform handles everything from artist verification and availability 
            management to secure payment processing and booking confirmations.
          </p>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">For Artists</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create a professional profile showcasing your talent and availability</li>
            <li>Connect with luxury hotels seeking performers</li>
            <li>Manage bookings and availability through an intuitive dashboard</li>
            <li>Build your reputation through verified reviews and ratings</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">For Hotels</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Browse a curated selection of verified performing artists</li>
            <li>Filter by discipline, location, and availability</li>
            <li>Book performances with a simple credit-based system</li>
            <li>Enhance your guest experience with world-class entertainment</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">Our Values</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Excellence:</strong> We maintain high standards for both artists and hotels</li>
            <li><strong>Transparency:</strong> Clear pricing, terms, and communication throughout</li>
            <li><strong>Support:</strong> Dedicated support for both artists and hotels</li>
            <li><strong>Innovation:</strong> Continuously improving our platform based on user feedback</li>
          </ul>

          <h2 className="text-2xl font-serif font-semibold text-navy mt-8">Contact Us</h2>
          <p>
            Have questions or feedback? We'd love to hear from you. Reach out to us at{' '}
            <a className="text-gold hover:underline" href="mailto:hello@travelart.com">hello@travelart.com</a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AboutPage




