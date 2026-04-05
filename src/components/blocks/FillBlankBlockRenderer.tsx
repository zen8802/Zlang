'use client'

import { useState } from 'react'
import type { FillBlankBlock } from '@/types/lesson-blocks'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  block: FillBlankBlock
  onComplete: (xp: number) => void
}

export default function FillBlankBlockRenderer({ block, onComplete }: Props) {
  const [sIndex, setSIndex] = useState(0)
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [, setScore] = useState(0)

  const sentence = block.sentences[sIndex]

  const handleCheck = () => {
    const correct = input.trim().toLowerCase() === sentence.answer.toLowerCase()
    setIsCorrect(correct)
    setChecked(true)
    if (correct) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (sIndex + 1 < block.sentences.length) {
      setInput('')
      setChecked(false)
      setIsCorrect(false)
      setSIndex(sIndex + 1)
    } else {
      onComplete(block.xpReward)
    }
  }

  return (
    <div className="page-enter flex flex-col gap-5 py-4">
      {/* Progress */}
      <p className="text-center text-sm text-[#6B7280] font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
        {sIndex + 1} / {block.sentences.length}
      </p>

      <Card variant="elevated">
        {/* Sentence with blank */}
        <p className="text-xl leading-relaxed" style={{ fontFamily: 'var(--font-jp)' }}>
          {sentence.before}
          <span className="inline-block mx-1 border-b-2 border-dashed border-[#1B4F8A] min-w-[80px] text-center">
            {checked ? (
              <span className={isCorrect ? 'text-[#58CC02] font-bold' : 'text-[#FF4B4B] font-bold'}>
                {isCorrect ? input : sentence.answer}
              </span>
            ) : (
              <span className="text-[#9CA3AF]">???</span>
            )}
          </span>
          {sentence.after}
        </p>

        {/* Hint */}
        {!checked && sentence.hint && (
          <p className="text-sm text-[#9CA3AF] mt-2" style={{ fontFamily: 'var(--font-ui)' }}>
            Hint: {sentence.hint}
          </p>
        )}
      </Card>

      {/* Input */}
      {!checked && (
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && handleCheck()}
            placeholder="Type your answer..."
            className="flex-1 px-4 py-3 rounded-[16px] border-2 border-[#B8CBE0] bg-white text-[#1A1A2E] text-lg focus:outline-none focus:border-[#1B4F8A] transition-colors"
            style={{ fontFamily: 'var(--font-jp)' }}
          />
          <Button onClick={handleCheck} disabled={!input.trim()}>
            Check
          </Button>
        </div>
      )}

      {/* Feedback */}
      {checked && (
        <div
          className={`rounded-[16px] p-4 page-enter ${
            isCorrect ? 'bg-[#E5F9D0]' : 'bg-[#FFE5E5]'
          }`}
        >
          <p
            className={`text-sm font-bold ${isCorrect ? 'text-[#2D8800]' : 'text-[#CC0000]'}`}
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {isCorrect ? 'Correct!' : `The answer was: ${sentence.answer}`}
          </p>
          {sentence.explanation && (
            <p className="text-sm text-[#6B7280] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
              {sentence.explanation}
            </p>
          )}
        </div>
      )}

      {/* Next */}
      {checked && (
        <Button onClick={handleNext} fullWidth>
          {sIndex + 1 < block.sentences.length ? 'Next' : 'Continue'}
        </Button>
      )}
    </div>
  )
}
