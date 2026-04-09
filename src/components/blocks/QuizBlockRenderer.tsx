'use client'

import { useState } from 'react'
import type { QuizBlock } from '@/types/lesson-blocks'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  block: QuizBlock
  onComplete: (xp: number) => void
}

export default function QuizBlockRenderer({ block, onComplete }: Props) {
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const question = block.questions[qIndex]
  const answered = selected !== null

  const handleSelect = (optionIndex: number) => {
    if (answered) return
    setSelected(optionIndex)
    if (question.options[optionIndex].isCorrect) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = () => {
    if (qIndex + 1 < block.questions.length) {
      setSelected(null)
      setQIndex(qIndex + 1)
    } else {
      setDone(true)
    }
  }

  if (done) {
    const total = block.questions.length
    const pct = Math.round((score / total) * 100)
    return (
      <div className="page-enter flex flex-col items-center gap-6 py-8">
        <div className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
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
        {block.questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < qIndex
                ? 'bg-[#3D6B4F]'
                : i === qIndex
                ? 'bg-[#1B4F8A] scale-125'
                : 'bg-[#B8CBE0]'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <Card variant="elevated">
        <p className="text-lg font-semibold text-[#1A1814]" style={{ fontFamily: 'var(--font-ui)' }}>
          {question.prompt}
        </p>
      </Card>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((opt, i) => {
          let variant: 'secondary' | 'correct' | 'wrong' = 'secondary'
          if (answered) {
            if (opt.isCorrect) variant = 'correct'
            else if (i === selected) variant = 'wrong'
          }

          return (
            <Button
              key={i}
              variant={variant}
              fullWidth
              onClick={() => handleSelect(i)}
              disabled={answered && i !== selected && !opt.isCorrect}
            >
              {opt.text}
            </Button>
          )
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div className="bg-[#EBF0F8] rounded-[8px] p-4 page-enter">
          <p className="text-sm font-semibold text-[#1B4F8A]" style={{ fontFamily: 'var(--font-ui)' }}>
            {question.explanation}
          </p>
        </div>
      )}

      {/* Next */}
      {answered && (
        <Button onClick={handleNext} fullWidth>
          {qIndex + 1 < block.questions.length ? 'Next' : 'See Results'}
        </Button>
      )}
    </div>
  )
}
