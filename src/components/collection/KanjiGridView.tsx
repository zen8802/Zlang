'use client'

import { useState, useMemo } from 'react'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'
import { GRADE_LABELS } from '@/data/kyouiku-kanji'
import { StrokeAnimation } from '@/components/japanese/StrokeAnimation'

interface Props {
  grade1Kanji: KyouikuKanji[]
  discoveredKanji: Set<string>
  seenKanji?: Set<string>
  userExperience: number
}

export default function KanjiGridView({ grade1Kanji, discoveredKanji, seenKanji = new Set(), userExperience }: Props) {
  const [selectedKanji, setSelectedKanji] = useState<KyouikuKanji | null>(null)

  const discoveredCount = useMemo(
    () => grade1Kanji.filter((k) => discoveredKanji.has(k.character)).length,
    [grade1Kanji, discoveredKanji],
  )

  const label = GRADE_LABELS[1]

  return (
    <div className="px-2 py-3">
      {/* Grade header */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span
            style={{
              fontFamily: 'Shippori Mincho',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1A1814',
            }}
          >
            {label.jp} · {label.en}
          </span>
          <span
            style={{
              fontFamily: 'DM Mono',
              fontSize: '11px',
              color: '#9E9892',
            }}
          >
            {discoveredCount}/80
          </span>
        </div>
        <p
          style={{
            fontFamily: 'Shippori Mincho',
            fontSize: '12px',
            color: '#9E9892',
            marginTop: '2px',
          }}
        >
          {label.sub}
        </p>
      </div>

      {/* Beginner hint */}
      {discoveredCount === 0 && userExperience <= 2 && (
        <div
          className="mb-4 p-3 rounded-[10px]"
          style={{
            backgroundColor: 'rgba(27, 79, 138, 0.04)',
            border: '1px solid rgba(27, 79, 138, 0.1)',
          }}
        >
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '12px',
              color: '#6B6560',
              lineHeight: 1.5,
            }}
          >
            Kanji will appear here as you encounter them in conversations. Keep practicing to discover
            your first characters!
          </p>
        </div>
      )}

      {/* 5-column grid — top-down, right-to-left like traditional Japanese */}
      <div className="grid gap-2" style={{ gridTemplateRows: 'repeat(16, 1fr)', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(5, 1fr)', direction: 'rtl' }}>
        {grade1Kanji.map((kanji) => {
          const isDiscovered = discoveredKanji.has(kanji.character)
          const isSeen = !isDiscovered && seenKanji.has(kanji.character)
          const isSelected = selectedKanji?.character === kanji.character

          return (
            <button
              key={kanji.character}
              onClick={() => setSelectedKanji(isSelected ? null : kanji)}
              className={`
                aspect-square rounded-[8px] flex flex-col items-center justify-center
                cursor-pointer transition-all duration-150
                ${isSelected ? 'ring-2 ring-[#1B4F8A]' : ''}
              `}
              style={
                isDiscovered
                  ? { backgroundColor: '#FEF9F0', border: '1.5px solid #D4AF37' }
                  : isSeen
                    ? { backgroundColor: '#4A4642', border: '1.5px solid #5A5550' }
                    : { backgroundColor: '#2C2924', border: '1.5px solid #1A1814' }
              }
            >
              {isDiscovered ? (
                <>
                  <span style={{ fontFamily: 'Noto Sans JP', fontSize: '22px', fontWeight: 300, color: '#1A1814', lineHeight: 1 }}>
                    {kanji.character}
                  </span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: '8px', color: '#9E9892', marginTop: '2px' }}>
                    {kanji.strokeCount}画
                  </span>
                </>
              ) : isSeen ? (
                <>
                  <span style={{ fontFamily: 'Noto Sans JP', fontSize: '22px', fontWeight: 300, color: 'rgba(255,255,255,0.38)', lineHeight: 1 }}>
                    {kanji.character}
                  </span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: '7px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
                    seen
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: 'Noto Sans JP', fontSize: '22px', fontWeight: 300, color: 'rgba(255,255,255,0.07)', lineHeight: 1 }}>
                    {kanji.character}
                  </span>
                  <span style={{ fontFamily: 'DM Mono', fontSize: '8px', color: 'rgba(255,255,255,0.07)', marginTop: '2px' }}>
                    ?
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected kanji detail panel */}
      {selectedKanji && (
        <div
          className="mt-3 rounded-[10px] p-4"
          style={
            discoveredKanji.has(selectedKanji.character)
              ? {
                  backgroundColor: '#FDFBF8',
                  border: '1px solid #E0DAD2',
                }
              : {
                  backgroundColor: '#2C2924',
                  border: '1px solid #1A1814',
                }
          }
        >
          {discoveredKanji.has(selectedKanji.character) ? (
            <>
              <div className="flex items-start gap-4">
                <StrokeAnimation
                  character={selectedKanji.character}
                  size={100}
                  autoPlay={true}
                  loop={false}
                  showGrid={true}
                  strokeColor="#1A1814"
                  speed={0.6}
                />
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontFamily: 'DM Sans',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#1A1814',
                    }}
                  >
                    {selectedKanji.meanings.join(', ')}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span
                      style={{
                        fontFamily: 'DM Sans',
                        fontSize: '11px',
                        color: '#6B6560',
                      }}
                    >
                      <strong>ON:</strong>{' '}
                      {selectedKanji.onReading.length > 0
                        ? selectedKanji.onReading.join(', ')
                        : '—'}
                    </span>
                    <span
                      style={{
                        fontFamily: 'DM Sans',
                        fontSize: '11px',
                        color: '#6B6560',
                      }}
                    >
                      <strong>KUN:</strong>{' '}
                      {selectedKanji.kunReading.length > 0
                        ? selectedKanji.kunReading.join(', ')
                        : '—'}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3">
                    <span
                      style={{
                        fontFamily: 'DM Mono',
                        fontSize: '10px',
                        color: '#9E9892',
                      }}
                    >
                      {selectedKanji.strokeCount} strokes
                    </span>
                    <span
                      style={{
                        fontFamily: 'DM Mono',
                        fontSize: '10px',
                        color: '#9E9892',
                      }}
                    >
                      Grade {selectedKanji.grade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Common words */}
              {selectedKanji.commonWords.length > 0 && (
                <div className="mt-3">
                  <p
                    style={{
                      fontFamily: 'DM Sans',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#9E9892',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '6px',
                    }}
                  >
                    Common Words
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {selectedKanji.commonWords.slice(0, 3).map((w, i) => (
                      <div
                        key={i}
                        className="flex items-baseline gap-2"
                        style={{ fontFamily: 'DM Sans', fontSize: '12px' }}
                      >
                        <span
                          style={{
                            fontFamily: 'Noto Sans JP',
                            fontWeight: 500,
                            color: '#1A1814',
                          }}
                        >
                          {w.word}
                        </span>
                        <span style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#1B4F8A' }}>
                          {w.reading}
                        </span>
                        <span style={{ color: '#6B6560' }}>{w.english}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory hint */}
              {selectedKanji.memoryHint && (
                <div
                  className="mt-3 p-2.5 rounded-[8px]"
                  style={{
                    backgroundColor: 'rgba(27, 79, 138, 0.04)',
                    border: '1px solid rgba(27, 79, 138, 0.1)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'DM Sans',
                      fontSize: '12px',
                      color: '#6B6560',
                      lineHeight: 1.5,
                    }}
                  >
                    💡 {selectedKanji.memoryHint}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-2">
              <span
                style={{
                  fontFamily: 'Noto Sans JP',
                  fontSize: '32px',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.10)',
                  lineHeight: 1,
                }}
              >
                {selectedKanji.character}
              </span>
              <p
                className="mt-2"
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Not yet discovered
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
