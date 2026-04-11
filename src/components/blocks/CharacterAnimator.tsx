'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from 'react'

export type CharType = 'hiragana' | 'katakana' | 'kanji'

export function getCharType(char: string): CharType {
  const code = char.charCodeAt(0)
  if (code >= 0x3041 && code <= 0x3096) return 'hiragana'
  if (code >= 0x30a0 && code <= 0x30ff) return 'katakana'
  return 'kanji'
}

function charToAnimCJKUrl(char: string): string {
  const decimal = char.charCodeAt(0)
  return `https://raw.githubusercontent.com/parsimonhi/animCJK/master/svgsJa/${decimal}.svg`
}

interface CharacterAnimatorProps {
  character: string
  width?: number
  height?: number
  strokeColor?: string
  outlineColor?: string
  autoAnimate?: boolean
  onAnimationComplete?: () => void
  onLoadError?: () => void
  className?: string
}

export function CharacterAnimator(props: CharacterAnimatorProps) {
  const type = getCharType(props.character)
  if (type === 'kanji') {
    return <HanziWriterAnimator {...props} />
  }
  return <AnimCJKAnimator {...props} />
}

// ───────────────────────── HanziWriter (kanji) ─────────────────────────

let HanziWriter: any = null

function HanziWriterAnimator({
  character,
  width = 280,
  height = 280,
  strokeColor = '#1A1814',
  outlineColor = '#E0DAD2',
  autoAnimate = true,
  onAnimationComplete,
  onLoadError,
  className,
}: CharacterAnimatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  const init = useCallback(() => {
    if (!HanziWriter || !containerRef.current) return
    writerRef.current = null
    containerRef.current.innerHTML = ''
    setReady(false)

    try {
      writerRef.current = HanziWriter.create(containerRef.current, character, {
        width,
        height,
        padding: 20,
        showOutline: true,
        showCharacter: false,
        strokeColor,
        outlineColor,
        highlightColor: '#1B4F8A',
        drawingColor: '#1B4F8A',
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 400,
        charDataLoader: (c: string, onLoad: any) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(c)}.json`)
            .then(r => r.json())
            .then(onLoad)
            .catch(() => {
              console.error('Could not load character data for:', c)
            })
        },
        onLoadCharDataError: () => {
          onLoadError?.()
          setReady(true)
        },
        onLoadCharDataSuccess: () => {
          setReady(true)
          if (autoAnimate) {
            writerRef.current?.animateCharacter({
              onComplete: onAnimationComplete,
            })
          }
        },
      })
    } catch (e) {
      console.error('HanziWriter init error:', e)
      onLoadError?.()
      setReady(true)
    }
  }, [character, width, height, strokeColor, outlineColor, autoAnimate, onAnimationComplete, onLoadError])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const run = async () => {
      if (!HanziWriter) {
        HanziWriter = (await import('hanzi-writer')).default
      }
      if (!cancelled) init()
    }
    run().catch(e => {
      console.error('Failed to load hanzi-writer:', e)
      onLoadError?.()
      setReady(true)
    })
    return () => { cancelled = true }
  }, [init, onLoadError])

  return (
    <div className={`character-animator ${className ?? ''}`} style={{ width, height, position: 'relative' }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>{character}</div>
        </div>
      )}
    </div>
  )
}

// ───────────────────────── AnimCJK (hiragana/katakana) ─────────────────────────

const svgMemCache = new Map<string, string>()

function prepareSVGForAnimation(svg: string, strokeColor: string): string {
  return svg
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"')
    .replace(/stroke="#[0-9a-fA-F]{3,6}"/g, `stroke="${strokeColor}"`)
    .replace(/fill="[^"]*"/g, 'fill="none"')
}

function AnimCJKAnimator({
  character,
  width = 280,
  height = 280,
  strokeColor = '#1A1814',
  autoAnimate = true,
  onAnimationComplete,
  onLoadError,
  className,
}: CharacterAnimatorProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setSvg(null)
    setError(false)

    const cacheKey = `mirai_svg_${character}`

    // Check in-memory cache first
    if (svgMemCache.has(character)) {
      const cached = svgMemCache.get(character)!
      setSvg(prepareSVGForAnimation(cached, strokeColor))
      return
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(cacheKey)
        if (stored) {
          svgMemCache.set(character, stored)
          setSvg(prepareSVGForAnimation(stored, strokeColor))
          return
        }
      } catch { /* ignore */ }
    }

    // Fetch from CDN
    fetch(charToAnimCJKUrl(character))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        if (cancelled) return
        svgMemCache.set(character, text)
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem(cacheKey, text) } catch { /* quota */ }
        }
        setSvg(prepareSVGForAnimation(text, strokeColor))
      })
      .catch(e => {
        if (cancelled) return
        console.error('Failed to load animCJK SVG for', character, e)
        setError(true)
        onLoadError?.()
      })

    return () => { cancelled = true }
  }, [character, strokeColor, onLoadError])

  // Schedule completion based on stroke count
  useEffect(() => {
    if (!svg || !autoAnimate) return
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    const strokeCount = (svg.match(/<path/g) || []).length || 1
    const delay = strokeCount * 800 + 500
    completeTimerRef.current = setTimeout(() => {
      onAnimationComplete?.()
    }, delay)
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    }
  }, [svg, autoAnimate, onAnimationComplete])

  if (error) {
    return (
      <FallbackCharacterDisplay
        character={character}
        width={width}
        height={height}
        onComplete={autoAnimate ? onAnimationComplete : undefined}
        className={className}
      />
    )
  }

  return (
    <div className={`character-animator ${className ?? ''}`} style={{ width, height, position: 'relative' }}>
      {svg ? (
        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl opacity-30" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>{character}</div>
        </div>
      )}
    </div>
  )
}

// ───────────────────────── Fallback ─────────────────────────

interface FallbackProps {
  character: string
  width?: number
  height?: number
  onComplete?: () => void
  className?: string
}

function FallbackCharacterDisplay({ character, width = 280, height = 280, onComplete, className }: FallbackProps) {
  useEffect(() => {
    if (!onComplete) return
    const t = setTimeout(onComplete, 1500)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div
      className={`character-animator flex items-center justify-center ${className ?? ''}`}
      style={{ width, height }}
    >
      <div
        style={{
          fontFamily: 'Noto Sans JP, sans-serif',
          fontSize: Math.min(width, height) * 0.6,
          color: '#1A1814',
          fontWeight: 400,
          lineHeight: 1,
        }}
      >
        {character}
      </div>
    </div>
  )
}

export default CharacterAnimator
