'use client'

import { useEffect, useState } from 'react'
import { renderFurigana } from '@/components/japanese/FuriganaText'

interface Question {
  id?: string
  wordJP: string
  wordReading?: string
  correctAnswer: string
  options: string[]
}

interface Block {
  title?: string
  questions: Question[]
}

interface Props {
  block: Block
  onComplete: (xp: number) => void
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const stripped = (text || '').replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
  const u = new SpeechSynthesisUtterance(stripped)
  u.lang = 'ja-JP'
  u.rate = 0.7
  window.speechSynthesis.speak(u)
}

export default function RecognitionQuizBlockRenderer({ block, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [shuffled, setShuffled] = useState<string[]>([])

  const question = block.questions?.[index]
  const total = block.questions?.length || 0
  const isLast = index >= total - 1

  // Shuffle options + auto-play audio each time the question changes
  useEffect(() => {
    if (!question) return
    setSelected(null)
    setRevealed(false)
    setShuffled([...(question.options || [])].sort(() => Math.random() - 0.5))
    const t = setTimeout(() => speak(question.wordJP), 350)
    return () => clearTimeout(t)
  }, [index, question])

  if (!question) return null

  const handleSelect = (option: string) => {
    if (revealed) return
    setSelected(option)
    setRevealed(true)
    if (option === question.correctAnswer) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (isLast) onComplete(score * 5)
    else setIndex((i) => i + 1)
  }

  return (
    <div className="space-y-5 py-2">
      <div>
        <h2 style={{ fontFamily: 'Shippori Mincho', fontSize: '22px', color: '#1A1814' }}>
          {block.title || 'Do you know them?'}
        </h2>
        <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#9E9892', marginTop: '4px' }}>
          {index + 1} of {total}
        </p>
      </div>

      {/* Audio word display */}
      <div
        className="flex flex-col items-center py-8 rounded-[16px]"
        style={{ backgroundColor: '#FDFBF8', border: '1.5px solid #E0DAD2' }}
      >
        <button
          onClick={() => speak(question.wordJP)}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 border-[#E0DAD2] hover:border-[#1B4F8A]/30 transition-colors mb-4"
          aria-label="Play word"
        >
          🔊
        </button>
        <p style={{ fontFamily: 'Noto Sans JP', fontSize: '32px', color: '#1A1814', fontWeight: 300 }}>
          {renderFurigana(question.wordJP, '0.4em')}
        </p>
        {question.wordReading && (
          <p style={{ fontFamily: 'DM Mono', fontSize: '12px', color: '#9E9892', marginTop: '4px' }}>
            {question.wordReading}
          </p>
        )}
        <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#C8C3BC', marginTop: '8px' }}>
          What does this mean?
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {shuffled.map((option, i) => {
          const isCorrect = option === question.correctAnswer
          const isSelected = option === selected

          let bg = '#FDFBF8'
          let border = '#E0DAD2'
          let color = '#1A1814'

          if (revealed) {
            if (isCorrect) {
              bg = '#EFF5F0'
              border = '#3D6B4F'
              color = '#3D6B4F'
            } else if (isSelected) {
              bg = '#F5EEEE'
              border = '#8B3A3A'
              color = '#8B3A3A'
            } else {
              color = '#C8C3BC'
            }
          } else if (isSelected) {
            bg = '#EBF0F8'
            border = '#1B4F8A'
            color = '#1B4F8A'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={revealed}
              className="w-full text-left px-5 py-4 rounded-[10px] border-2 font-medium text-sm transition-all disabled:cursor-default active:translate-y-px"
              style={{ backgroundColor: bg, borderColor: border, color, fontFamily: 'DM Sans' }}
            >
              {option}
              {revealed && isCorrect && <span className="float-right">✓</span>}
              {revealed && isSelected && !isCorrect && <span className="float-right">✗</span>}
            </button>
          )
        })}
      </div>

      {revealed && (
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-[10px] text-sm font-medium text-white transition-all active:translate-y-px"
          style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans' }}
        >
          {isLast ? 'Almost done →' : 'Next word →'}
        </button>
      )}
    </div>
  )
}
