'use client'

import { useState } from 'react'
import type { FlashcardBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type Confidence = 'hard' | 'okay' | 'easy'

interface Props {
  block: FlashcardBlock
  onComplete: (xp: number) => void
}

export default function FlashcardBlockRenderer({ block, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Map<number, Confidence>>(new Map())
  const [done, setDone] = useState(false)

  const card = block.cards[index]

  const handleConfidence = (level: Confidence) => {
    const next = new Map(results)
    next.set(index, level)
    setResults(next)

    if (index + 1 < block.cards.length) {
      setFlipped(false)
      setIndex(index + 1)
    } else {
      setDone(true)
    }
  }

  const counts = {
    hard: Array.from(results.values()).filter((v) => v === 'hard').length,
    okay: Array.from(results.values()).filter((v) => v === 'okay').length,
    easy: Array.from(results.values()).filter((v) => v === 'easy').length,
  }

  if (done) {
    return (
      <div className="page-enter flex flex-col items-center gap-6 py-8">
        <div className="text-4xl bounce-in">&#127881;</div>
        <h2 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-ui)' }}>
          Cards Complete!
        </h2>

        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-[#FF4B4B]">{counts.hard}</span>
            <span className="text-sm text-[#6B7280]">Hard</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-[#FFB800]">{counts.okay}</span>
            <span className="text-sm text-[#6B7280]">Okay</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-[#58CC02]">{counts.easy}</span>
            <span className="text-sm text-[#6B7280]">Easy</span>
          </div>
        </div>

        <Button onClick={() => onComplete(block.xpReward)} fullWidth>
          Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col items-center gap-6 py-4">
      {/* Progress indicator */}
      <p className="text-sm text-[#6B7280] font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
        {index + 1} / {block.cards.length}
      </p>

      {/* Flip card */}
      <div
        className="w-full max-w-sm cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '320px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white rounded-[24px] shadow-[0_8px_0_rgba(27,79,138,0.15)] flex flex-col items-center justify-center p-6 gap-3"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-sm text-[#6B7280]" style={{ fontFamily: 'var(--font-jp)' }}>
              {card.reading}
            </p>
            <p className="text-5xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-jp)' }}>
              {card.word}
            </p>
            <p className="text-base text-[#9CA3AF]" style={{ fontFamily: 'var(--font-ui)' }}>
              {card.romaji}
            </p>
            <Badge color="blue" size="sm">{card.jlptLevel}</Badge>
            <p className="text-xs text-[#9CA3AF] mt-4" style={{ fontFamily: 'var(--font-ui)' }}>
              Tap to flip
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-white rounded-[24px] shadow-[0_8px_0_rgba(27,79,138,0.15)] flex flex-col items-center justify-center p-6 gap-4"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <Badge color="gray" size="sm">{card.partOfSpeech}</Badge>
            <p className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-ui)' }}>
              {card.english}
            </p>

            {/* Example sentence */}
            <div className="w-full bg-[#EBF0F8] rounded-[16px] p-4 text-left">
              <p className="text-sm font-semibold text-[#1B4F8A]" style={{ fontFamily: 'var(--font-jp)' }}>
                {card.exampleJP}
              </p>
              <p className="text-xs text-[#6B7280] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
                {card.exampleEN}
              </p>
            </div>

            {/* Memory hook */}
            {card.memoryHook && (
              <p className="text-sm text-[#6B7280] italic text-center" style={{ fontFamily: 'var(--font-ui)' }}>
                {card.memoryHook}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confidence buttons (visible when flipped) */}
      {flipped && (
        <div className="flex gap-3 w-full max-w-sm page-enter">
          <Button variant="wrong" size="sm" fullWidth onClick={() => handleConfidence('hard')}>
            Hard
          </Button>
          <Button variant="gold" size="sm" fullWidth onClick={() => handleConfidence('okay')}>
            Okay
          </Button>
          <Button variant="correct" size="sm" fullWidth onClick={() => handleConfidence('easy')}>
            Easy
          </Button>
        </div>
      )}
    </div>
  )
}
