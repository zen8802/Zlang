'use client'

import { useState, useCallback } from 'react'
import type { FlashcardBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: FlashcardBlock
  onComplete: (xp: number) => void
}

const POS_THEME: Record<string, { accent: string; bg: string; text: string; label: string; jp: string }> = {
  noun:        { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'noun',       jp: '名詞' },
  verb:        { accent: '#8B3A3A', bg: '#F5EEEE', text: '#8B3A3A', label: 'verb',       jp: '動詞' },
  adjective:   { accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective',  jp: '形容詞' },
  adverb:      { accent: '#3D6B4F', bg: '#EFF5F0', text: '#3D6B4F', label: 'adverb',     jp: '副詞' },
  particle:    { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'particle',   jp: '助詞' },
  phrase:      { accent: '#8B5A6B', bg: '#F5EEF0', text: '#8B5A6B', label: 'phrase',     jp: '表現' },
  greeting:    { accent: '#3D6B5A', bg: '#EFF5F2', text: '#3D6B5A', label: 'greeting',   jp: '挨拶' },
  expression:  { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'expression', jp: '表現' },
  counter:     { accent: '#6366F1', bg: '#EEF2FF', text: '#4F46E5', label: 'counter',    jp: '助数詞' },
}

const DEFAULT_THEME = { accent: '#9E9892', bg: '#F5F0EB', text: '#6B6560', label: 'word', jp: '言葉' }

/**
 * Render Japanese text. Handles inline furigana annotations 漢字(かな) → ruby.
 */
function renderJapanese(text: string): React.ReactNode {
  if (!text) return null
  const regex = /([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g
  if (!regex.test(text)) return text
  regex.lastIndex = 0

  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rp>(</rp>
        <rt style={{ fontSize: '0.55em', fontWeight: 400, color: '#9E9892', letterSpacing: '0.05em' }}>
          {match[2]}
        </rt>
        <rp>)</rp>
      </ruby>,
    )
    last = regex.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

export function FlashcardBlockRenderer({ block, onComplete }: Props) {
  const [flippedSet, setFlippedSet] = useState<Set<number>>(new Set())
  const [seenSet, setSeenSet] = useState<Set<number>>(new Set())

  const allSeen = seenSet.size >= block.cards.length

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    // Strip furigana annotations before pronouncing
    const clean = text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
    const u = new SpeechSynthesisUtterance(clean)
    u.lang = 'ja-JP'
    u.rate = 0.7
    window.speechSynthesis.speak(u)
  }, [])

  const handleFlip = (i: number) => {
    const isCurrentlyFlipped = flippedSet.has(i)
    const nextFlipped = new Set(flippedSet)
    if (isCurrentlyFlipped) nextFlipped.delete(i)
    else nextFlipped.add(i)
    setFlippedSet(nextFlipped)

    if (!seenSet.has(i) && !isCurrentlyFlipped) {
      const nextSeen = new Set(seenSet)
      nextSeen.add(i)
      setSeenSet(nextSeen)
      speak(block.cards[i].word)
    }
  }

  return (
    <div className="page-enter flex flex-col gap-5 py-4">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {block.cards.map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{ backgroundColor: seenSet.has(i) ? '#1B4F8A' : '#D8D3CC' }}
          />
        ))}
      </div>

      {/* Status message */}
      <p
        className="text-sm text-center font-medium"
        style={{
          color: allSeen ? '#3D6B4F' : '#6B6560',
          fontFamily: 'DM Sans',
        }}
      >
        {allSeen
          ? 'All cards reviewed!'
          : `Tap all ${block.cards.length} cards to continue`}
      </p>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {block.cards.map((card, i) => {
          const isFlipped = flippedSet.has(i)
          const isSeen = seenSet.has(i)
          const theme = POS_THEME[card.partOfSpeech] || DEFAULT_THEME

          return (
            <div
              key={i}
              className="cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={() => handleFlip(i)}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  minHeight: '240px',
                }}
              >
                {/* ─── FRONT: Japanese word (furigana on top, romaji below) ─── */}
                <div
                  className="absolute inset-0 rounded-[14px] overflow-hidden flex flex-col"
                  style={{
                    backfaceVisibility: 'hidden',
                    backgroundColor: '#FDFBF8',
                    border: `1.5px solid ${isSeen ? theme.accent + '30' : '#E0DAD2'}`,
                    boxShadow: isSeen
                      ? `0 4px 16px ${theme.accent}10`
                      : '0 1px 3px rgba(26,24,20,0.04)',
                  }}
                >
                  {/* POS accent strip */}
                  <div style={{ height: '2.5px', backgroundColor: theme.accent, opacity: 0.6 }} />

                  {/* JLPT badge top-right */}
                  {card.jlptLevel && (
                    <div className="absolute top-2 right-2">
                      <span
                        className="text-[9px] font-medium tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          fontFamily: 'DM Mono',
                          backgroundColor: theme.bg,
                          color: theme.text,
                        }}
                      >
                        {card.jlptLevel}
                      </span>
                    </div>
                  )}

                  {/* Center: word (with ruby furigana) + romaji below */}
                  <div className="flex-1 flex flex-col items-center justify-center px-3 py-4">
                    <p
                      className="text-center"
                      style={{
                        fontFamily: 'Noto Sans JP',
                        fontSize: '32px',
                        fontWeight: 300,
                        color: '#1A1814',
                        lineHeight: 1.6,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {renderJapanese(card.word)}
                    </p>
                    {card.romaji && (
                      <p
                        className="mt-2 text-center"
                        style={{
                          fontFamily: 'DM Mono',
                          fontSize: '12px',
                          color: '#9E9892',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {card.romaji}
                      </p>
                    )}
                  </div>

                  {/* Bottom: tap hint */}
                  <div
                    className="px-3 py-2 text-center border-t"
                    style={{ borderColor: '#F5F0EB' }}
                  >
                    <p
                      className="text-[10px] font-medium tracking-wide"
                      style={{
                        fontFamily: 'DM Sans',
                        color: isSeen ? theme.accent : '#C8C3BC',
                      }}
                    >
                      {isSeen && !isFlipped ? 'tap again' : 'tap to reveal'}
                    </p>
                  </div>
                </div>

                {/* ─── BACK: English + part of speech + example ─── */}
                <div
                  className="absolute inset-0 rounded-[14px] overflow-hidden flex flex-col"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    backgroundColor: '#FDFBF8',
                    border: `1.5px solid ${theme.accent}40`,
                    boxShadow: `0 4px 16px ${theme.accent}15`,
                  }}
                >
                  {/* Header: POS pill */}
                  <div
                    className="px-3 pt-3 pb-2 flex items-center justify-between"
                    style={{ backgroundColor: theme.bg + '60' }}
                  >
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                      style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        fontFamily: 'DM Sans',
                      }}
                    >
                      {theme.jp} · {theme.label}
                    </span>
                  </div>

                  {/* English meaning */}
                  <div className="px-3 py-3 flex-1 flex flex-col">
                    <p
                      className="text-center"
                      style={{
                        fontFamily: 'Shippori Mincho',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#1A1814',
                        lineHeight: 1.4,
                      }}
                    >
                      {card.english}
                    </p>

                    {/* Example sentence */}
                    {card.exampleJP && (
                      <div
                        className="mt-3 rounded-[8px] px-2.5 py-2"
                        style={{ backgroundColor: '#FAFAF8', border: `1px solid ${theme.accent}15` }}
                      >
                        <p
                          style={{
                            fontFamily: 'Noto Sans JP',
                            fontSize: '12px',
                            color: '#1A1814',
                            fontWeight: 300,
                            lineHeight: 1.8,
                            textAlign: 'center',
                          }}
                        >
                          {renderJapanese(card.exampleJP)}
                        </p>
                        {card.exampleEN && (
                          <p
                            className="mt-1 text-center"
                            style={{
                              fontFamily: 'DM Sans',
                              fontSize: '10px',
                              color: '#9E9892',
                              fontStyle: 'italic',
                            }}
                          >
                            {card.exampleEN}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Memory hook footer */}
                  {card.memoryHook && (
                    <div
                      className="px-3 py-2 border-t"
                      style={{ borderColor: theme.accent + '15', backgroundColor: '#FAFAF8' }}
                    >
                      <p
                        className="text-[10px] leading-snug text-center"
                        style={{ fontFamily: 'DM Sans', color: '#6B6560', fontStyle: 'italic' }}
                      >
                        💡 {card.memoryHook}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Continue button */}
      {allSeen && (
        <div className="page-enter">
          <Button onClick={() => onComplete(block.xpReward)} fullWidth>
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}

export default FlashcardBlockRenderer
