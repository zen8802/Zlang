'use client'

import { useEffect, useState } from 'react'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'
import { StrokeAnimation } from '@/components/japanese/StrokeAnimation'

interface Props {
  kanji: KyouikuKanji
  onDone: () => void
}

export function LearnComplete({ kanji, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center space-y-8"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      {/* Gold reveal */}
      <div
        className="transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.8)',
        }}
      >
        <div
          className="rounded-[24px] flex items-center justify-center relative"
          style={{
            width: 180,
            height: 180,
            backgroundColor: 'white',
            border: '3px solid #C9920A',
            boxShadow: '0 0 40px rgba(201,146,10,0.25), 0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <StrokeAnimation
            character={kanji.character}
            size={140}
            autoPlay={true}
            loop={false}
            showGrid={true}
            strokeColor="#C9920A"
            speed={0.6}
          />
        </div>
      </div>

      {/* Text */}
      <div
        className="space-y-2 transition-all duration-700 delay-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '26px', color: '#C9920A' }}>
          {kanji.character} learned
        </p>
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '18px', color: '#1A1814' }}>
          {kanji.meanings.join(' · ')}
        </p>
        <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans' }}>
          This character is now gold in your collection
        </p>
      </div>

      {/* Done */}
      <div
        className="w-full max-w-xs transition-all duration-700 delay-500"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <button
          onClick={onDone}
          className="w-full py-4 rounded-[12px] font-semibold text-sm"
          style={{
            backgroundColor: '#C9920A',
            color: 'white',
            fontFamily: 'DM Sans',
            boxShadow: '0 4px 20px rgba(201,146,10,0.3)',
          }}
        >
          Back to collection
        </button>
      </div>
    </div>
  )
}
