'use client'

import { useEffect, useRef, useState } from 'react'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'

interface Props {
  kanji: KyouikuKanji
  onComplete: () => void
}

const SIZE = 280

export function TracePhase({ kanji, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writerRef = useRef<any>(null)
  const [strokesCompleted, setStrokesCompleted] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    setReady(false)
    setStrokesCompleted(0)
    setIsComplete(false)
    setMistakeCount(0)

    import('hanzi-writer').then(({ default: HanziWriter }) => {
      if (cancelled || !containerRef.current) return
      containerRef.current.innerHTML = ''

      const writer = HanziWriter.create(containerRef.current, kanji.character, {
        width: SIZE,
        height: SIZE,
        padding: 16,
        showCharacter: false,
        showOutline: true,
        strokeColor: '#1B4F8A',
        outlineColor: 'rgba(26,24,20,0.12)',
        drawingColor: '#1B4F8A',
        drawingWidth: 8,
        strokeWidth: 6,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        highlightColor: '#C9920A',
        strokeAnimationSpeed: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        charDataLoader: (char: string, onLoad: any, onError: any) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`)
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`)
              return r.json()
            })
            .then(onLoad)
            .catch(onError)
        },
        onLoadCharDataSuccess: () => {
          if (cancelled) return
          setReady(true)
          writer.quiz({
            onMistake: () => {
              if (cancelled) return
              setMistakeCount((m) => m + 1)
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onCorrectStroke: (data: any) => {
              if (cancelled) return
              setStrokesCompleted(data.strokesRemaining !== undefined
                ? (data.totalMistakes !== undefined
                    ? kanji.strokeCount - data.strokesRemaining
                    : (data.strokesCompleted ?? 0))
                : (data.strokesCompleted ?? 0))
            },
            onComplete: () => {
              if (cancelled) return
              setIsComplete(true)
              setStrokesCompleted(kanji.strokeCount)
              setTimeout(() => {
                if (!cancelled) onComplete()
              }, 1200)
            },
          })
        },
        onLoadCharDataError: () => {
          if (cancelled) return
          console.warn(`TracePhase: no stroke data for "${kanji.character}"`)
          setReady(true)
        },
      })

      writerRef.current = writer
    })

    return () => {
      cancelled = true
      writerRef.current = null
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanji.character])

  return (
    <div className="flex flex-col items-center px-6 py-8 space-y-6">
      {/* Instructions */}
      <div className="text-center space-y-1">
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '20px', color: '#1A1814' }}>
          Trace the character
        </p>
        <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans' }}>
          Follow the stroke order guides.
          {mistakeCount > 0 && (
            <span style={{ color: '#8B3A3A' }}>
              {' '}{mistakeCount} mistake{mistakeCount !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Writing canvas */}
      <div
        className="rounded-[16px] p-2 relative"
        style={{
          backgroundColor: 'white',
          border: '1.5px solid #E0DAD2',
          boxShadow: '0 2px 16px rgba(26,24,20,0.06)',
        }}
      >
        {/* Calligraphy grid behind canvas */}
        <svg
          className="absolute inset-2 pointer-events-none"
          width={SIZE}
          height={SIZE}
        >
          <line x1={SIZE / 2} y1="16" x2={SIZE / 2} y2={SIZE - 16}
            stroke="rgba(26,24,20,0.06)" strokeWidth="1" strokeDasharray="5 4" />
          <line x1="16" y1={SIZE / 2} x2={SIZE - 16} y2={SIZE / 2}
            stroke="rgba(26,24,20,0.06)" strokeWidth="1" strokeDasharray="5 4" />
          <rect x="16" y="16" width={SIZE - 32} height={SIZE - 32}
            fill="none" stroke="rgba(26,24,20,0.06)" strokeWidth="1" />
        </svg>

        <div ref={containerRef} style={{ width: SIZE, height: SIZE }} />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Stroke counter */}
      <div className="flex gap-2">
        {Array.from({ length: kanji.strokeCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: i < strokesCompleted ? '#C9920A' : '#E0DAD2',
            }}
          />
        ))}
      </div>

      {isComplete && (
        <p className="text-sm font-medium" style={{ color: '#C9920A', fontFamily: 'DM Sans' }}>
          Perfect — moving to free write
        </p>
      )}
    </div>
  )
}
