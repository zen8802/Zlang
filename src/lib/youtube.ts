// ---------------------------------------------------------------------------
// YouTube IFrame API Wrapper
// ---------------------------------------------------------------------------

/** Minimal YouTube player interface for the IFrame API wrapper. */
interface YTPlayerInstance {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  pauseVideo: () => void
  playVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}

interface YTPlayerEvent {
  target: YTPlayerInstance
  data: number
}

interface YTNamespace {
  Player: new (
    elementId: string,
    config: {
      videoId: string
      playerVars: Record<string, number>
      events: {
        onReady: (event: YTPlayerEvent) => void
        onStateChange: (event: YTPlayerEvent) => void
      }
    },
  ) => YTPlayerInstance
}

declare global {
  interface Window {
    YT: YTNamespace
    onYouTubeIframeAPIReady: () => void
  }
}

let apiLoadPromise: Promise<void> | null = null

/**
 * Load the YouTube IFrame API script if not already loaded.
 * Returns a promise that resolves when the API is ready.
 */
export function loadYouTubeAPI(): Promise<void> {
  // If already loaded, resolve immediately
  if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
    return Promise.resolve()
  }

  // If a load is in progress, return the existing promise
  if (apiLoadPromise) {
    return apiLoadPromise
  }

  apiLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('YouTube API can only be loaded in a browser environment'))
      return
    }

    // Check if the script tag already exists
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    )

    if (existingScript) {
      // Script tag exists but API not ready yet — wait for callback
      const originalCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (originalCallback) originalCallback()
        resolve()
      }
      return
    }

    // Set up the global callback before injecting the script
    const originalCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (originalCallback) originalCallback()
      resolve()
    }

    // Inject the script tag
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      apiLoadPromise = null
      reject(new Error('Failed to load YouTube IFrame API'))
    }
    document.head.appendChild(script)
  })

  return apiLoadPromise
}

/**
 * Create a YouTube player instance that plays a clip from startSeconds to
 * endSeconds. The player auto-pauses when endSeconds is reached.
 */
export function createPlayer(
  elementId: string,
  videoId: string,
  startSeconds: number,
  endSeconds: number,
  options?: {
    onReady?: () => void
    onStateChange?: (state: number) => void
    onEnd?: () => void
    autoplay?: boolean
  },
): YTPlayerInstance {
  if (typeof window === 'undefined' || !window.YT || !window.YT.Player) {
    throw new Error('YouTube API is not loaded. Call loadYouTubeAPI() first.')
  }

  let endCheckInterval: ReturnType<typeof setInterval> | null = null

  const player = new window.YT.Player(elementId, {
    videoId,
    playerVars: {
      start: Math.floor(startSeconds),
      end: Math.ceil(endSeconds),
      autoplay: options?.autoplay ? 1 : 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
    },
    events: {
      onReady: (event: YTPlayerEvent) => {
        // Seek to precise start time (playerVars.start only takes integers)
        if (startSeconds % 1 !== 0) {
          event.target.seekTo(startSeconds, true)
        }
        options?.onReady?.()
      },
      onStateChange: (event: YTPlayerEvent) => {
        const state: number = event.data

        // YT.PlayerState.PLAYING === 1
        if (state === 1) {
          // Start polling to detect when we reach endSeconds
          if (endCheckInterval) clearInterval(endCheckInterval)
          endCheckInterval = setInterval(() => {
            const currentTime: number = event.target.getCurrentTime()
            if (currentTime >= endSeconds) {
              event.target.pauseVideo()
              if (endCheckInterval) {
                clearInterval(endCheckInterval)
                endCheckInterval = null
              }
              options?.onEnd?.()
            }
          }, 250)
        }

        // YT.PlayerState.PAUSED === 2  or  YT.PlayerState.ENDED === 0
        if (state === 2 || state === 0) {
          if (endCheckInterval) {
            clearInterval(endCheckInterval)
            endCheckInterval = null
          }
          if (state === 0) {
            options?.onEnd?.()
          }
        }

        options?.onStateChange?.(state)
      },
    },
  })

  return player
}

/**
 * Seek the player to a specific time in seconds.
 */
export function seekTo(player: YTPlayerInstance | null, seconds: number): void {
  if (player && typeof player.seekTo === 'function') {
    player.seekTo(seconds, true)
  }
}

/**
 * Pause the player.
 */
export function pausePlayer(player: YTPlayerInstance | null): void {
  if (player && typeof player.pauseVideo === 'function') {
    player.pauseVideo()
  }
}

/**
 * Play / resume the player.
 */
export function playPlayer(player: YTPlayerInstance | null): void {
  if (player && typeof player.playVideo === 'function') {
    player.playVideo()
  }
}

/**
 * Destroy the player instance and clean up.
 */
export function destroyPlayer(player: YTPlayerInstance | null): void {
  if (player && typeof player.destroy === 'function') {
    player.destroy()
  }
}

// ---------------------------------------------------------------------------
// Embed URL builders
// ---------------------------------------------------------------------------

/**
 * Build a YouTube embed URL with start/end times and player options.
 */
export const buildYouTubeEmbedUrl = (
  videoId: string,
  startSeconds: number,
  endSeconds: number,
  autoplay = true,
): string => {
  const params = new URLSearchParams({
    start: String(Math.floor(startSeconds)),
    end: String(Math.ceil(endSeconds)),
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    cc_load_policy: '1',
    playsinline: '1',
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

/**
 * Build a YouTube watch URL that jumps to a specific timestamp.
 */
export const buildYouTubeTimestampUrl = (
  videoId: string,
  seconds: number,
): string => `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`
