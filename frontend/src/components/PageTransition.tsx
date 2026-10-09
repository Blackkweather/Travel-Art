import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.99
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

const PageTransition: React.FC<PageTransitionProps> = React.memo(({ children }) => {
  const location = useLocation()

  // React Router's client-side navigation never touches scroll position - the
  // browser only resets it on a full document load. Without this, following a
  // footer or navbar link from partway down a long page lands you at the same
  // offset on the next one, which reads as "the click did nothing" the moment
  // that next page is shorter than the scroll you carried into it.
  useEffect(() => {
    // html has global scroll-behavior: smooth, which would otherwise turn
    // this into a second-long animated scroll racing the page's own fade in.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
})

PageTransition.displayName = 'PageTransition'

export default PageTransition

