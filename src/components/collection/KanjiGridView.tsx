'use client'

import { useState, useMemo } from 'react'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'
import { GRADE_LABELS } from '@/data/kyouiku-kanji'
import { KanjiDetailPanel } from './KanjiDetailPanel'

interface Props {
  grade1Kanji: KyouikuKanji[]
  discoveredKanji: Set<string>
  seenKanji?: Set<string>
  userExperience: number
}

interface CellProps {
  kanji: KyouikuKanji
  isLearned: boolean
  isSeen: boolean
  isSelected: boolean
  onSelect: () => void
}

function KanjiCell({ kanji, isLearned, isSeen, isSelected, onSelect }: CellProps) {
  const tappable = isLearned || isSeen

  return (
    <button
      onClick={tappable ? onSelect : undefined}
      disabled={!tappable}
      className={`aspect-square rounded-[8px] flex flex-col items-center justify-center transition-all duration-200 ${
        tappable ? 'active:scale-95 cursor-pointer' : 'cursor-default'
      } ${isSelected ? 'ring-2 ring-[#C9920A] ring-offset-1' : ''}`}
      style={{
        backgroundColor: isLearned ? '#FDFBF8' : isSeen ? '#3D3632' : '#2C2924',
        border: isLearned
          ? '2px solid #C9920A'
          : isSeen
            ? '1.5px solid #4A4440'
            : '1.5px solid #1A1814',
        boxShadow: isLearned
          ? '0 0 12px rgba(201,146,10,0.2), 0 2px 6px rgba(0,0,0,0.06)'
          : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'Noto Sans JP',
          fontSize: '22px',
          fontWeight: isLearned ? 500 : 300,
          lineHeight: 1,
          color: isLearned ? '#C9920A' : isSeen ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.07)',
        }}
      >
        {kanji.character}
      </span>

      {isLearned && (
        <span
          style={{
            fontFamily: 'DM Mono',
            fontSize: '7px',
            color: '#C9920A',
            opacity: 0.7,
            marginTop: '2px',
          }}
        >
          {(kanji.kunReading[0] || kanji.onReading[0] || '').replace(/[-.]/g, '')}
        </span>
      )}

      {isSeen && !isLearned && (
        <span
          style={{
            fontFamily: 'DM Sans',
            fontSize: '7px',
            color: 'rgba(255,255,255,0.2)',
            marginTop: '2px',
          }}
        >
          tap
        </span>
      )}
    </button>
  )
}

export default function KanjiGridView({
  grade1Kanji,
  discoveredKanji,
  seenKanji = new Set(),
  userExperience,
}: Props) {
  const [selectedKanji, setSelectedKanji] = useState<KyouikuKanji | null>(null)

  const discoveredCount = useMemo(
    () => grade1Kanji.filter((k) => discoveredKanji.has(k.character)).length,
    [grade1Kanji, discoveredKanji],
  )

  const label = GRADE_LABELS[1]

  // Recompute current state for selected kanji from props (so closing+reopening reflects updates)
  const selectedIsLearned = selectedKanji ? discoveredKanji.has(selectedKanji.character) : false
  const selectedIsSeen = selectedKanji ? seenKanji.has(selectedKanji.character) : false

  return (
    <div className="px-2 py-3">
      {/* Grade header */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span
            style={{ fontFamily: 'Shippori Mincho', fontSize: '16px', fontWeight: 600, color: '#1A1814' }}
          >
            {label.jp} · {label.en}
          </span>
          <span style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#9E9892' }}>
            {discoveredCount}/80
          </span>
        </div>
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '12px', color: '#9E9892', marginTop: '2px' }}>
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
            style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#6B6560', lineHeight: 1.5 }}
          >
            Kanji become visible as you encounter them in conversations. Tap a visible character and
            complete its trace + write + speak to mark it learned.
          </p>
        </div>
      )}

      {/* Grid — top-down, right-to-left like traditional Japanese */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateRows: 'repeat(16, 1fr)',
          gridAutoFlow: 'column',
          gridTemplateColumns: 'repeat(5, 1fr)',
          direction: 'rtl',
        }}
      >
        {grade1Kanji.map((kanji) => {
          const isLearned = discoveredKanji.has(kanji.character)
          const isSeen = !isLearned && seenKanji.has(kanji.character)
          const isSelected = selectedKanji?.character === kanji.character
          return (
            <KanjiCell
              key={kanji.character}
              kanji={kanji}
              isLearned={isLearned}
              isSeen={isSeen}
              isSelected={isSelected}
              onSelect={() => setSelectedKanji(kanji)}
            />
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedKanji && (
        <KanjiDetailPanel
          kanji={selectedKanji}
          isLearned={selectedIsLearned}
          isSeen={selectedIsSeen}
          onClose={() => setSelectedKanji(null)}
        />
      )}
    </div>
  )
}
