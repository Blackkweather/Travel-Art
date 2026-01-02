import React, { useEffect, useRef, useState, useCallback } from 'react'
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
  const audioRef = useRef<HTMLAudioElement | { youtubePlayer?: any } | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const volumeRef = useRef(initialVolume)
  
  // Use stable ID to prevent DOM reuse conflicts
  const playerIdRef = useRef(`youtube-audio-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)
  
  // Track cleanup functions
  const cleanupRefs = useRef<Array<() => void>>([])
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const interactionListenersRef = useRef<Array<{ element: EventTarget; event: string; handler: EventListener }>>([])
  const isInitializingRef = useRef(false)
  const playerInstanceRef = useRef<any>(null)

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  // Safe state setter that checks if component is still mounted
  const safeSetState = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    if (isMountedRef.current) {
      try {
        setter(value)
      } catch (error) {
        // Silently ignore state update errors after unmount
        console.warn('State update skipped (component unmounted):', error)
      }
    }
  }, [])

  // Cleanup function for interaction listeners
  const cleanupInteractionListeners = useCallback(() => {
    interactionListenersRef.current.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler)
      } catch (error) {
        // Ignore cleanup errors
      }
    })
    interactionListenersRef.current = []
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    
    isMountedRef.current = true
    
    // Prevent double creation - check both refs
    if (audioRef.current || isInitializingRef.current) {
      console.log('⚠️ Audio already exists or initializing, skipping creation', {
        hasAudio: !!audioRef.current,
        isInitializing: isInitializingRef.current
      })
      return
    }

    // Check if it's a YouTube URL
    const youtubeId = getYouTubeVideoId(src)
    
    if (youtubeId) {
      // Use YouTube IFrame API
      console.log('🎵 Creating YouTube audio with ID:', youtubeId)
      
      // Mark as initializing to prevent double creation
      isInitializingRef.current = true
      
      let youtubePlayerInstance: any = null
      let apiReadyHandler: (() => void) | null = null
      
      // Load YouTube IFrame API if not already loaded
      if (!window.YT) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        tag.async = true
        const firstScriptTag = document.getElementsByTagName('script')[0]
        if (firstScriptTag?.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        }
      }
      
      // Wait for API to load, then create player
      const initYouTube = () => {
        // Check if component is still mounted
        if (!isMountedRef.current) {
          console.log('⚠️ Component unmounted, skipping YouTube init')
          return
        }

        if (!window.YT || !window.YT.Player) {
          console.log('⏳ Waiting for YouTube API...')
          initTimeoutRef.current = setTimeout(initYouTube, 100)
          return
        }
        
        const playerId = playerIdRef.current
        let playerElement = document.getElementById(playerId)
        
        // If element doesn't exist, create it
        if (!playerElement) {
          console.log('⚠️ YouTube player div not found, creating it:', playerId)
          playerElement = document.createElement('div')
          playerElement.id = playerId
          playerElement.style.display = 'none'
          playerElement.style.position = 'absolute'
          playerElement.style.visibility = 'hidden'
          playerElement.style.pointerEvents = 'none'
          playerElement.setAttribute('data-youtube-player', 'true')
          playerElement.setAttribute('data-react-ignore', 'true')
          
          // Append to body instead of React tree to avoid conflicts
          document.body.appendChild(playerElement)
        }
        
        // Check if element already has a YouTube player instance
        // YouTube API stores the player instance on the element
        if ((playerElement as any).__ytplayer) {
          console.log('⚠️ YouTube player already exists for element:', playerId)
          // Reuse existing player
          try {
            const existingPlayer = (playerElement as any).__ytplayer
            if (existingPlayer && typeof existingPlayer.getPlayerState === 'function') {
              const state = existingPlayer.getPlayerState()
              if (state !== undefined) {
                youtubePlayerInstance = existingPlayer
                playerInstanceRef.current = existingPlayer
                audioRef.current = { youtubePlayer: existingPlayer }
                isInitializingRef.current = false
                console.log('✅ Reusing existing YouTube player')
                return
              }
            }
          } catch (error) {
            console.warn('⚠️ Error reusing existing player, will create new one:', error)
            // Clear the stale reference and continue with new creation
            try {
              (playerElement as any).__ytplayer?.destroy?.()
              delete (playerElement as any).__ytplayer
            } catch (e) {
              // Ignore destroy errors
            }
          }
        }
        
        // Check again if component is still mounted
        if (!isMountedRef.current) {
          isInitializingRef.current = false
          return
        }
        
        // Double-check we're not already initializing
        if (audioRef.current) {
          console.log('⚠️ Audio ref already set, skipping player creation')
          isInitializingRef.current = false
          return
        }
        
        console.log('🎵 Creating YouTube player with ID:', playerId)
        
        try {
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
              rel: 0,
              origin: window.location.origin // Help with CORS
            },
            events: {
              onReady: (event: any) => {
                // Check if component is still mounted before handling ready
                if (!isMountedRef.current) {
                  try {
                    event.target.destroy()
                  } catch (e) {
                    // Ignore destroy errors
                  }
                  return
                }

                // Double-check we're still mounted and not already have a player
                if (!isMountedRef.current) {
                  try {
                    event.target.destroy()
                  } catch (e) {
                    // Ignore destroy errors
                  }
                  isInitializingRef.current = false
                  return
                }
                
                // Prevent duplicate initialization
                if (audioRef.current && (audioRef.current as any).youtubePlayer) {
                  console.log('⚠️ Player already initialized, destroying duplicate')
                  try {
                    event.target.destroy()
                  } catch (e) {
                    // Ignore destroy errors
                  }
                  isInitializingRef.current = false
                  return
                }
                
                console.log('✅ YouTube player ready')
                const player = event.target
                youtubePlayerInstance = player
                playerInstanceRef.current = player
                
                try {
                  player.setVolume(initialVolume * 100)
                  player.unMute()
                } catch (error) {
                  console.warn('⚠️ Error setting initial volume:', error)
                }
                
                // Store player reference and mark initialization complete
                audioRef.current = { youtubePlayer: player }
                isInitializingRef.current = false
                
                // Try to start automatically
                const tryPlay = () => {
                  if (!isMountedRef.current) return
                  
                  try {
                    console.log('🎵 Attempting to play YouTube automatically...')
                    player.playVideo()
                    safeSetState(setHasStarted, true)
                    safeSetState(setIsMuted, false)
                  } catch (error: any) {
                    console.warn('⚠️ Autoplay blocked, will start on user interaction:', error)
                    // Fallback: start on any user interaction
                    const startOnClick = () => {
                      if (!isMountedRef.current) return
                      if (hasStarted) return
                      
                      try {
                        console.log('🎵 Starting YouTube on click...')
                        player.playVideo()
                        safeSetState(setHasStarted, true)
                        safeSetState(setIsMuted, false)
                      } catch (e) {
                        console.warn('⚠️ Error starting on click:', e)
                      }
                    }
                    
                    // Store listeners for cleanup
                    const clickHandler = startOnClick
                    const touchHandler = startOnClick
                    document.addEventListener('click', clickHandler, { once: true })
                    document.addEventListener('touchstart', touchHandler, { once: true })
                    
                    interactionListenersRef.current.push(
                      { element: document, event: 'click', handler: clickHandler },
                      { element: document, event: 'touchstart', handler: touchHandler }
                    )
                  }
                }
                
                // Try immediately
                tryPlay()
              },
              onStateChange: (event: any) => {
                if (!isMountedRef.current) return
                
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
                  safeSetState(setHasStarted, true)
                }
              },
              onError: (event: any) => {
                console.error('❌ YouTube player error:', event.data)
              }
            }
          })
        } catch (error) {
          console.error('❌ Error creating YouTube player:', error)
          isInitializingRef.current = false
        }
      }
      
      if (window.YT && window.YT.Player) {
        initYouTube()
      } else {
        // Store the handler to clean it up later
        // Wrap in a guard to prevent multiple calls
        apiReadyHandler = () => {
          // Only initialize if we're still supposed to
          if (isMountedRef.current && isInitializingRef.current && !audioRef.current) {
            initYouTube()
          } else {
            console.log('⚠️ API ready handler called but initialization skipped', {
              isMounted: isMountedRef.current,
              isInitializing: isInitializingRef.current,
              hasAudio: !!audioRef.current
            })
            isInitializingRef.current = false
          }
        }
        
        // Only set if not already set by another instance
        if (!window.onYouTubeIframeAPIReady) {
          window.onYouTubeIframeAPIReady = apiReadyHandler
        } else {
          // If already set, call our handler after a short delay
          const existingHandler = window.onYouTubeIframeAPIReady
          window.onYouTubeIframeAPIReady = () => {
            existingHandler()
            setTimeout(() => apiReadyHandler?.(), 100)
          }
        }
      }
      
      // Setup GSAP scroll-based volume fade
      try {
        const scrollTrigger = ScrollTrigger.create({
          trigger: 'body',
          start: 'top top',
          end: `${maxScrollForFade}px top`,
          scrub: 1,
          onUpdate: (self) => {
            if (!isMountedRef.current) return
            
            const youtubePlayer = (audioRef.current as any)?.youtubePlayer
            if (youtubePlayer && !isMuted) {
              try {
                const newVolume = initialVolume * (1 - self.progress)
                volumeRef.current = newVolume
                youtubePlayer.setVolume(Math.max(newVolume * 100, 0))
              } catch (error) {
                // Ignore volume update errors
              }
            }
          }
        })
        scrollTriggerRef.current = scrollTrigger
      } catch (error) {
        console.warn('⚠️ Error creating ScrollTrigger:', error)
      }
      
      // Cleanup function
      return () => {
        isMountedRef.current = false
        isInitializingRef.current = false
        
        // Clear init timeout
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current)
          initTimeoutRef.current = null
        }
        
        // Clean up interaction listeners
        cleanupInteractionListeners()
        
        // Clean up API ready handler
        if (apiReadyHandler && window.onYouTubeIframeAPIReady === apiReadyHandler) {
          window.onYouTubeIframeAPIReady = () => {}
        }
        
        // Destroy YouTube player safely - check both refs
        const playerToDestroy = youtubePlayerInstance || playerInstanceRef.current
        if (playerToDestroy) {
          try {
            // Check if player still exists and is valid
            const playerState = playerToDestroy.getPlayerState?.()
            if (playerState !== undefined) {
              playerToDestroy.stopVideo?.()
              playerToDestroy.destroy?.()
            }
          } catch (error) {
            console.warn('⚠️ Error destroying YouTube player:', error)
          }
          youtubePlayerInstance = null
          playerInstanceRef.current = null
        }
        
        // Also check if element has a player instance
        const playerId = playerIdRef.current
        const playerElement = document.getElementById(playerId)
        if (playerElement && (playerElement as any).__ytplayer) {
          try {
            const elementPlayer = (playerElement as any).__ytplayer
            if (elementPlayer && typeof elementPlayer.getPlayerState === 'function') {
              elementPlayer.destroy?.()
            }
            delete (playerElement as any).__ytplayer
          } catch (error) {
            console.warn('⚠️ Error cleaning up element player:', error)
          }
        }
        
        // Clear player reference
        audioRef.current = null
        isInitializingRef.current = false
        
        // Kill ScrollTrigger
        if (scrollTriggerRef.current) {
          try {
            scrollTriggerRef.current.kill()
          } catch (error) {
            // Ignore ScrollTrigger cleanup errors
          }
          scrollTriggerRef.current = null
        }
      }
    }

    // Regular audio file handling
    const normalizedSrc = src.startsWith('/') ? src : `/${src}`
    console.log('🎵 Creating audio with src:', normalizedSrc)
    
    // Create audio element
    const audio = new Audio()
    audio.loop = true
    audio.volume = initialVolume
    audio.preload = 'auto'
    
    // Set src after creating element
    audio.src = normalizedSrc
    
    // Track event listeners for cleanup
    const errorHandler = (e: Event) => {
      console.error('❌ Audio error:', {
        code: (audio as any).error?.code,
        message: (audio as any).error?.message,
        src: audio.src,
        readyState: audio.readyState
      })
    }
    
    const loadStartHandler = () => {
      console.log('🎵 Audio load started:', audio.src)
    }
    
    const canPlayHandler = () => {
      console.log('✅ Audio can play:', audio.src)
    }
    
    const playingHandler = () => {
      console.log('🎵 Audio is actually playing!', {
        currentTime: audio.currentTime,
        volume: audio.volume,
        muted: audio.muted
      })
    }
    
    // Add event listeners
    audio.addEventListener('error', errorHandler)
    audio.addEventListener('loadstart', loadStartHandler)
    audio.addEventListener('canplay', canPlayHandler)
    audio.addEventListener('playing', playingHandler)
    
    audioRef.current = audio
    volumeRef.current = initialVolume
    
    console.log('🎵 Audio element created with src:', audio.src)

    // Function to start audio
    const startAudio = async () => {
      if (!isMountedRef.current || hasStarted || !audioRef.current) {
        console.log('🎵 Start audio skipped:', { isMounted: isMountedRef.current, hasStarted, hasAudio: !!audioRef.current })
        return
      }
      
      console.log('🎵 Attempting to play audio:', (audioRef.current as HTMLAudioElement).src)
      try {
        (audioRef.current as HTMLAudioElement).muted = false
        ;(audioRef.current as HTMLAudioElement).volume = initialVolume
        await (audioRef.current as HTMLAudioElement).play()
        console.log('✅ Audio playing!')
        safeSetState(setHasStarted, true)
      } catch (e: any) {
        console.error('❌ Audio play failed:', e.message, e)
      }
    }

    // Try to start automatically when ready
    const canPlayStartHandler = () => {
      startAudio().catch((error) => {
        if (!isMountedRef.current) return
        
        console.warn('⚠️ Autoplay blocked, will start on user interaction')
        // If autoplay fails, start on user interaction
        const handleInteraction = () => {
          if (!isMountedRef.current) return
          startAudio().catch(() => {})
        }
        
        const clickHandler = handleInteraction
        const touchHandler = handleInteraction
        
        document.addEventListener('click', clickHandler, { once: true })
        document.addEventListener('touchstart', touchHandler, { once: true })
        
        interactionListenersRef.current.push(
          { element: document, event: 'click', handler: clickHandler },
          { element: document, event: 'touchstart', handler: touchHandler }
        )
      })
    }
    
    audio.addEventListener('canplay', canPlayStartHandler)
    
    // Also try after a short delay
    const delayTimeout = setTimeout(() => {
      if (isMountedRef.current && !hasStarted && audioRef.current) {
        startAudio().catch(() => {})
      }
    }, 500)

    // Setup GSAP scroll-based volume fade
    try {
      const scrollTrigger = ScrollTrigger.create({
        trigger: 'body',
        start: 'top top',
        end: `${maxScrollForFade}px top`,
        scrub: 1,
        onUpdate: (self) => {
          if (!isMountedRef.current) return
          
          if (audioRef.current && !isMuted && !(audioRef.current as any).youtubePlayer) {
            try {
              const newVolume = initialVolume * (1 - self.progress)
              volumeRef.current = newVolume
              ;(audioRef.current as HTMLAudioElement).volume = Math.max(newVolume, 0)
            } catch (error) {
              // Ignore volume update errors
            }
          }
        }
      })
      scrollTriggerRef.current = scrollTrigger
    } catch (error) {
      console.warn('⚠️ Error creating ScrollTrigger:', error)
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false
      isInitializingRef.current = false
      
      // Clean up interaction listeners
      cleanupInteractionListeners()
      
      // Remove audio event listeners
      if (audioRef.current && !(audioRef.current as any).youtubePlayer) {
        const audioEl = audioRef.current as HTMLAudioElement
        audioEl.removeEventListener('error', errorHandler)
        audioEl.removeEventListener('loadstart', loadStartHandler)
        audioEl.removeEventListener('canplay', canPlayHandler)
        audioEl.removeEventListener('playing', playingHandler)
        audioEl.removeEventListener('canplay', canPlayStartHandler)
        
        try {
          audioEl.pause()
          audioEl.src = ''
          audioEl.load()
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      // Clear timeout
      clearTimeout(delayTimeout)
      
      // Clear audio reference
      audioRef.current = null
      
      // Kill ScrollTrigger
      if (scrollTriggerRef.current) {
        try {
          scrollTriggerRef.current.kill()
        } catch (error) {
          // Ignore ScrollTrigger cleanup errors
        }
        scrollTriggerRef.current = null
      }
    }
  }, [src, initialVolume, maxScrollForFade, prefersReducedMotion, hasStarted, safeSetState, cleanupInteractionListeners])

  const toggleMute = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isMountedRef.current) return
    
    // Check if it's YouTube player
    const youtubePlayer = (audioRef.current as any)?.youtubePlayer
    console.log('🔍 Button clicked, checking player:', {
      hasYoutubePlayer: !!youtubePlayer,
      hasStarted,
      isMuted,
      audioRef: audioRef.current
    })
    
    if (youtubePlayer) {
      console.log('✅ YouTube player found!')
      
      try {
        // Check if player is still valid
        const playerState = youtubePlayer.getPlayerState?.()
        if (playerState === undefined) {
          console.warn('⚠️ YouTube player is invalid')
          return
        }
        
        if (!hasStarted) {
          console.log('🎵 Starting YouTube audio...')
          youtubePlayer.setVolume(initialVolume * 100)
          youtubePlayer.unMute()
          youtubePlayer.playVideo()
          safeSetState(setHasStarted, true)
          safeSetState(setIsMuted, false)
        } else {
          const newMutedState = !isMuted
          console.log('🔇 Toggling mute:', newMutedState)
          if (newMutedState) {
            youtubePlayer.mute()
          } else {
            youtubePlayer.unMute()
          }
          safeSetState(setIsMuted, newMutedState)
        }
      } catch (error: any) {
        console.error('❌ Error with YouTube player:', error)
      }
      return
    }
    
    if (!audioRef.current || (audioRef.current as any).youtubePlayer) {
      console.error('❌ No valid audio element!')
      return
    }
    
    const audioEl = audioRef.current as HTMLAudioElement
    
    if (!hasStarted) {
      try {
        console.log('🎵 Starting audio from button click...')
        audioEl.muted = false
        audioEl.volume = initialVolume
        
        // Force load if needed
        if (audioEl.readyState === 0) {
          audioEl.load()
          await new Promise(resolve => {
            const canPlayHandler = () => resolve(undefined)
            audioEl.addEventListener('canplay', canPlayHandler, { once: true })
            setTimeout(resolve, 2000)
          })
        }
        
        await audioEl.play()
        console.log('✅ Audio started!', {
          paused: audioEl.paused,
          muted: audioEl.muted,
          volume: audioEl.volume,
          currentTime: audioEl.currentTime
        })
        safeSetState(setHasStarted, true)
        safeSetState(setIsMuted, false)
        return
      } catch (error: any) {
        console.error('❌ Failed to start:', error)
        alert(`Could not play audio: ${error.message}`)
        return
      }
    }
    
    const newMutedState = !isMuted
    audioEl.muted = newMutedState
    safeSetState(setIsMuted, newMutedState)
    console.log('🔇 Mute toggled:', newMutedState)
  }, [hasStarted, isMuted, initialVolume, safeSetState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  if (prefersReducedMotion) return null

  const isYouTube = !!getYouTubeVideoId(src)

  // Don't render YouTube div in React - we'll create it directly in DOM to avoid conflicts
  // React will try to manage it and conflict with YouTube's DOM manipulation
  // Create it immediately, not in useEffect, to prevent React from trying to manage it
  if (isYouTube && typeof window !== 'undefined') {
    const playerId = playerIdRef.current
    let playerElement = document.getElementById(playerId)
    
    if (!playerElement) {
      playerElement = document.createElement('div')
      playerElement.id = playerId
      playerElement.style.display = 'none'
      playerElement.style.position = 'absolute'
      playerElement.style.visibility = 'hidden'
      playerElement.style.pointerEvents = 'none'
      playerElement.style.width = '0'
      playerElement.style.height = '0'
      playerElement.style.top = '-9999px'
      playerElement.style.left = '-9999px'
      playerElement.setAttribute('data-youtube-player', 'true')
      playerElement.setAttribute('data-react-ignore', 'true')
      // Append to body immediately, before React tries to render
      if (document.body) {
        document.body.appendChild(playerElement)
      } else {
        // If body not ready, wait for it
        const observer = new MutationObserver(() => {
          if (document.body && !document.getElementById(playerId)) {
            document.body.appendChild(playerElement!)
            observer.disconnect()
          }
        })
        observer.observe(document.documentElement, { childList: true, subtree: true })
      }
    }
  }

  return (
    <>
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
