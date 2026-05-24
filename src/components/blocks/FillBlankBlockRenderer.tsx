'use client'

import { useState } from 'react'
import { SpeakerHigh } from '@phosphor-icons/react'
import type { FillBlankBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: FillBlankBlock
  onComplete: (xp: number) => void
}

function playAudio(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = 0.8
    speechSynthesis.speak(u)
  }
}

export default function FillBlankBlockRenderer({ block, onComplete }: Props) {
  const [sIndex, setSIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [completedChars, setCompletedChars] = useState<string[]>([])
  const [allDone, setAllDone] = useState(false)

  const sentence = block.sentences[sIndex]
  const answerChars = sentence.answer.split('')
  const currentChar = answerChars[charIndex]
  const isLastChar = charIndex >= answerChars.length - 1
  const isLastSentence = sIndex >= block.sentences.length - 1

  const handleCharSuccess = () => {
    const newCompleted = [...completedChars, currentChar]
    setCompletedChars(newCompleted)

    if (isLastChar) {
      // All characters for this sentence done
      playAudio(sentence.answer)
      setAllDone(true)
    } else {
      // Next character
      setCharIndex(charIndex + 1)
    }
  }

  const handleCharSkip = () => {
    const newCompleted = [...completedChars, currentChar]
    setCompletedChars(newCompleted)

    if (isLastChar) {
      playAudio(sentence.answer)
      setAllDone(true)
    } else {
      setCharIndex(charIndex + 1)
    }
  }

  const handleNext = () => {
    if (!isLastSentence) {
      setSIndex(sIndex + 1)
      setCharIndex(0)
      setCompletedChars([])
      setAllDone(false)
    } else {
      onComplete(block.xpReward)
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1.5 justify-center">
        {block.sentences.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i < sIndex ? 'bg-[#3D6B4F] w-4' : i === sIndex ? 'bg-[#1B4F8A] w-6' : 'bg-[#E0DAD2] w-4'}`} />
        ))}
      </div>

      <p className="text-center text-sm font-semibold text-[#9E9892]">
        Write the missing word{answerChars.length > 1 ? ` (${charIndex + 1} of ${answerChars.length})` : ''}
      </p>

      {/* Sentence with blank */}
      <div className="bg-[#FDFBF8] rounded-[8px] p-5 border border-[#E0DAD2] text-center">
        <p className="text-xl leading-relaxed font-normal" style={{ fontFamily: 'Noto Sans JP' }}>
          {sentence.before}
          <span className={`inline-flex items-center mx-1 gap-0.5 ${allDone ? '' : ''}`}>
            {answerChars.map((c, i) => (
              <span key={i} className={`inline-block w-8 text-center border-b-2 font-semibold text-lg ${
                i < completedChars.length
                  ? 'border-[#B8D4C0] text-[#3D6B4F]'
                  : i === charIndex && !allDone
                    ? 'border-[#1B4F8A] text-[#1B4F8A]'
                    : 'border-[#E0DAD2] text-[#E0DAD2]'
              }`} style={{ fontFamily: 'Noto Sans JP' }}>
                {i < completedChars.length ? completedChars[i] : '＿'}
              </span>
            ))}
          </span>
          {sentence.after}
        </p>

        {!allDone && sentence.hint && (
          <p className="text-xs text-[#9E9892] mt-2">💡 {sentence.hint}</p>
        )}
      </div>

      {/* Tap to reveal each character */}
      {!allDone && currentChar && (
        <div className="text-center py-6">
          <p className="text-sm text-[#6B6560] mb-3">Tap to reveal the next character</p>
          <button
            onClick={handleCharSuccess}
            className="w-20 h-20 rounded-[12px] bg-[#EBF0F8] border-2 border-[#1B4F8A] flex items-center justify-center mx-auto hover:bg-[#D6E3F5] transition-colors"
          >
            <span className="text-3xl text-[#1B4F8A]" style={{ fontFamily: 'Noto Sans JP' }}>?</span>
          </button>
          <button
            onClick={handleCharSkip}
            className="mt-3 text-xs text-[#9E9892] underline"
          >
            Skip
          </button>
        </div>
      )}

      {/* Completion feedback */}
      {allDone && (
        <>
          <div className="rounded-[8px] p-4 bg-[#EFF5F0] border border-[#B8D4C0] page-enter">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-[#3D6B4F]">Correct!</p>
                <p className="text-3xl font-normal text-[#3D6B4F]" style={{ fontFamily: 'Noto Sans JP' }}>{sentence.answer}</p>
              </div>
              <button onClick={() => playAudio(sentence.answer)} aria-label="Play audio" className="ml-auto w-9 h-9 rounded-full bg-[#FDFBF8] flex items-center justify-center text-[#3D6B4F]"><SpeakerHigh size={16} weight="regular" /></button>
            </div>
            {sentence.explanation && (
              <p className="text-sm text-[#3D6B4F]">{sentence.explanation}</p>
            )}
          </div>

          <Button variant="correct" size="lg" fullWidth onClick={handleNext}>
            {!isLastSentence ? 'Next →' : `Done +${block.xpReward} XP`}
          </Button>
        </>
      )}
    </div>
  )
}

export { FillBlankBlockRenderer }
