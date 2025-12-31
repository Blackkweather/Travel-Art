import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface AmbientAudioProps {
  src: string
  initialVolume?: number
  maxScrollForFade?: number
}

export default function AmbientAudio({ 
  src, 
  initialVolume = 0.2, 
  maxScrollForFade = 1000 
}: AmbientAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const volumeRef = useRef(initialVolume)

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  useEffect(() => {
    if (prefersReducedMotion) return

    // Ensure src starts with / for public folder files in Vite
    const normalizedSrc = src.startsWith('/') ? src : `/${src}`
    const audio = new Audio(normalizedSrc)
    audio.loop = true
    audio.volume = initialVolume
    
    // Handle audio load errors with detailed logging
    audio.addEventListener('error', (e) => {
      const error = audio.error
      console.error('Audio load error:', {
        code: error?.code,
        message: error?.message,
        src: normalizedSrc,
        fullSrc: audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState
      })
      
      // Try to fetch the file to see if it exists
      fetch(normalizedSrc, { method: 'HEAD' })
        .then(res => {
          console.log('File fetch test:', {
            exists: res.ok,
            status: res.status,
            contentType: res.headers.get('content-type')
          })
        })
        .catch(err => {
          console.error('File fetch failed:', err)
        })
    })
    
    audio.addEventListener('loadeddata', () => {
      console.log('✅ Audio loaded successfully:', normalizedSrc)
    })
    
    audio.addEventListener('canplay', () => {
      console.log('✅ Audio can play:', normalizedSrc)
    })
    
    audioRef.current = audio
    volumeRef.current = initialVolume

    // Start audio on first user interaction (autoplay compliance)
    const startAudio = () => {
      if (!hasStarted && audioRef.current) {
        // Check if audio source exists
        if (!audioRef.current.src || audioRef.current.src === window.location.href) {
          console.error('Audio source is invalid:', audioRef.current.src)
          return
        }
        
        console.log('Attempting to play audio:', audioRef.current.src)
        console.log('Audio state before play:', {
          volume: audioRef.current.volume,
          muted: audioRef.current.muted,
          readyState: audioRef.current.readyState
        })
        
        // Ensure audio is not muted and volume is set
        audioRef.current.muted = false
        audioRef.current.volume = initialVolume
        
        audioRef.current.play()
          .then(() => {
            console.log('✅ Audio playing successfully!')
            console.log('Audio state after play:', {
              volume: audioRef.current?.volume,
              muted: audioRef.current?.muted,
              paused: audioRef.current?.paused,
              currentTime: audioRef.current?.currentTime
            })
            setHasStarted(true)
            setIsPlaying(true)
          })
          .catch((e) => {
            console.error('❌ Audio play failed:', {
              error: e,
              name: e.name,
              message: e.message,
              src: audioRef.current?.src
            })
          })
      }
    }

    // Listen for user interaction
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, startAudio, { once: true })
    })

    // Setup GSAP scroll-based volume fade
    const scrollTrigger = ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: `${maxScrollForFade}px top`,
      scrub: 1, // Smooth volume change synced with scroll
      onUpdate: (self) => {
        if (audioRef.current && !isMuted) {
          const newVolume = initialVolume * (1 - self.progress)
          volumeRef.current = newVolume
          audioRef.current.volume = Math.max(newVolume, 0)
          // Log volume changes for debugging
          if (self.progress % 0.2 < 0.1) {
            console.log('Volume:', Math.round(newVolume * 100) + '%', 'Scroll progress:', Math.round(self.progress * 100) + '%')
          }
        }
      }
    })
    
    // Add playing event listener to confirm audio is actually playing
    audio.addEventListener('playing', () => {
      console.log('🎵 Audio is PLAYING!', {
        volume: audio.volume,
        muted: audio.muted,
        currentTime: audio.currentTime
      })
    })
    
    // Add timeupdate to confirm audio is progressing
    audio.addEventListener('timeupdate', () => {
      if (audio.currentTime > 0 && audio.currentTime < 1) {
        console.log('🎵 Audio time progressing:', audio.currentTime.toFixed(2) + 's')
      }
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, startAudio)
      })
      scrollTrigger.kill()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src, initialVolume, maxScrollForFade, hasStarted, isMuted, prefersReducedMotion])

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted
      audioRef.current.muted = newMutedState
      setIsMuted(newMutedState)
      
      // If audio hasn't started, try to start it when user clicks mute button
      if (!hasStarted && !newMutedState) {
        audioRef.current.play()
          .then(() => {
            console.log('✅ Audio started from mute button')
            setHasStarted(true)
            setIsPlaying(true)
          })
          .catch((e) => {
            console.error('❌ Audio failed to start from mute button:', e)
          })
      }
    }
  }

  // Don't render if user prefers reduced motion
  if (prefersReducedMotion) return null

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-300 flex items-center justify-center group"
      aria-label={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      title={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
    >
      {isMuted ? (
        <svg 
          className="w-6 h-6 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" 
          />
        </svg>
      ) : (
        <svg 
          className="w-6 h-6 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
          />
        </svg>
      )}
      {!hasStarted && (
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-white bg-black/70 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Click to start audio
        </span>
      )}
    </button>
  )
}

