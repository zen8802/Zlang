'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { FillBlankBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: FillBlankBlock
  onComplete: (xp: number) => void
}

let HanziWriter: any = null

function playAudio(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = 0.8
    speechSynthesis.speak(u)
  }
}

// ── Single character quiz box ─────────────────────────────────
function CharBox({
  char,
  index,
  isActive,
  isComplete,
  onComplete: onCharComplete,
}: {
  char: string
  index: number
  isActive: boolean
  isComplete: boolean
  onComplete: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [mistakes, setMistakes] = useState(0)

  const initQuiz = useCallback(() => {
    if (!HanziWriter || !containerRef.current) return

    writerRef.current = null
    containerRef.current.innerHTML = ''

    try {
      writerRef.current = HanziWriter.create(containerRef.current, char, {
        width: 80,
        height: 80,
        padding: 5,
        showOutline: true,
        showCharacter: false,
        strokeColor: '#1A1A2E',
        outlineColor: '#D1D5DB',
        highlightColor: '#1B4F8A',
        drawingColor: '#1B4F8A',
        drawingWidth: 4,
        charDataLoader: (c: string, onLoad: any) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(c)}.json`)
            .then(r => r.json())
            .then(onLoad)
            .catch(() => {
              // Character not in hanzi-writer-data — show as complete
              setReady(true)
              onCharComplete()
            })
        },
        onLoadCharDataSuccess: () => {
          setReady(true)
        },
      })
    } catch {
      setReady(true)
      onCharComplete()
    }
  }, [char, onCharComplete])

  // Load HanziWriter
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (HanziWriter) {
      initQuiz()
    } else {
      import('hanzi-writer').then(mod => {
        HanziWriter = mod.default || mod
        initQuiz()
      }).catch(() => {
        setReady(true)
        onCharComplete()
      })
    }
  }, [initQuiz])

  // Start quiz when this box becomes active
  useEffect(() => {
    if (!isActive || !ready || !writerRef.current || isComplete) return

    writerRef.current.quiz({
      showHintAfterMisses: 2,
      leniency: 0.7,
      onMistake: (data: any) => {
        setMistakes(data.mistakesOnStroke || 0)
      },
      onCorrectStroke: () => {
        setMistakes(0)
      },
      onComplete: () => {
        writerRef.current?.showCharacter()
        playAudio(char)
        onCharComplete()
      },
    })
  }, [isActive, ready, isComplete, char, onCharComplete])

  return (
    <div className={`relative rounded-[14px] overflow-hidden border-2 transition-all duration-300 ${
      isComplete ? 'border-[#58CC02] bg-[#F0FFF0]' :
      isActive ? 'border-[#1B4F8A] bg-white shadow-[0_4px_0_#133970]' :
      'border-gray-200 bg-gray-50 opacity-60'
    }`} style={{ width: 80, height: 80 }}>
      {/* Grid lines */}
      <svg className="absolute inset-0 pointer-events-none" width={80} height={80}>
        <line x1={40} y1={2} x2={40} y2={78} stroke="#E5E7EB" strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1={2} y1={40} x2={78} y2={40} stroke="#E5E7EB" strokeWidth={0.5} strokeDasharray="3,3" />
      </svg>

      {/* HanziWriter renders here */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading state */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl animate-pulse" style={{ fontFamily: 'Noto Sans JP', color: '#D1D5DB' }}>{char}</span>
        </div>
      )}

      {/* Complete checkmark */}
      {isComplete && (
        <div className="absolute top-0.5 right-0.5">
          <span className="text-xs text-[#58CC02]">✓</span>
        </div>
      )}

      {/* Mistake indicator */}
      {isActive && mistakes > 0 && !isComplete && (
        <div className="absolute bottom-0.5 left-0 right-0 text-center">
          <span className="text-[8px] text-[#FF4B4B] font-bold">{mistakes > 1 ? 'hint coming' : 'try again'}</span>
        </div>
      )}

      {/* Inactive number */}
      {!isActive && !isComplete && !ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-300">{index + 1}</span>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function FillBlankBlockRenderer({ block, onComplete }: Props) {
  const [sIndex, setSIndex] = useState(0)
  const [completedChars, setCompletedChars] = useState<Set<number>>(new Set())
  const [activeCharIndex, setActiveCharIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const sentence = block.sentences[sIndex]
  const answerChars = sentence.answer.split('')

  const handleCharComplete = useCallback((charIdx: number) => {
    setCompletedChars(prev => {
      const next = new Set(prev)
      next.add(charIdx)

      // Check if all chars done
      if (next.size === answerChars.length) {
        setSubmitted(true)
        playAudio(sentence.answer)
      } else {
        // Advance to next incomplete char
        for (let i = 0; i < answerChars.length; i++) {
          if (!next.has(i)) {
            setActiveCharIndex(i)
            break
          }
        }
      }

      return next
    })
  }, [answerChars.length, sentence.answer])

  const handleNext = () => {
    if (sIndex + 1 < block.sentences.length) {
      setSIndex(sIndex + 1)
      setCompletedChars(new Set())
      setActiveCharIndex(0)
      setSubmitted(false)
    } else {
      onComplete(block.xpReward)
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1.5 justify-center">
        {block.sentences.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i < sIndex ? 'bg-[#58CC02] w-4' : i === sIndex ? 'bg-[#1B4F8A] w-6' : 'bg-gray-200 w-4'}`} />
        ))}
      </div>

      <p className="text-center text-sm font-bold text-gray-400" style={{ fontFamily: 'Nunito' }}>
        Write the missing word
      </p>

      {/* Sentence with blank */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_0_rgba(0,0,0,0.06)] border border-gray-100 text-center">
        <p className="text-xl leading-relaxed" style={{ fontFamily: 'Noto Sans JP' }}>
          {sentence.before}
          <span className={`inline-block mx-1 px-3 py-1 rounded-[10px] min-w-[60px] border-b-2 font-black ${
            submitted ? 'bg-[#E5F9D0] border-[#58CC02] text-[#2D8800]' : 'bg-[#EBF0F8] border-[#1B4F8A] text-[#1B4F8A]'
          }`}>
            {submitted ? sentence.answer : answerChars.map((_, i) => completedChars.has(i) ? answerChars[i] : '＿').join('')}
          </span>
          {sentence.after}
        </p>

        {/* Hint */}
        {!submitted && sentence.hint && (
          <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'Nunito' }}>
            💡 {sentence.hint}
          </p>
        )}
      </div>

      {/* Character writing boxes — one per character */}
      {!submitted && (
        <div>
          <p className="text-xs text-center font-bold text-gray-300 mb-2" style={{ fontFamily: 'Nunito' }}>
            ✏️ Write each character ({answerChars.length} character{answerChars.length > 1 ? 's' : ''})
          </p>
          <div className="flex justify-center gap-2">
            {answerChars.map((char, i) => (
              <CharBox
                key={`${sIndex}-${i}-${char}`}
                char={char}
                index={i}
                isActive={activeCharIndex === i && !completedChars.has(i)}
                isComplete={completedChars.has(i)}
                onComplete={() => handleCharComplete(i)}
              />
            ))}
          </div>
          <p className="text-[10px] text-center text-gray-300 mt-2" style={{ fontFamily: 'Nunito' }}>
            {completedChars.size} / {answerChars.length} characters
          </p>
        </div>
      )}

      {/* Feedback */}
      {submitted && (
        <div className="rounded-[16px] p-4 bg-[#E5F9D0] border-2 border-[#89E219] page-enter">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-black text-[#2D8800]" style={{ fontFamily: 'Nunito' }}>Correct!</p>
              <p className="text-3xl font-black text-[#2D8800]" style={{ fontFamily: 'Noto Sans JP' }}>{sentence.answer}</p>
            </div>
            <button onClick={() => playAudio(sentence.answer)} className="ml-auto w-9 h-9 rounded-full bg-white/50 flex items-center justify-center text-[#2D8800]">
              🔊
            </button>
          </div>
          {sentence.explanation && (
            <p className="text-sm text-[#2D8800]" style={{ fontFamily: 'Nunito' }}>{sentence.explanation}</p>
          )}
        </div>
      )}

      {/* Next */}
      {submitted && (
        <Button variant="correct" size="lg" fullWidth onClick={handleNext}>
          {sIndex + 1 < block.sentences.length ? 'Next →' : `Done +${block.xpReward} XP ⚡`}
        </Button>
      )}
    </div>
  )
}

export { FillBlankBlockRenderer }
