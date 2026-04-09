'use client'

import { useState } from 'react'
import type { ImageMatchBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: ImageMatchBlock
  onComplete: (xp: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function ImageMatchBlockRenderer({ block, onComplete }: Props) {
  const items = block.items
  const isImageToWord = block.mode === 'image_to_word'

  // Build shuffled options per question once on mount
  const [optionSets] = useState(() =>
    items.map((item) => {
      const others = items.filter((o) => o.id !== item.id)
      const distractors = shuffle(others).slice(0, 3)
      const all = shuffle([item, ...distractors])
      return all.map((o) => ({
        id: o.id,
        label: isImageToWord ? o.word : o.image,
        isCorrect: o.id === item.id,
      }))
    })
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const item = items[currentIndex]
  const options = optionSets[currentIndex]
  const answered = selected !== null

  const handleSelect = (optionId: string, isCorrect: boolean) => {
    if (answered) return
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

  const prompt = isImageToWord ? item.image : item.word

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

      {/* Prompt card */}
      <div className="flex justify-center">
        <div
          className="bg-[#FDFBF8] rounded-[8px] border border-[#E0DAD2] flex items-center justify-center w-48 h-48"
        >
          {isImageToWord ? (
            <span className="text-7xl select-none">{prompt}</span>
          ) : (
            <span
              className="text-5xl font-normal text-[#1A1814]"
              style={{ fontFamily: 'var(--font-jp)' }}
            >
              {prompt}
            </span>
          )}
        </div>
      </div>

      {/* Reading hint */}
      <p className="text-center text-sm text-[#6B6560]" style={{ fontFamily: 'var(--font-ui)' }}>
        {item.romaji} &mdash; {item.english}
      </p>

      {/* 2x2 options grid */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
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
              disabled={answered && opt.id !== selected && !opt.isCorrect}
              className="min-h-[56px]"
            >
              {isImageToWord ? (
                <span style={{ fontFamily: 'var(--font-jp)' }}>{opt.label}</span>
              ) : (
                <span className="text-2xl">{opt.label}</span>
              )}
            </Button>
          )
        })}
      </div>

      {/* Next button */}
      {answered && (
        <Button onClick={handleNext} fullWidth>
          {currentIndex + 1 < items.length ? 'Next' : 'See Results'}
        </Button>
      )}
    </div>
  )
}
