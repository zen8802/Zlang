'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  keyword: Record<string, unknown>
  anchor: DOMRect
  onClose: () => void
}

const JLPT_COLORS: Record<string, string> = {
  N5: '#4CAF50', N4: '#8BC34A', N3: '#FFC107', N2: '#FF9800', N1: '#F44336',
}

export default function KeywordPopup({ keyword, anchor, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState(false)

  const top = anchor.bottom + 8
  const left = Math.max(16, Math.min(anchor.left, (typeof window !== 'undefined' ? window.innerWidth : 400) - 288 - 16))
  const level = keyword.jlptLevel as string

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const saveWord = () => {
    const deck = JSON.parse(localStorage.getItem('zlang_srs') || '{}')
    deck[keyword.word as string] = {
      ...keyword,
      nextReview: new Date(Date.now() + 86400000).toISOString(),
      confidence: 1,
      reviews: 0,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem('zlang_srs', JSON.stringify(deck))
    setSaved(true)
    setTimeout(onClose, 800)
  }

  return (
    <div ref={ref} className="fixed z-50 w-72 bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100" style={{ top, left }}>
      <div className="h-1 w-full" style={{ backgroundColor: JLPT_COLORS[level] || '#ccc' }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-3xl font-bold font-jp" style={{ color: '#0A0A0F' }}>{keyword.word as string}</span>
            {typeof keyword.reading === 'string' && (
              <span className="text-xs ml-2 font-jp" style={{ color: '#1B4F8A' }}>{keyword.reading}</span>
            )}
            {typeof keyword.romaji === 'string' && (
              <p className="text-xs text-foreground/30 font-mono mt-0.5">{keyword.romaji}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: JLPT_COLORS[level] || '#999' }}>{level}</span>
            {typeof keyword.partOfSpeech === 'string' && (
              <span className="text-xs text-foreground/30 font-body">{keyword.partOfSpeech}</span>
            )}
          </div>
        </div>

        <p className="text-base font-semibold text-foreground font-body mb-2">{keyword.meaning as string}</p>

        {typeof keyword.exampleSentence === 'string' && (
          <div className="bg-black/[0.03] rounded-xl p-2.5 mb-3">
            <p className="text-sm text-foreground/70 leading-relaxed font-jp">{keyword.exampleSentence}</p>
          </div>
        )}

        {typeof keyword.culturalNote === 'string' && (
          <p className="text-xs italic mb-3 font-body" style={{ color: '#1B4F8A' }}>{keyword.culturalNote}</p>
        )}

        <button
          onClick={saveWord}
          className={`w-full py-2.5 rounded-xl text-sm font-bold font-display transition-all duration-200 ${saved ? 'bg-green-500 text-white' : 'text-white hover:opacity-90'}`}
          style={saved ? undefined : { backgroundColor: '#1B4F8A' }}
        >
          {saved ? '✓ Added' : '+ Add to vocab deck'}
        </button>
      </div>
    </div>
  )
}
