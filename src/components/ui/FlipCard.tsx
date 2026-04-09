'use client'

import { useState } from 'react'

interface FlipCardProps {
  word: string
  reading?: string
  meaning: string
  exampleSentence?: string
  exampleTranslation?: string
  front?: string
  frontSub?: string
  back?: string
  backSub?: string
  wordColor?: string
  onRate?: (confidence: 1 | 2 | 3) => void
  onConfidence?: (level: 1 | 2 | 3) => void
}

export default function FlipCard({
  word,
  reading,
  meaning,
  exampleSentence,
  exampleTranslation,
  front,
  back,
  onRate,
  onConfidence,
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  const rateHandler = onRate || onConfidence

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="bg-[#FDFBF8] rounded-[8px] min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-transform duration-[600ms] border border-[#E0DAD2] shadow-[0_1px_4px_rgba(26,24,20,0.06)]"
    >
      {!flipped ? (
        <div className="p-6">
          {reading && (
            <p className="text-sm mb-1" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>
              {reading}
            </p>
          )}
          <p className="text-4xl font-normal" style={{ fontFamily: 'Noto Sans JP', color: '#1A1A2E' }}>
            {front || word}
          </p>
          <p className="text-xs mt-6" style={{ color: '#9CA3AF' }}>
            Tap to reveal
          </p>
        </div>
      ) : (
        <div className="p-6 w-full">
          <p className="text-2xl font-semibold mb-3" style={{ color: '#1A1A2E' }}>
            {back || meaning}
          </p>
          {exampleSentence && (
            <div className="rounded-[6px] p-3 mb-2" style={{ backgroundColor: '#EBF0F8' }}>
              <p className="text-sm" style={{ fontFamily: 'Noto Sans JP', color: '#6B7280' }}>
                {exampleSentence}
              </p>
            </div>
          )}
          {exampleTranslation && (
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              {exampleTranslation}
            </p>
          )}
          {rateHandler && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); rateHandler(1) }}
                className="py-2 rounded-[6px] text-sm font-semibold bg-[#F5EEEE] text-[#8B3A3A] border border-[#D4BABA] hover:bg-[#EDE4E4] active:translate-y-px transition-all"
              >
                Hard
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); rateHandler(2) }}
                className="py-2 rounded-[6px] text-sm font-semibold bg-[#F5F0E8] text-[#7A5C2E] border border-[#D4C4A8] hover:bg-[#EDE8DC] active:translate-y-px transition-all"
              >
                Okay
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); rateHandler(3) }}
                className="py-2 rounded-[6px] text-sm font-semibold bg-[#EFF5F0] text-[#3D6B4F] border border-[#B8D4C0] hover:bg-[#E0EDE4] active:translate-y-px transition-all"
              >
                Easy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
