'use client'

import { useState, useMemo } from 'react'

interface CategoryMeta {
  key: string
  label: string
  emoji: string
  sublabel: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wordsByCategory: Record<string, { card: any; userCard: any | null }[]>
  categories: CategoryMeta[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any
}

export default function WordsGridView({
  wordsByCategory,
  categories,
}: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string>('grammar')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedWord, setSelectedWord] = useState<{ card: any; userCard: any | null } | null>(null)

  const toggleCategory = (key: string) => {
    setExpandedCategory((prev) => (prev === key ? '' : key))
    setSelectedWord(null)
  }

  // Only show categories that have cards
  const visibleCategories = useMemo(
    () => categories.filter((c) => (wordsByCategory[c.key]?.length ?? 0) > 0),
    [categories, wordsByCategory],
  )

  return (
    <div className="px-2 py-3">
      {visibleCategories.length === 0 && (
        <div className="text-center py-10">
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '13px',
              color: '#9E9892',
            }}
          >
            No words collected yet. Complete conversations to unlock vocabulary!
          </p>
        </div>
      )}

      {visibleCategories.map((cat) => {
        const entries = wordsByCategory[cat.key] || []
        const discovered = entries.filter((e) => e.userCard !== null)
        const isExpanded = expandedCategory === cat.key

        return (
          <div key={cat.key} className="mb-2">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat.key)}
              className="w-full flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-colors"
              style={{
                backgroundColor: isExpanded ? 'rgba(27, 79, 138, 0.04)' : '#FDFBF8',
                border: '1px solid #E0DAD2',
              }}
            >
              <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: 'Shippori Mincho',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#1A1814',
                    }}
                  >
                    {cat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'DM Sans',
                      fontSize: '10px',
                      color: '#9E9892',
                    }}
                  >
                    {cat.sublabel}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: '11px',
                  color: '#6B6560',
                }}
              >
                {discovered.length}/{entries.length}
              </span>
              <span
                className="transition-transform duration-200"
                style={{
                  color: '#C8C3BC',
                  fontSize: '14px',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                ▼
              </span>
            </button>

            {/* Expanded card grid */}
            {isExpanded && (
              <div className="mt-2 mb-2">
                <div className="grid grid-cols-4 gap-2">
                  {entries.map((entry, idx) => {
                    const isCollected = entry.userCard !== null
                    const isMastered = entry.userCard?.status === 'mastered'
                    const isSelected = selectedWord?.card?.id === entry.card?.id
                    const word = entry.card?.word || ''
                    const fontSize = word.length > 3 ? '12px' : word.length > 2 ? '14px' : '16px'

                    return (
                      <button
                        key={entry.card?.id ?? idx}
                        onClick={() => setSelectedWord(isSelected ? null : entry)}
                        className={`
                          aspect-square rounded-[8px] flex flex-col items-center justify-center
                          cursor-pointer transition-all duration-150
                          ${isSelected ? 'ring-2 ring-[#1B4F8A]' : ''}
                        `}
                        style={
                          isCollected
                            ? {
                                backgroundColor: isMastered ? '#FEF3C7' : '#FDFBF8',
                                border: `1.5px solid ${isMastered ? '#F59E0B' : '#E0DAD2'}`,
                              }
                            : {
                                backgroundColor: '#DDD7CF',
                                border: '1.5px solid #D4CFC8',
                              }
                        }
                      >
                        {isCollected ? (
                          <>
                            <span
                              style={{
                                fontFamily: 'Noto Sans JP',
                                fontSize,
                                fontWeight: 400,
                                color: '#1A1814',
                                lineHeight: 1.2,
                              }}
                            >
                              {word}
                            </span>
                            {isMastered && (
                              <span style={{ fontSize: '10px', marginTop: '2px' }}>
                                ⭐
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span
                              style={{
                                fontFamily: 'Noto Sans JP',
                                fontSize: '14px',
                                fontWeight: 400,
                                color: 'rgba(26,24,20,0.12)',
                                lineHeight: 1.2,
                              }}
                            >
                              {word}
                            </span>
                            <span
                              style={{
                                fontFamily: 'DM Mono',
                                fontSize: '10px',
                                color: 'rgba(26,24,20,0.18)',
                                lineHeight: 1,
                              }}
                            >
                              ?
                            </span>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Selected word detail card */}
                {selectedWord && selectedWord.userCard && (
                  <div
                    className="mt-3 rounded-[10px] p-4"
                    style={{
                      backgroundColor: '#FDFBF8',
                      border: '1px solid #E0DAD2',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span style={{ fontSize: '28px' }}>
                        {selectedWord.card?.cardEmoji || '📝'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontFamily: 'Noto Sans JP',
                            fontSize: '22px',
                            fontWeight: 500,
                            color: '#1A1814',
                            lineHeight: 1.3,
                          }}
                        >
                          {selectedWord.card?.word}
                        </div>
                        <div
                          className="mt-0.5"
                          style={{
                            fontFamily: 'DM Mono',
                            fontSize: '13px',
                            color: '#1B4F8A',
                          }}
                        >
                          {selectedWord.card?.romaji}
                        </div>
                        <div
                          className="mt-1"
                          style={{
                            fontFamily: 'DM Sans',
                            fontSize: '13px',
                            color: '#6B6560',
                          }}
                        >
                          {selectedWord.card?.english}
                        </div>

                        {/* Example sentence */}
                        {selectedWord.card?.exampleJP && (
                          <div
                            className="mt-3 p-2.5 rounded-[8px]"
                            style={{
                              backgroundColor: 'rgba(27, 79, 138, 0.04)',
                              border: '1px solid rgba(27, 79, 138, 0.1)',
                            }}
                          >
                            <p
                              style={{
                                fontFamily: 'Noto Sans JP',
                                fontSize: '13px',
                                color: '#1A1814',
                                lineHeight: 1.6,
                              }}
                            >
                              {selectedWord.card.exampleJP}
                            </p>
                            <p
                              className="mt-1"
                              style={{
                                fontFamily: 'DM Sans',
                                fontSize: '11px',
                                color: '#9E9892',
                              }}
                            >
                              {selectedWord.card.exampleEN}
                            </p>
                          </div>
                        )}

                        {/* Mastery bar */}
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span
                              style={{
                                fontFamily: 'DM Sans',
                                fontSize: '10px',
                                color: '#9E9892',
                              }}
                            >
                              Mastery
                            </span>
                            <span
                              style={{
                                fontFamily: 'DM Sans',
                                fontSize: '10px',
                                color:
                                  selectedWord.userCard?.status === 'mastered'
                                    ? '#3D6B4F'
                                    : '#6B6560',
                              }}
                            >
                              {selectedWord.userCard?.status === 'mastered'
                                ? 'Mastered'
                                : `${selectedWord.userCard?.encounterCount || 0} encounters`}
                            </span>
                          </div>
                          <div
                            className="w-full h-[3px] rounded-full overflow-hidden"
                            style={{ backgroundColor: '#E0DAD2' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width:
                                  selectedWord.userCard?.status === 'mastered'
                                    ? '100%'
                                    : `${Math.min(
                                        100,
                                        ((selectedWord.userCard?.encounterCount || 0) /
                                          5) *
                                          100,
                                      )}%`,
                                backgroundColor:
                                  selectedWord.userCard?.status === 'mastered'
                                    ? '#3D6B4F'
                                    : '#1B4F8A',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
