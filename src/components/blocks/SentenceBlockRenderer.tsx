'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { SentenceBlock, KeywordAnnotation } from '@/types/lesson-blocks'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface Props {
  block: SentenceBlock
  onComplete: (xp: number) => void
}

export default function SentenceBlockRenderer({ block, onComplete }: Props) {
  const [showEN, setShowEN] = useState(false)
  const [activeKeyword, setActiveKeyword] = useState<KeywordAnnotation | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      setActiveKeyword(null)
    }
  }, [])

  useEffect(() => {
    if (activeKeyword) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeKeyword, handleClickOutside])

  const renderJapaneseWithKeywords = (japanese: string, keywords: KeywordAnnotation[]) => {
    if (!keywords.length) {
      return <span style={{ fontFamily: 'var(--font-jp)' }}>{japanese}</span>
    }

    const parts: React.ReactNode[] = []
    let remaining = japanese

    // Sort keywords by position in string to process left-to-right
    const sorted = [...keywords].sort(
      (a, b) => japanese.indexOf(a.word) - japanese.indexOf(b.word)
    )

    sorted.forEach((kw, i) => {
      const idx = remaining.indexOf(kw.word)
      if (idx === -1) return

      if (idx > 0) {
        parts.push(
          <span key={`pre-${i}`} style={{ fontFamily: 'var(--font-jp)' }}>
            {remaining.slice(0, idx)}
          </span>
        )
      }
      parts.push(
        <span
          key={`kw-${i}`}
          onClick={(e) => {
            e.stopPropagation()
            setActiveKeyword(activeKeyword?.word === kw.word ? null : kw)
          }}
          className="cursor-pointer border-b-2 border-dotted border-[#1B4F8A] text-[#1B4F8A] font-semibold"
          style={{ fontFamily: 'var(--font-jp)' }}
        >
          {kw.word}
        </span>
      )
      remaining = remaining.slice(idx + kw.word.length)
    })

    if (remaining) {
      parts.push(
        <span key="tail" style={{ fontFamily: 'var(--font-jp)' }}>
          {remaining}
        </span>
      )
    }

    return <>{parts}</>
  }

  return (
    <div className="page-enter flex flex-col gap-4 py-4">
      {/* EN toggle */}
      <div className="flex justify-end">
        <Button
          variant={showEN ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowEN(!showEN)}
        >
          {showEN ? 'Hide EN' : 'Show EN'}
        </Button>
      </div>

      {block.sentences.map((s, i) => (
        <Card key={s.id} variant="elevated" className="relative">
          <div className="flex items-start gap-3">
            <Badge color="blue" size="sm">{i + 1}</Badge>
            {s.emotionTag && <Badge color="purple" size="sm">{s.emotionTag}</Badge>}
          </div>

          {/* Japanese with keyword highlights */}
          <p className="text-xl mt-3 leading-relaxed" style={{ fontFamily: 'var(--font-jp)' }}>
            {renderJapaneseWithKeywords(s.japanese, s.keywords)}
          </p>

          {/* Romaji */}
          <p className="text-sm text-[#9E9892] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
            {s.romaji}
          </p>

          {/* English (togglable) */}
          {showEN && (
            <p className="text-base text-[#6B6560] mt-2" style={{ fontFamily: 'var(--font-ui)' }}>
              {s.english}
            </p>
          )}

          {/* Grammar note */}
          {s.grammarNote && (
            <div className="bg-[#EBF0F8] rounded-[6px] p-3 mt-3">
              <p className="text-sm text-[#1B4F8A] font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
                {s.grammarNote}
              </p>
            </div>
          )}
        </Card>
      ))}

      {/* Keyword popup */}
      {activeKeyword && (
        <div
          ref={popupRef}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#FDFBF8] rounded-[10px] p-5 w-[300px] page-enter border border-[#E0DAD2]"
          style={{ boxShadow: '0 1px 4px rgba(26,24,20,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-normal" style={{ fontFamily: 'var(--font-jp)' }}>
              {activeKeyword.word}
            </span>
            <span className="text-sm text-[#9E9892]" style={{ fontFamily: 'var(--font-jp)' }}>
              {activeKeyword.reading}
            </span>
            <Badge color="blue" size="sm">{activeKeyword.jlptLevel}</Badge>
          </div>
          <p className="text-base font-semibold text-[#1A1814]" style={{ fontFamily: 'var(--font-ui)' }}>
            {activeKeyword.meaning}
          </p>
          {activeKeyword.example && (
            <p className="text-sm text-[#6B6560] mt-2 italic" style={{ fontFamily: 'var(--font-jp)' }}>
              {activeKeyword.example}
            </p>
          )}
          <button
            onClick={() => setActiveKeyword(null)}
            className="mt-3 text-sm text-[#1B4F8A] font-semibold"
          >
            Close
          </button>
        </div>
      )}

      {/* Backdrop for popup */}
      {activeKeyword && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setActiveKeyword(null)}
        />
      )}

      <Button onClick={() => onComplete(block.xpReward)} fullWidth>
        Continue
      </Button>
    </div>
  )
}
