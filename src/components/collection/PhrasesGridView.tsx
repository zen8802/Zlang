'use client'

import { useState } from 'react'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phrases: { card: any; userCard: any | null }[]
}

export default function PhrasesGridView({ phrases }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<{ card: any; userCard: any | null } | null>(null)

  if (phrases.length === 0) {
    return (
      <div className="text-center py-10">
        <p
          style={{
            fontFamily: 'DM Sans',
            fontSize: '13px',
            color: '#9E9892',
          }}
        >
          No phrases collected yet. Complete conversations to unlock expressions!
        </p>
      </div>
    )
  }

  return (
    <div className="px-2 py-3">
      <div className="grid grid-cols-2 gap-2">
        {phrases.map((entry, idx) => {
          const isCollected = entry.userCard !== null
          const isMastered = entry.userCard?.status === 'mastered'
          const isSelected = selected?.card?.id === entry.card?.id
          const word = entry.card?.word || ''

          return (
            <button
              key={entry.card?.id ?? idx}
              onClick={() => setSelected(isSelected ? null : entry)}
              className={`
                rounded-[8px] flex flex-col items-center justify-center
                cursor-pointer transition-all duration-150 p-3 min-h-[56px]
                ${isSelected ? 'ring-2 ring-[#1B4F8A]' : ''}
              `}
              style={
                isCollected
                  ? {
                      backgroundColor: isMastered ? '#FEF3C7' : '#FDFBF8',
                      border: `1.5px solid ${isMastered ? '#F59E0B' : '#E0DAD2'}`,
                    }
                  : {
                      backgroundColor: '#2C2924',
                      border: '1.5px solid #1A1814',
                    }
              }
            >
              {isCollected ? (
                <>
                  <span
                    style={{
                      fontFamily: 'Noto Sans JP',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#1A1814',
                      lineHeight: 1.3,
                      textAlign: 'center',
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
                      fontSize: '13px',
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.07)',
                      lineHeight: 1.3,
                      textAlign: 'center',
                    }}
                  >
                    {word}
                  </span>
                  <span
                    style={{
                      fontFamily: 'DM Mono',
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.07)',
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

      {/* Selected phrase detail card */}
      {selected && selected.userCard && (
        <div
          className="mt-3 rounded-[10px] p-4"
          style={{
            backgroundColor: '#FDFBF8',
            border: '1px solid #E0DAD2',
          }}
        >
          <div
            style={{
              fontFamily: 'Noto Sans JP',
              fontSize: '22px',
              fontWeight: 500,
              color: '#1A1814',
              lineHeight: 1.3,
            }}
          >
            {selected.card?.word}
          </div>
          <div
            className="mt-0.5"
            style={{
              fontFamily: 'DM Mono',
              fontSize: '13px',
              color: '#1B4F8A',
            }}
          >
            {selected.card?.romaji}
          </div>
          <div
            className="mt-1"
            style={{
              fontFamily: 'DM Sans',
              fontSize: '13px',
              color: '#6B6560',
            }}
          >
            {selected.card?.english}
          </div>

          {/* Example sentence */}
          {selected.card?.exampleJP && (
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
                {selected.card.exampleJP}
              </p>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: '11px',
                  color: '#9E9892',
                }}
              >
                {selected.card.exampleEN}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
