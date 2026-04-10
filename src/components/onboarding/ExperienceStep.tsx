'use client'

import { useRef, useCallback } from 'react'
import Button from '@/components/ui/Button'

interface Props {
  value: number
  onChange: (v: number) => void
  onContinue: () => void
  onBack: () => void
}

const LEVELS: Record<
  number,
  {
    title: string
    description: string
    example: string
    exampleEN: string
  }
> = {
  1: {
    title: 'Absolute beginner',
    description: 'I have never studied Japanese. I know nothing.',
    example: 'すし',
    exampleEN: 'I know "sushi" — that\'s about it',
  },
  2: {
    title: 'Complete beginner',
    description: 'I know a handful of words from anime or food.',
    example: 'ありがとう',
    exampleEN: 'I know "arigatou" and "kawaii"',
  },
  3: {
    title: 'Early beginner',
    description: "I've done some study. I know basic greetings.",
    example: 'はじめまして',
    exampleEN: 'I can introduce myself, barely',
  },
  4: {
    title: 'Beginner',
    description: 'I know hiragana and some katakana. Simple sentences.',
    example: 'これをください',
    exampleEN: '"Please give me this" — survival phrases',
  },
  5: {
    title: 'Elementary',
    description: 'I can have short conversations about daily topics.',
    example: 'どこから来ましたか？',
    exampleEN: 'I can ask and answer basic questions',
  },
  6: {
    title: 'Pre-intermediate',
    description: 'I understand most basic situations. Grammar is shaky.',
    example: '電車はどこですか？',
    exampleEN: 'I can navigate most daily situations',
  },
  7: {
    title: 'Intermediate',
    description: 'I can hold a real conversation with patience.',
    example: '少し待っていただけますか？',
    exampleEN: 'Polite requests and past tense — comfortable',
  },
  8: {
    title: 'Upper intermediate',
    description: 'I can discuss most topics, read most signs.',
    example: '最近、忙しくてなかなか練習できていません',
    exampleEN: 'Complex sentences, most kanji — manageable',
  },
  9: {
    title: 'Advanced',
    description: 'Native-speed conversations. Occasional gaps.',
    example: 'おかげさまで、だいぶ上達しました',
    exampleEN: 'Near-fluent. Nuance is the remaining challenge',
  },
  10: {
    title: 'Near-native',
    description: 'I can read novels, watch unsubbed TV, pass JLPT N1.',
    example: '語彙力はまだまだ伸びる余地があります',
    exampleEN: 'Native content is accessible',
  },
}

export function ExperienceStep({ value, onChange, onContinue, onBack }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const level = LEVELS[value]
  const fillPercent = ((value - 1) / 9) * 100

  const getValueFromX = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track) return value
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(ratio * 9) + 1
  }, [value])

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    onChange(getValueFromX(e.clientX))
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    onChange(getValueFromX(e.clientX))
  }

  const handlePointerUp = () => {
    isDragging.current = false
  }

  return (
    <div className="flex flex-col flex-1 max-w-sm mx-auto w-full">
      {/* Question */}
      <div className="mb-10">
        <h1
          className="text-[#1A1814] mb-3"
          style={{
            fontFamily: 'Shippori Mincho, serif',
            fontSize: '28px',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          How much Japanese do you know?
        </h1>
        <p
          className="text-[#9E9892] text-sm"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Be honest. We&apos;ll verify and adjust as you go.
        </p>
      </div>

      <div className="flex-1 space-y-8">
        {/* Current level display */}
        <div className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] p-6 text-center transition-all duration-200">
          {/* Level number */}
          <div className="flex items-baseline justify-center gap-2 mb-3">
            <span
              className="text-[#1B4F8A]"
              style={{
                fontFamily: 'Shippori Mincho, serif',
                fontSize: '72px',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {value}
            </span>
            <span
              className="text-[#C8C3BC]"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '24px',
              }}
            >
              / 10
            </span>
          </div>

          <p
            className="text-[#1A1814] font-semibold text-lg mb-1"
            style={{ fontFamily: 'Shippori Mincho, serif' }}
          >
            {level.title}
          </p>
          <p
            className="text-[#6B6560] text-sm mb-5"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {level.description}
          </p>

          {/* Example phrase */}
          <div className="border-t border-[#E0DAD2] pt-4">
            <p
              className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-2"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              At this level you can say
            </p>
            <p
              className="text-xl text-[#1A1814] mb-1"
              style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 400 }}
            >
              {level.example}
            </p>
            <p
              className="text-xs text-[#9E9892] italic"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {level.exampleEN}
            </p>
          </div>
        </div>

        {/* Custom slider */}
        <div className="px-1">
          <div
            ref={trackRef}
            className="relative h-12 flex items-center cursor-pointer touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Background track */}
            <div
              className="absolute left-0 right-0 h-1.5 rounded-full"
              style={{ backgroundColor: '#E0DAD2' }}
            />

            {/* Filled track */}
            <div
              className="absolute left-0 h-1.5 rounded-full transition-all duration-100"
              style={{
                width: `${fillPercent}%`,
                backgroundColor: '#1B4F8A',
              }}
            />

            {/* Step dots */}
            {Array.from({ length: 10 }, (_, i) => {
              const pos = (i / 9) * 100
              const isActive = i + 1 <= value
              const isCurrent = i + 1 === value
              return (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full transition-all duration-100"
                  style={{
                    left: `${pos}%`,
                    backgroundColor: isActive ? '#1B4F8A' : '#C8C3BC',
                    transform: `translateX(-50%) scale(${isCurrent ? 1.5 : 1})`,
                  }}
                />
              )
            })}

            {/* Thumb */}
            <div
              className="absolute -translate-x-1/2 transition-all duration-100 pointer-events-none"
              style={{ left: `${fillPercent}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-[#1B4F8A] border-2 border-white shadow-[0_2px_8px_rgba(27,79,138,0.3)] flex items-center justify-center">
                <span
                  className="text-white font-semibold"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                  }}
                >
                  {value}
                </span>
              </div>
            </div>
          </div>

          {/* Scale labels */}
          <div className="flex justify-between px-0 mt-1">
            <span
              className="text-[10px] text-[#9E9892]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Never studied
            </span>
            <span
              className="text-[10px] text-[#9E9892]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Near-native
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-8 pb-10 space-y-3">
        <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
          Start learning →
        </Button>
        <button
          onClick={onBack}
          className="w-full text-center text-sm text-[#9E9892] hover:text-[#6B6560] transition-colors py-1"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
