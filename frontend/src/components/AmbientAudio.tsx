import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface AmbientAudioProps {
  src: string
  initialVolume?: number
  maxScrollForFade?: number
}

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default function AmbientAudio({ 
  src, 
  initialVolume = 0.2, 
  maxScrollForFade = 1000 
}: AmbientAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const volumeRef = useRef(initialVolume)
  const playerIdRef = useRef(`youtube-audio-player-${Math.random().toString(36).substr(2, 9)}`)

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  useEffect(() => {
    if (prefersReducedMotion) return
    
    // Prevent double creation
    if (audioRef.current) {
      console.log('⚠️ Audio already exists, skipping creation')
      return
    }

    // Check if it's a YouTube URL
    const youtubeId = getYouTubeVideoId(src)
    
    if (youtubeId) {
      // Use YouTube IFrame API
      console.log('🎵 Creating YouTube audio with ID:', youtubeId)
      
      // Load YouTube IFrame API if not already loaded
      if (!window.YT) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }
      
      // Wait for API to load, then create player
      const initYouTube = () => {
        if (!window.YT || !window.YT.Player) {
          console.log('⏳ Waiting for YouTube API...')
          setTimeout(initYouTube, 100)
          return
        }
        
        const playerId = playerIdRef.current
        const playerElement = document.getElementById(playerId)
        if (!playerElement) {
          console.error('❌ YouTube player div not found:', playerId)
          setTimeout(initYouTube, 100)
          return
        }
        
        console.log('🎵 Creating YouTube player with ID:', playerId)
        const player = new window.YT.Player(playerId, {
          height: '0',
          width: '0',
          videoId: youtubeId,
          playerVars: {
            autoplay: 0,
            loop: 1,
            playlist: youtubeId, // Required for loop to work
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0
          },
          events: {
            onReady: (event: any) => {
              console.log('✅ YouTube player ready')
              const player = event.target
              player.setVolume(initialVolume * 100)
              player.unMute()
              // Store player reference
              ;(audioRef as any).current = { youtubePlayer: player }
              
              // Try to start automatically
              const tryPlay = () => {
                try {
                  console.log('🎵 Attempting to play YouTube automatically...')
                  player.playVideo()
                  setHasStarted(true)
                  setIsMuted(false)
                } catch (error: any) {
                  console.warn('⚠️ Autoplay blocked, will start on user interaction:', error)
                  // Fallback: start on any user interaction
                  const startOnClick = () => {
                    if (!hasStarted) {
                      console.log('🎵 Starting YouTube on click...')
                      player.playVideo()
                      setHasStarted(true)
                      setIsMuted(false)
                    }
                  }
                  document.addEventListener('click', startOnClick, { once: true })
                  document.addEventListener('touchstart', startOnClick, { once: true })
                }
              }
              
              // Try immediately
              tryPlay()
            },
            onStateChange: (event: any) => {
              const states = window.YT.PlayerState
              console.log('📊 YouTube state changed:', {
                state: event.data,
                UNSTARTED: states.UNSTARTED,
                ENDED: states.ENDED,
                PLAYING: states.PLAYING,
                PAUSED: states.PAUSED,
                BUFFERING: states.BUFFERING,
                CUED: states.CUED
              })
              if (event.data === states.PLAYING) {
                console.log('🎵 YouTube audio playing!')
                setHasStarted(true)
              }
            },
            onError: (event: any) => {
              console.error('❌ YouTube player error:', event.data)
            }
          }
        })
      }
      
      if (window.YT && window.YT.Player) {
        initYouTube()
      } else {
        window.onYouTubeIframeAPIReady = initYouTube
      }
      
      return () => {
        if ((audioRef as any).current?.youtubePlayer) {
          (audioRef as any).current.youtubePlayer.destroy()
        }
      }
    }

    // Regular audio file
    const normalizedSrc = src.startsWith('/') ? src : `/${src}`
    console.log('🎵 Creating audio with src:', normalizedSrc)
    
    // Create audio element
    const audio = new Audio()
    audio.loop = true
    audio.volume = initialVolume
    audio.preload = 'auto'
    
    // Set src after creating element
    audio.src = normalizedSrc
    
    // Add event listeners
    audio.addEventListener('error', (e) => {
      console.error('❌ Audio error:', {
        code: audio.error?.code,
        message: audio.error?.message,
        src: audio.src,
        readyState: audio.readyState
      })
    })
    
    audio.addEventListener('loadstart', () => {
      console.log('🎵 Audio load started:', audio.src)
    })
    
    audio.addEventListener('canplay', () => {
      console.log('✅ Audio can play:', audio.src)
    })
    
    audio.addEventListener('playing', () => {
      console.log('🎵 Audio is actually playing!', {
        currentTime: audio.currentTime,
        volume: audio.volume,
        muted: audio.muted
      })
    })
    
    audioRef.current = audio
    volumeRef.current = initialVolume
    
    console.log('🎵 Audio element created with src:', audio.src)

    // Function to start audio
    const startAudio = async () => {
      if (hasStarted || !audioRef.current) {
        console.log('🎵 Start audio skipped:', { hasStarted, hasAudio: !!audioRef.current })
        return
      }
      
      console.log('🎵 Attempting to play audio:', audioRef.current.src)
      try {
        audioRef.current.muted = false
        audioRef.current.volume = initialVolume
        await audioRef.current.play()
        console.log('✅ Audio playing!')
        setHasStarted(true)
      } catch (e: any) {
        console.error('❌ Audio play failed:', e.message, e)
      }
    }

    // Try to start automatically when ready
    audio.addEventListener('canplay', () => {
      startAudio().catch((error) => {
        console.warn('⚠️ Autoplay blocked, will start on user interaction')
        // If autoplay fails, start on user interaction
        const handleInteraction = () => {
          startAudio().catch(() => {})
        }
        document.addEventListener('click', handleInteraction, { once: true })
        document.addEventListener('touchstart', handleInteraction, { once: true })
      })
    })
    
    // Also try after a short delay
    setTimeout(() => {
      if (!hasStarted && audioRef.current) {
        startAudio().catch(() => {})
      }
    }, 500)

    // Setup GSAP scroll-based volume fade
    const scrollTrigger = ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: `${maxScrollForFade}px top`,
      scrub: 1,
      onUpdate: (self) => {
        const youtubePlayer = (audioRef as any).current?.youtubePlayer
        if (youtubePlayer && !isMuted) {
          const newVolume = initialVolume * (1 - self.progress)
          volumeRef.current = newVolume
          youtubePlayer.setVolume(Math.max(newVolume * 100, 0))
        } else if (audioRef.current && !isMuted) {
          const newVolume = initialVolume * (1 - self.progress)
          volumeRef.current = newVolume
          audioRef.current.volume = Math.max(newVolume, 0)
        }
      }
    })

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      scrollTrigger.kill()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src, initialVolume, maxScrollForFade, prefersReducedMotion])

  const toggleMute = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if it's YouTube player
    const youtubePlayer = (audioRef as any).current?.youtubePlayer
    console.log('🔍 Button clicked, checking player:', {
      hasYoutubePlayer: !!youtubePlayer,
      hasStarted,
      isMuted,
      audioRef: audioRef.current
    })
    
    if (youtubePlayer) {
      console.log('✅ YouTube player found!')
      if (!hasStarted) {
        console.log('🎵 Starting YouTube audio...')
        try {
          youtubePlayer.setVolume(initialVolume * 100)
          youtubePlayer.unMute()
          const result = youtubePlayer.playVideo()
          console.log('✅ playVideo() called, result:', result)
          console.log('📊 Player state:', youtubePlayer.getPlayerState())
          setHasStarted(true)
          setIsMuted(false)
        } catch (error: any) {
          console.error('❌ Error starting YouTube:', error)
        }
      } else {
        const newMutedState = !isMuted
        console.log('🔇 Toggling mute:', newMutedState)
        if (newMutedState) {
          youtubePlayer.mute()
        } else {
          youtubePlayer.unMute()
        }
        setIsMuted(newMutedState)
      }
      return
    } else {
      console.log('⚠️ No YouTube player found')
    }
    
    if (!audioRef.current) {
      console.error('❌ No audio element!')
      return
    }
    
    if (!hasStarted) {
      try {
        console.log('🎵 Starting audio from button click...')
        audioRef.current.muted = false
        audioRef.current.volume = initialVolume
        
        // Force load if needed
        if (audioRef.current.readyState === 0) {
          audioRef.current.load()
          await new Promise(resolve => {
            audioRef.current?.addEventListener('canplay', resolve, { once: true })
            setTimeout(resolve, 2000)
          })
        }
        
        await audioRef.current.play()
        console.log('✅ Audio started!', {
          paused: audioRef.current.paused,
          muted: audioRef.current.muted,
          volume: audioRef.current.volume,
          currentTime: audioRef.current.currentTime
        })
        setHasStarted(true)
        setIsMuted(false)
        return
      } catch (error: any) {
        console.error('❌ Failed to start:', error)
        alert(`Could not play audio: ${error.message}`)
        return
      }
    }
    
    const newMutedState = !isMuted
    audioRef.current.muted = newMutedState
    setIsMuted(newMutedState)
    console.log('🔇 Mute toggled:', newMutedState)
  }

  if (prefersReducedMotion) return null

  const isYouTube = !!getYouTubeVideoId(src)

  return (
    <>
      {isYouTube && <div id={playerIdRef.current} style={{ display: 'none' }} />}
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
        <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-white bg-gold px-3 py-1.5 rounded shadow-lg font-medium">
          Click to Play
        </span>
      )}
    </button>
    </>
  )
}
