'use client'

import { useState, useCallback } from 'react'
import type { FlashcardBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: FlashcardBlock
  onComplete: (xp: number) => void
}

export function FlashcardBlockRenderer({ block, onComplete }: Props) {
  const [flippedSet, setFlippedSet] = useState<Set<number>>(new Set())
  const [seenSet, setSeenSet] = useState<Set<number>>(new Set())

  const allSeen = seenSet.size >= block.cards.length

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = 0.7
    window.speechSynthesis.speak(u)
  }, [])

  const handleFlip = (i: number) => {
    const isCurrentlyFlipped = flippedSet.has(i)

    const nextFlipped = new Set(flippedSet)
    if (isCurrentlyFlipped) {
      nextFlipped.delete(i)
    } else {
      nextFlipped.add(i)
    }
    setFlippedSet(nextFlipped)

    // Mark seen and play audio on first flip
    if (!seenSet.has(i) && !isCurrentlyFlipped) {
      const nextSeen = new Set(seenSet)
      nextSeen.add(i)
      setSeenSet(nextSeen)
      speak(block.cards[i].word)
    }
  }

  return (
    <div className="page-enter flex flex-col gap-5 py-4">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {block.cards.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              seenSet.has(i) ? 'bg-[#1B4F8A]' : 'bg-[#B8CBE0]'
            }`}
          />
        ))}
      </div>

      {/* Status message */}
      <p
        className="text-sm text-center font-semibold"
        style={{
          fontFamily: 'var(--font-ui)',
          color: allSeen ? '#58CC02' : '#6B7280',
        }}
      >
        {allSeen
          ? 'All cards reviewed!'
          : `Tap all ${block.cards.length} cards to continue`}
      </p>

      {/* 2-column grid — tall cards with full info */}
      <div className="grid grid-cols-2 gap-3">
        {block.cards.map((card, i) => {
          const isFlipped = flippedSet.has(i)
          const isSeen = seenSet.has(i)

          return (
            <div
              key={i}
              className="cursor-pointer"
              style={{ perspective: '800px' }}
              onClick={() => handleFlip(i)}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  minHeight: '220px',
                }}
              >
                {/* ── FRONT — Japanese word ── */}
                <div
                  className="absolute inset-0 rounded-[20px] flex flex-col items-center justify-center p-4"
                  style={{
                    backfaceVisibility: 'hidden',
                    backgroundColor: isSeen && !isFlipped ? '#EBF0F8' : '#ffffff',
                    boxShadow: '0 4px 0 rgba(27,79,138,0.15)',
                    border: isSeen && !isFlipped ? '2px solid #1B4F8A33' : '2px solid #f0f0f0',
                  }}
                >
                  {/* Reading above */}
                  <p className="text-xs mb-1" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>
                    {card.reading}
                  </p>
                  {/* Word */}
                  <p className="text-4xl font-black text-[#1A1A2E] leading-none" style={{ fontFamily: 'Noto Sans JP' }}>
                    {card.word}
                  </p>
                  {/* Romaji */}
                  <p className="text-xs mt-1.5" style={{ fontFamily: 'DM Mono, monospace', color: '#9CA3AF' }}>
                    {card.romaji}
                  </p>
                  {/* JLPT badge */}
                  <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5F9D0] text-[#2D8800] border border-[#89E219]">
                    {card.jlptLevel}
                  </span>
                  {/* Hint */}
                  <p className="text-[10px] mt-2" style={{ color: isSeen ? '#1B4F8A' : '#C0C0C0', fontFamily: 'Nunito' }}>
                    {isSeen && !isFlipped ? 'tap again' : 'tap to reveal'}
                  </p>
                </div>

                {/* ── BACK — English + full details ── */}
                <div
                  className="absolute inset-0 rounded-[20px] flex flex-col items-center justify-between p-4"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    backgroundColor: '#1B4F8A',
                    boxShadow: '0 4px 0 #133970',
                  }}
                >
                  <div className="flex-1 flex flex-col items-center justify-center w-full">
                    {/* Part of speech */}
                    <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold mb-1" style={{ fontFamily: 'Nunito' }}>
                      {card.partOfSpeech}
                    </p>
                    {/* English */}
                    <p className="text-xl font-black text-white text-center leading-tight" style={{ fontFamily: 'Nunito' }}>
                      {card.english}
                    </p>
                    {/* Example sentence */}
                    {card.exampleJP && (
                      <div className="mt-2 bg-white/10 rounded-[10px] px-2.5 py-1.5 w-full">
                        <p className="text-[11px] text-blue-100 text-center" style={{ fontFamily: 'Noto Sans JP' }}>
                          {card.exampleJP}
                        </p>
                        <p className="text-[10px] text-blue-200/70 text-center mt-0.5" style={{ fontFamily: 'Nunito' }}>
                          {card.exampleEN}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Memory hook */}
                  {card.memoryHook && (
                    <p className="text-[10px] text-blue-200/80 italic text-center mt-2 leading-snug" style={{ fontFamily: 'Nunito' }}>
                      💡 {card.memoryHook}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Continue button */}
      {allSeen && (
        <div className="page-enter">
          <Button onClick={() => onComplete(block.xpReward)} fullWidth>
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}

export default FlashcardBlockRenderer
