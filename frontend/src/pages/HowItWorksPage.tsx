import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'

/**
 * Copy is the original page content, unchanged. Only the presentation moved:
 * six equal cards with white-on-gold circle icons (a contrast failure) became
 * a hairline ladder beside a sticky heading, which suits six items far better.
 */
const STEPS = [
  {
    title: 'Join as Artist or Hotel',
    lede: 'Create your profile and showcase your talent or luxury venue. Artists can upload their portfolio, set availability, and define their specialties. Hotels can list their performance spaces and accommodation.',
    points: [
      'Artists: Upload photos/videos of performances',
      'Hotels: Showcase rooftop terraces and intimate venues',
      'Set your availability calendar',
      'Define your artistic discipline and price range',
    ],
  },
  {
    title: 'Discover Perfect Matches',
    lede: 'Our intelligent matching system connects artists with hotels based on location, availability, artistic style, and venue requirements. Browse profiles and find your ideal collaboration.',
    points: [
      'Smart matching algorithm',
      'Filter by location, date, and style',
      'View detailed profiles and portfolios',
      'Read reviews and ratings',
    ],
  },
  {
    title: 'Book Your Experience',
    lede: 'Hotels use credits to book artists for their rooftop performances, intimate concerts, or special events. Artists receive accommodation and the opportunity to perform in luxury settings.',
    points: [
      'Hotels purchase credit packages',
      'Artists pay annual membership fee',
      'Secure booking system',
      'Flexible cancellation policies',
    ],
  },
  {
    title: 'Create Magic Together',
    lede: 'Artists perform in stunning rooftop venues, intimate lounges, and luxury hotel spaces. Hotels provide accommodation and unforgettable experiences for their guests.',
    points: [
      'Rooftop performances with city views',
      'Intimate acoustic sets in luxury lounges',
      'Jazz ensembles in elegant ballrooms',
      'DJ sets at sunset beach clubs',
    ],
  },
  {
    title: 'Rate & Review',
    lede: 'After each performance, hotels rate artists based on their performance quality, professionalism, and guest satisfaction. Artists see aggregated badges and feedback.',
    points: [
      'Hotels rate artists (1-5 stars)',
      'Artists see performance badges',
      'Detailed feedback system',
      'Build reputation over time',
    ],
  },
  {
    title: 'Earn & Grow',
    lede: 'Artists earn accommodation credits and build their portfolio. Hotels enhance their guest experience and create memorable moments. Both parties grow their network.',
    points: [
      'Artists: Free accommodation + performance fees',
      'Hotels: Enhanced guest experience',
      'Referral rewards program',
      'Loyalty points system',
    ],
  },
]

const HowItWorksPage: React.FC = () => {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-[#08101D]">
      <SimpleNavbar />

      {/* Asymmetric hero. The headline sits in the grid rather than centred
          over a darkened photograph, which is the default this page had. */}
      <section className="relative min-h-[78dvh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=2070&q=80&fit=crop"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#08101D] via-[#08101D]/70 to-[#08101D]/40"
          />
        </div>

        <div className="shell relative z-10 pb-20 pt-32 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 font-serif text-white text-5xl md:text-6xl lg:text-7xl leading-[1.03]"
          >
            How Travel Art
            <span className="block text-gold italic leading-[1.1] pb-1">Works</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 lg:col-start-9 text-white/65 leading-relaxed"
          >
            Connect luxury hotels with talented hearts for unforgettable rooftop
            performances and intimate experiences. From jazz saxophonists on Parisian
            terraces to DJs spinning sunset sets in Ibiza.
          </motion.p>
        </div>
      </section>

      {/* Sticky heading beside a scrolling ladder. */}
      <section className="section-y">
        <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 className="font-serif text-white text-3xl md:text-4xl leading-[1.1]">
                Why Choose Travel Art?
              </h2>
              <p className="mt-5 text-white/50 leading-relaxed max-w-[34ch]">
                Experience the perfect blend of luxury hospitality and artistic
                excellence.
              </p>
              <Link to="/register" className="btn-gold mt-10">
                Join now
              </Link>
            </div>
          </div>

          <ol className="lg:col-span-7 lg:col-start-6">
            {STEPS.map((step, i) => (
              <motion.li
                key={step.title}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`py-12 ${i === 0 ? 'pt-0' : 'border-t border-white/10'}`}
              >
                <h3 className="font-serif text-gold text-3xl md:text-4xl">{step.title}</h3>
                <p className="mt-4 text-white/80 text-lg leading-relaxed max-w-prose">
                  {step.lede}
                </p>
                <ul className="mt-6 space-y-3">
                  {step.points.map((point) => (
                    <li key={point} className="flex gap-4 text-white/55">
                      <span aria-hidden="true" className="mt-2.5 h-px w-5 shrink-0 bg-gold/60" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing band, matching the landing page so the two read as one site. */}
      <section className="shell">
        <div className="border-t border-white/10 py-24 md:py-32 text-center">
          <h2 className="font-serif text-white text-4xl md:text-6xl leading-[1.05]">
            Ready to Create Magic?
          </h2>
          <p className="mt-6 text-white/55 max-w-[52ch] mx-auto leading-relaxed">
            Join Travel Art today and start connecting luxury hotels with talented
            hearts for unforgettable experiences.
          </p>
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-gold">
              Join as Artist
            </Link>
            <Link
              to="/register"
              className="btn-base bg-transparent text-white border border-white/30 hover:bg-white hover:text-navy"
            >
              Join as Hotel
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HowItWorksPage
