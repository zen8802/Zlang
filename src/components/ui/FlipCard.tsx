'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface FlipCardProps {
  /** Primary word displayed on the front */
  word: string
  /** Furigana / reading above the word (optional) */
  reading?: string
  /** Translation / meaning shown on the back */
  meaning: string
  /** Example sentence shown on the back */
  exampleSentence?: string
  /** Translation of the example sentence */
  exampleTranslation?: string
  /** Color theme for the word */
  wordColor?: 'jp' | 'en' | 'accent'
  /** Callback when a confidence rating is selected (1 = hard, 2 = okay, 3 = easy) */
  onRate?: (confidence: number) => void
  className?: string
}

const wordColorMap: Record<string, string> = {
  jp: 'text-accent-jp',
  en: 'text-accent-en',
  accent: 'text-accent',
}

const ratingLabels = [
  { value: 1, label: 'Hard', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/20' },
  { value: 2, label: 'Okay', color: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/20' },
  { value: 3, label: 'Easy', color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/20' },
]

export default function FlipCard({
  word,
  reading,
  meaning,
  exampleSentence,
  exampleTranslation,
  wordColor = 'jp',
  onRate,
  className = '',
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleFlip()
      }
    },
    [handleFlip],
  )

  const handleRate = useCallback(
    (confidence: number) => {
      onRate?.(confidence)
    },
    [onRate],
  )

  return (
    <div
      className={`perspective-[1200px] w-full max-w-md mx-auto ${className}`}
      style={{ perspective: '1200px' }}
    >
      <motion.div
        className="relative w-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={isFlipped ? 'Flip card to front' : 'Flip card to back'}
      >
        {/* ---- Front face ---- */}
        <div
          className="glass-card p-8 min-h-[260px] flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {reading && (
            <span className="text-sm text-foreground/50 font-jp mb-1 tracking-wider">
              {reading}
            </span>
          )}
          <span
            className={`text-4xl font-bold font-jp leading-snug ${wordColorMap[wordColor]}`}
          >
            {word}
          </span>
          <span className="mt-6 text-xs text-foreground/30 uppercase tracking-widest">
            Tap to reveal
          </span>
        </div>

        {/* ---- Back face ---- */}
        <div
          className="glass-card p-8 min-h-[260px] flex flex-col items-center justify-center text-center absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-2xl font-semibold text-foreground mb-3">
            {meaning}
          </span>

          {exampleSentence && (
            <p className={`text-base font-jp ${wordColorMap[wordColor]} mb-1`}>
              {exampleSentence}
            </p>
          )}

          {exampleTranslation && (
            <p className="text-sm text-foreground/50 mb-4">{exampleTranslation}</p>
          )}

          {/* Confidence rating buttons */}
          {onRate && (
            <div
              className="flex gap-2 mt-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {ratingLabels.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handleRate(value)}
                  className={[
                    'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                    color,
                  ].join(' ')}
                  aria-label={`Rate as ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {!onRate && (
            <span className="mt-4 text-xs text-foreground/30 uppercase tracking-widest">
              Tap to flip back
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}
