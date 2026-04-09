'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AudioMatchBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: AudioMatchBlock
  onComplete: (xp: number) => void
}

export function AudioMatchBlockRenderer({ block, onComplete }: Props) {
  const items = block.items
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [played, setPlayed] = useState(false)

  const item = items[currentIndex]
  const answered = selected !== null

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }, [])

  // Auto-play audio when question changes
  useEffect(() => {
    setPlayed(false)
    const timer = setTimeout(() => {
      speak(item.word)
      setPlayed(true)
    }, 400)
    return () => {
      clearTimeout(timer)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [currentIndex, item.word, speak])

  const handleReplay = () => {
    speak(item.word)
    setPlayed(true)
  }

  const handleSelect = (optionId: string, isCorrect: boolean) => {
    if (answered || !played) return
    setSelected(optionId)
    if (isCorrect) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (currentIndex + 1 < items.length) {
      setSelected(null)
      setCurrentIndex(currentIndex + 1)
    } else {
      setDone(true)
    }
  }

  if (done) {
    const total = items.length
    const pct = Math.round((score / total) * 100)
    return (
      <div className="page-enter flex flex-col items-center gap-6 py-8">
        <div className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-semibold text-[#1A1814]" style={{ fontFamily: 'var(--font-ui)' }}>
          {score} / {total} Correct
        </h2>
        <p className="text-[#6B6560]" style={{ fontFamily: 'var(--font-ui)' }}>
          {pct}% accuracy
        </p>
        <Button onClick={() => onComplete(block.xpReward)} fullWidth>
          Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col gap-5 py-4">
      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {items.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentIndex
                ? 'bg-[#3D6B4F]'
                : i === currentIndex
                ? 'bg-[#1B4F8A] scale-125'
                : 'bg-[#B8CBE0]'
            }`}
          />
        ))}
      </div>

      {/* Instruction */}
      <p className="text-center text-sm font-semibold text-[#6B6560]" style={{ fontFamily: 'var(--font-ui)' }}>
        {block.instruction}
      </p>

      {/* Audio play button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleReplay}
          className="bg-[#1B4F8A] text-white rounded-full w-28 h-28 flex items-center justify-center hover:brightness-110 active:translate-y-px transition-all duration-100 cursor-pointer select-none"
        >
          <span className="text-5xl">🔊</span>
        </button>
      </div>

      {/* Image hint if available */}
      {item.image && (
        <div className="text-center text-4xl">{item.image}</div>
      )}

      {/* Options (disabled until audio played) */}
      <div className="flex flex-col gap-3">
        {item.options.map((opt) => {
          let variant: 'secondary' | 'correct' | 'wrong' = 'secondary'
          if (answered) {
            if (opt.isCorrect) variant = 'correct'
            else if (opt.id === selected) variant = 'wrong'
          }

          return (
            <Button
              key={opt.id}
              variant={variant}
              fullWidth
              onClick={() => handleSelect(opt.id, opt.isCorrect)}
              disabled={!played || (answered && opt.id !== selected && !opt.isCorrect)}
            >
              <span style={{ fontFamily: 'var(--font-ui)' }}>{opt.text}</span>
            </Button>
          )
        })}
      </div>

      {/* Reveal word after answering */}
      {answered && (
        <div className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[8px] p-4 page-enter text-center">
          <p className="text-2xl font-normal text-[#1A1814]" style={{ fontFamily: 'var(--font-jp)' }}>
            {item.word}
          </p>
          <p className="text-sm text-[#6B6560]" style={{ fontFamily: 'var(--font-ui)' }}>
            {item.reading} &middot; {item.romaji} &middot; {item.english}
          </p>
        </div>
      )}

      {/* Next */}
      {answered && (
        <Button onClick={handleNext} fullWidth>
          {currentIndex + 1 < items.length ? 'Next' : 'See Results'}
        </Button>
      )}
    </div>
  )
}
