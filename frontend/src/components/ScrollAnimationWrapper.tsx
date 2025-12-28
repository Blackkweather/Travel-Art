import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

interface ScrollAnimationWrapperProps {
  children: React.ReactNode
  animation?: 'fade-up' | 'fade-in' | 'scale' | 'slide-left' | 'slide-right' | 'parallax'
  delay?: number
  className?: string
}

const ScrollAnimationWrapper: React.FC<ScrollAnimationWrapperProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const animations = {
    'fade-up': {
      initial: { opacity: 0, y: 60 },
      animate: { opacity: 1, y: 0 }
    },
    'fade-in': {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    'scale': {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 }
    },
    'slide-left': {
      initial: { opacity: 0, x: -60 },
      animate: { opacity: 1, x: 0 }
    },
    'slide-right': {
      initial: { opacity: 0, x: 60 },
      animate: { opacity: 1, x: 0 }
    },
    'parallax': {
      initial: { opacity: 0, y: 0 },
      animate: { opacity: 1, y: 0 }
    }
  }

  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -50])

  if (animation === 'parallax') {
    return (
      <motion.div
        ref={ref}
        style={{ y: parallaxY }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={animations[animation].initial}
      animate={isInView ? animations[animation].animate : animations[animation].initial}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default ScrollAnimationWrapper

