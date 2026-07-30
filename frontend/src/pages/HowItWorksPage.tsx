import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SimpleNavbar from '../components/SimpleNavbar'
import Footer from '../components/Footer'

/**
 * Steps are titled by the action they describe rather than numbered "Stage 1 /
 * Stage 2", and they are set as a hairline-separated ladder beside a sticky
 * heading. Six items is too many for equal cards, which is what this page used
 * to render.
 */
const STEPS = [
  {
    title: 'Join',
    lede: 'Artists build a profile around their work. Hotels describe the rooms and spaces they can offer.',
    points: [
      'Upload performance footage and images',
      'List rooftop terraces and intimate venues',
      'Set the dates you are available',
    ],
  },
  {
    title: 'Match',
    lede: 'Matching runs on location, dates, discipline and what a venue can actually host.',
    points: [
      'Filter by city, date and discipline',
      'Read full profiles and past residencies',
      'See ratings left by previous hosts',
    ],
  },
  {
    title: 'Book',
    lede: 'Hotels spend credits to confirm a residency. Artists pay one annual membership and nothing per booking.',
    points: [
      'Credit packages, bought once and drawn down',
      'No commission taken on the artist side',
      'Cancellation terms agreed up front',
    ],
  },
  {
    title: 'Perform',
    lede: 'The residency happens: a rooftop set, an acoustic evening in a lounge, an installation in a lobby.',
    points: [
      'Rooftop performances with a view worth the trip',
      'Acoustic sets in rooms built for listening',
      'Work made on site, for the site',
    ],
  },
  {
    title: 'Review',
    lede: 'Hosts rate the residency afterwards, and that record follows the artist.',
    points: [
      'Hotels rate performance and professionalism',
      'Artists carry their record between venues',
      'Written feedback stays private',
    ],
  },
  {
    title: 'Grow',
    lede: 'Artists build a body of work and a reputation. Hotels build a programme guests remember.',
    points: [
      'Accommodation and fees, not exposure',
      'Referral rewards for bringing others in',
      'Loyalty credit that carries forward',
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
            How a residency
            <span className="block text-gold italic leading-[1.1] pb-1">comes together.</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 lg:col-start-9 text-white/65 leading-relaxed"
          >
            Six steps, from a profile to a performance on a terrace in Paris or a
            sunset set in Ibiza.
          </motion.p>
        </div>
      </section>

      {/* Sticky heading beside a scrolling ladder. */}
      <section className="section-y">
        <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 className="font-serif text-white text-3xl md:text-4xl leading-[1.1]">
                The whole arrangement, in order.
              </h2>
              <p className="mt-5 text-white/50 leading-relaxed max-w-[34ch]">
                Nothing here happens by email. Every step is settled on the
                platform.
              </p>
              <Link to="/register" className="btn-gold mt-10">
                Start now
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
            Two ways in.
          </h2>
          <p className="mt-6 text-white/55 max-w-[44ch] mx-auto leading-relaxed">
            Apply as an artist, or open your hotel to the programme.
          </p>
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-gold">
              Join as artist
            </Link>
            <Link
              to="/register"
              className="btn-base bg-transparent text-white border border-white/30 hover:bg-white hover:text-navy"
            >
              Join as hotel
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HowItWorksPage
