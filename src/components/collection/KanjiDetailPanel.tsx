'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as wanakana from 'wanakana'
import { StrokeAnimation } from '@/components/japanese/StrokeAnimation'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'

// Hepburn long-vowel substitutions so the romaji matches the style we use
// elsewhere in the app (e.g. でんしゃ → densha, but とうきょう → tōkyō).
const LONG_VOWEL_SUBS: Array<[RegExp, string]> = [
  [/ou/g, 'ō'],
  [/oo/g, 'ō'],
  [/uu/g, 'ū'],
  [/aa/g, 'ā'],
  [/ee/g, 'ē'],
  [/ei/g, 'ē'],
]

function toRomaji(kana: string): string {
  let r = wanakana.toRomaji(kana)
  for (const [pat, sub] of LONG_VOWEL_SUBS) r = r.replace(pat, sub)
  return r
}

interface Props {
  kanji: KyouikuKanji
  isLearned: boolean
  isSeen: boolean
  onClose: () => void
}

function renderJapanese(text: string) {
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
        <rt style={{ fontSize: '0.55em', fontWeight: 400, color: '#9E9892' }}>{match[2]}</rt>
        <rp>)</rp>
      </ruby>,
    )
    last = regex.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

export function KanjiDetailPanel({ kanji, isLearned, isSeen, onClose }: Props) {
  const router = useRouter()

  // Lock background scroll while panel is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleLearn = () => {
    onClose()
    router.push(`/collection/kanji/learn/${encodeURIComponent(kanji.character)}`)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(26,24,20,0.45)' }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px]"
        style={{ backgroundColor: '#FDFBF8' }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 pt-4 pb-2 px-6 z-10" style={{ backgroundColor: '#FDFBF8' }}>
          <div className="w-10 h-1 rounded-full mx-auto" style={{ backgroundColor: '#E0DAD2' }} />
        </div>

        <div className="px-6 pb-10 space-y-6">
          {/* Header: stroke animation + meaning */}
          <div className="flex items-center gap-5">
            <div className="shrink-0">
              <StrokeAnimation
                character={kanji.character}
                size={100}
                autoPlay={true}
                loop={false}
                showGrid={true}
                strokeColor={isLearned ? '#C9920A' : '#1A1814'}
                speed={0.6}
              />
            </div>

            <div className="min-w-0">
              <p style={{ fontFamily: 'Shippori Mincho', fontSize: '20px', color: '#1A1814', lineHeight: 1.3 }}>
                {kanji.meanings.join(', ')}
              </p>
              <p className="text-xs text-[#9E9892] mt-1" style={{ fontFamily: 'DM Sans' }}>
                {kanji.strokeCount} strokes · Grade {kanji.grade}
              </p>
              {isLearned && (
                <p
                  className="text-xs font-medium mt-1.5"
                  style={{ color: '#C9920A', fontFamily: 'DM Sans' }}
                >
                  ✓ Learned
                </p>
              )}
            </div>
          </div>

          {/* Readings */}
          <div className="rounded-[10px] px-4 py-3 space-y-2" style={{ backgroundColor: '#F5F0EB' }}>
            {kanji.onReading.length > 0 && (
              <div className="flex items-baseline gap-3">
                <p
                  className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium w-14 shrink-0"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  音読み
                </p>
                <p style={{ fontFamily: 'Noto Sans JP', fontSize: '16px', color: '#1A1814', fontWeight: 300 }}>
                  {kanji.onReading.join('、')}
                </p>
              </div>
            )}
            {kanji.kunReading.length > 0 && (
              <div className="flex items-baseline gap-3">
                <p
                  className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium w-14 shrink-0"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  訓読み
                </p>
                <p style={{ fontFamily: 'Noto Sans JP', fontSize: '16px', color: '#1A1814', fontWeight: 300 }}>
                  {kanji.kunReading.join('、')}
                </p>
              </div>
            )}
          </div>

          {/* Common words */}
          {kanji.commonWords.length > 0 && (
            <div>
              <p
                className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-2"
                style={{ fontFamily: 'DM Sans' }}
              >
                Common words
              </p>
              <div className="space-y-2">
                {kanji.commonWords.slice(0, 4).map((w, i) => (
                  <div
                    key={i}
                    className="py-2 border-b border-[#F5F0EB] last:border-0"
                  >
                    {/* Top line: Japanese word, English meaning sitting right next to it. */}
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <p
                        style={{
                          fontFamily: 'Noto Sans JP',
                          fontSize: '17px',
                          color: '#1A1814',
                          fontWeight: 300,
                          lineHeight: 1.4,
                        }}
                      >
                        {renderJapanese(w.word)}
                      </p>
                      <p
                        style={{
                          fontFamily: 'DM Sans',
                          fontSize: '13px',
                          color: '#6B6560',
                          fontWeight: 500,
                        }}
                      >
                        {w.english || '—'}
                      </p>
                    </div>

                    {/* Bottom line: reading and romaji together. */}
                    {(w.reading || w.word) && (
                      <div className="flex items-baseline gap-2 mt-0.5">
                        {w.reading && (
                          <span
                            style={{
                              fontFamily: 'Noto Sans JP',
                              fontSize: '11px',
                              color: '#9E9892',
                              fontWeight: 300,
                            }}
                          >
                            {w.reading}
                          </span>
                        )}
                        <span
                          style={{
                            fontFamily: 'DM Mono',
                            fontSize: '11px',
                            color: '#C8C3BC',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {toRomaji(w.reading || w.word)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memory hint */}
          {kanji.memoryHint && (
            <div
              className="rounded-[10px] px-4 py-3 border"
              style={{ backgroundColor: '#EBF0F8', borderColor: '#1B4F8A15' }}
            >
              <p
                className="text-xs leading-relaxed"
                style={{ color: '#1B4F8A', fontFamily: 'DM Sans' }}
              >
                💡 {kanji.memoryHint}
              </p>
            </div>
          )}

          {/* CTA */}
          {isLearned ? (
            <div className="w-full py-3 rounded-[12px] text-center" style={{ backgroundColor: '#FEF3C7' }}>
              <p className="text-sm font-medium" style={{ color: '#C9920A', fontFamily: 'DM Sans' }}>
                ⭐ You know this character
              </p>
            </div>
          ) : isSeen ? (
            <button
              onClick={handleLearn}
              className="w-full py-4 rounded-[12px] font-semibold text-sm transition-all active:translate-y-px"
              style={{
                backgroundColor: '#C9920A',
                color: 'white',
                fontFamily: 'DM Sans',
                boxShadow: '0 4px 16px rgba(201,146,10,0.3)',
              }}
            >
              Learn this character →
            </button>
          ) : null}
        </div>
      </div>
    </>
  )
}
