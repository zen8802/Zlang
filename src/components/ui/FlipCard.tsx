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
      className="bg-white rounded-[20px] min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 6px 0 rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.04)',
      }}
    >
      {!flipped ? (
        <div className="p-6">
          {reading && (
            <p className="text-sm mb-1" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>
              {reading}
            </p>
          )}
          <p className="text-4xl font-black" style={{ fontFamily: 'Noto Sans JP', color: '#1A1A2E' }}>
            {front || word}
          </p>
          <p className="text-xs mt-6" style={{ color: '#9CA3AF' }}>
            Tap to reveal
          </p>
        </div>
      ) : (
        <div className="p-6 w-full">
          <p className="text-2xl font-black mb-3" style={{ color: '#1A1A2E' }}>
            {back || meaning}
          </p>
          {exampleSentence && (
            <div className="rounded-[12px] p-3 mb-2" style={{ backgroundColor: '#EBF0F8' }}>
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
                className="py-2 rounded-[12px] text-sm font-bold text-white shadow-[0_3px_0_#CC0000] active:shadow-none active:translate-y-[3px] transition-all"
                style={{ backgroundColor: '#FF4B4B' }}
              >
                😰 Hard
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); rateHandler(2) }}
                className="py-2 rounded-[12px] text-sm font-bold text-white shadow-[0_3px_0_#CC9200] active:shadow-none active:translate-y-[3px] transition-all"
                style={{ backgroundColor: '#FFB800' }}
              >
                😐 Okay
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); rateHandler(3) }}
                className="py-2 rounded-[12px] text-sm font-bold text-white shadow-[0_3px_0_#46A302] active:shadow-none active:translate-y-[3px] transition-all"
                style={{ backgroundColor: '#58CC02' }}
              >
                😄 Easy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
