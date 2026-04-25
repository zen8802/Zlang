'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  character: string
  size?: number
  autoPlay?: boolean
  loop?: boolean
  showGrid?: boolean
  strokeColor?: string
  onComplete?: () => void
  speed?: number
  delayBetweenStrokes?: number
}

/**
 * Renders a single Japanese character (hiragana, katakana, or kanji) with
 * animated stroke order via hanzi-writer. Includes an optional calligraphy
 * grid, auto-play, looping, and a replay button after completion.
 *
 * Uses local hanzi-writer-data for instant loads (no CDN dependency) with a
 * CDN fallback for any characters not in the local dataset.
 */
export function StrokeAnimation({
  character,
  size = 200,
  autoPlay = true,
  loop = false,
  showGrid = true,
  strokeColor = '#1A1814',
  onComplete,
  speed = 0.8,
  delayBetweenStrokes = 300,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    // Reset state for new character
    setIsReady(false)
    setIsAnimating(false)
    setHasCompleted(false)

    import('hanzi-writer').then(({ default: HanziWriter }) => {
      if (cancelled || !containerRef.current) return
      containerRef.current.innerHTML = ''

      try {
        const writer = HanziWriter.create(containerRef.current!, character, {
          width: size,
          height: size,
          padding: Math.round(size * 0.08),
          strokeColor,
          strokeWidth: size > 150 ? 8 : 6,
          outlineColor: 'rgba(26, 24, 20, 0.08)',
          outlineWidth: size > 150 ? 6 : 4,
          showCharacter: false,
          showOutline: true,
          showHintAfterMisses: false,
          strokeAnimationSpeed: speed,
          delayBetweenStrokes,
          // Load character data from CDN
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          charDataLoader: (char: string, onLoad: any, onError: any) => {
            fetch(
              `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`,
            )
              .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
              })
              .then(onLoad)
              .catch(onError)
          },
          // Only animate AFTER character data has loaded successfully
          onLoadCharDataSuccess: () => {
            if (cancelled) return
            writerRef.current = writer
            setIsReady(true)

            if (autoPlay) {
              // Brief delay so the user sees the outline before strokes begin
              setTimeout(() => {
                if (cancelled) return
                setIsAnimating(true)
                writer.animateCharacter({
                  onComplete: () => {
                    if (cancelled) return
                    setIsAnimating(false)
                    setHasCompleted(true)
                    onCompleteRef.current?.()

                    if (loop) {
                      setTimeout(() => {
                        if (cancelled) return
                        setHasCompleted(false)
                        setIsAnimating(true)
                        writer.animateCharacter({
                          onComplete: () => {
                            setIsAnimating(false)
                            setHasCompleted(true)
                          },
                        })
                      }, 1200)
                    }
                  },
                })
              }, 300)
            }
          },
          onLoadCharDataError: () => {
            if (cancelled) return
            console.warn(`StrokeAnimation: no data for "${character}"`)
            setIsReady(true)
          },
        })

        writerRef.current = writer
      } catch (err) {
        console.warn(`StrokeAnimation: init error for "${character}"`, err)
        if (!cancelled) setIsReady(true)
      }
    })

    return () => {
      cancelled = true
      writerRef.current = null
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.innerHTML = ''
      }
    }
  }, [character, size, strokeColor, speed, delayBetweenStrokes, autoPlay, loop])

  const replay = useCallback(() => {
    if (!writerRef.current || isAnimating) return
    setHasCompleted(false)
    setIsAnimating(true)
    writerRef.current.animateCharacter({
      onComplete: () => {
        setIsAnimating(false)
        setHasCompleted(true)
        onCompleteRef.current?.()
      },
    })
  }, [isAnimating])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Calligraphy grid — SVG behind the writer */}
        {showGrid && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={size}
            height={size}
            style={{ zIndex: 0 }}
          >
            <rect
              x="1"
              y="1"
              width={size - 2}
              height={size - 2}
              fill="none"
              stroke="rgba(26, 24, 20, 0.08)"
              strokeWidth="1"
            />
            <line
              x1={size * 0.08}
              y1={size / 2}
              x2={size * 0.92}
              y2={size / 2}
              stroke="rgba(26, 24, 20, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <line
              x1={size / 2}
              y1={size * 0.08}
              x2={size / 2}
              y2={size * 0.92}
              stroke="rgba(26, 24, 20, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          </svg>
        )}

        {/* hanzi-writer target */}
        <div
          ref={containerRef}
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        />

        {/* Loading shimmer */}
        {!isReady && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 2 }}
          >
            <div
              className="rounded-full animate-pulse"
              style={{
                width: size * 0.4,
                height: size * 0.4,
                backgroundColor: 'rgba(26, 24, 20, 0.05)',
              }}
            />
          </div>
        )}
      </div>

      {/* Replay button */}
      {hasCompleted && !loop && (
        <button
          onClick={replay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0DAD2] text-xs text-[#9E9892] hover:border-[#1B4F8A]/40 hover:text-[#1B4F8A] transition-colors ink-in"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M1 4v6h6M23 20v-6h-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Watch again
        </button>
      )}
    </div>
  )
}

export default StrokeAnimation
