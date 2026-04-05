'use client'

import { useEffect, useRef } from 'react'

interface Props {
  keyword: Record<string, unknown>
  position: { x: number; y: number }
  onClose: () => void
}

const jlptColors: Record<string, string> = {
  N5: '#4CAF50', N4: '#8BC34A', N3: '#FFC107', N2: '#FF9800', N1: '#F44336',
}

export default function KeywordPopup({ keyword, position, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const level = keyword.jlptLevel as string

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
      style={{
        left: Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 300),
        top: position.y,
      }}
    >
      <div className="px-4 pt-4 pb-3 border-b border-black/5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-2xl font-bold font-jp">{keyword.word as string}</span>
            <span className="text-sm text-foreground/40 ml-2">{keyword.reading as string}</span>
          </div>
          {level && (
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: jlptColors[level] || '#999' }}>
              {level}
            </span>
          )}
        </div>
        <p className="text-xs text-foreground/30 mt-0.5">{keyword.romaji as string}</p>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div>
          <span className="text-xs text-foreground/30 uppercase tracking-wide">{keyword.partOfSpeech as string}</span>
          <p className="text-sm font-medium text-foreground mt-0.5">{keyword.meaning as string}</p>
        </div>
        {typeof keyword.exampleSentence === 'string' && (
          <div className="bg-black/[0.03] rounded-lg p-2">
            <p className="text-xs font-jp">{keyword.exampleSentence as string}</p>
          </div>
        )}
        {typeof keyword.culturalNote === 'string' && (
          <p className="text-xs text-accent italic">{keyword.culturalNote as string}</p>
        )}
      </div>

      <div className="px-4 pb-4">
        <button
          className="w-full py-2 rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: '#1B4F8A' }}
          onClick={() => {
            const deck = JSON.parse(localStorage.getItem('zlang_srs') || '{}')
            deck[keyword.word as string] = {
              ...keyword,
              nextReview: new Date(Date.now() + 86400000).toISOString(),
              confidence: 1,
              reviews: 0,
            }
            localStorage.setItem('zlang_srs', JSON.stringify(deck))
            onClose()
          }}
        >
          + Add to my vocab deck
        </button>
      </div>
    </div>
  )
}
