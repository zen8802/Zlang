'use client'

import { useState, useMemo } from 'react'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'
import { GRADE_LABELS } from '@/data/kyouiku-kanji'
import { checkLevelGate, deriveKanjiLevel } from '@/data/kanji-levels'
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

interface CellPropsWithIndex extends CellProps {
  pulseDelay?: number
}

function KanjiCell({ kanji, isLearned, isSeen, isSelected, onSelect, pulseDelay = 0 }: CellPropsWithIndex) {
  const tappable = isLearned || isSeen
  const showPulse = isSeen && !isLearned

  return (
    <button
      onClick={tappable ? onSelect : undefined}
      disabled={!tappable}
      className={`aspect-square rounded-[8px] flex flex-col items-center justify-center transition-all duration-200 ${
        tappable ? 'active:scale-95 cursor-pointer' : 'cursor-default'
      } ${isSelected ? 'ring-2 ring-[#C9920A] ring-offset-1' : ''} ${showPulse ? 'kanji-seen-pulse' : ''}`}
      style={{
        backgroundColor: isLearned ? '#FDFBF8' : isSeen ? '#3D3632' : '#2C2924',
        border: isLearned
          ? '2px solid #C9920A'
          : isSeen
            ? '1.5px solid #4A4440'
            : '1.5px solid #1A1814',
        // Learned cells get a static gold glow; pulse animation handles seen.
        boxShadow: isLearned
          ? '0 0 12px rgba(201,146,10,0.2), 0 2px 6px rgba(0,0,0,0.06)'
          : 'none',
        // Stagger so the grid doesn't pulse in lockstep
        animationDelay: showPulse ? `${pulseDelay}ms` : undefined,
      }}
    >
      <span
        className={showPulse ? 'kanji-seen-char' : ''}
        style={{
          fontFamily: 'Noto Sans JP',
          fontSize: '22px',
          fontWeight: isLearned ? 500 : 300,
          lineHeight: 1,
          color: isLearned
            ? '#C9920A'
            : isSeen
              // Opacity is animated via .kanji-seen-char keyframes; use a
              // solid color here so the keyframes can drive `opacity`.
              ? '#FFFFFF'
              : 'rgba(255,255,255,0.07)',
          // Provide a starting opacity for the pulse + a fallback for
          // reduced-motion users (the static 38% appearance).
          opacity: showPulse ? 0.38 : undefined,
          animationDelay: showPulse ? `${pulseDelay}ms` : undefined,
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
            color: 'rgba(255,255,255,0.3)',
            marginTop: '2px',
            letterSpacing: '0.04em',
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

  // Kanji level + gate to the next level (display-only; AI uses server value)
  const discoveredArr = useMemo(() => Array.from(discoveredKanji), [discoveredKanji])
  const userLevel = useMemo(() => deriveKanjiLevel(discoveredArr), [discoveredArr])
  const gate = useMemo(() => checkLevelGate(userLevel, discoveredArr), [userLevel, discoveredArr])
  const progressPercent = gate.required === 0 ? 0 : gate.progress / gate.required

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

      {/* Kanji level + gate progress */}
      {gate.nextLevel && (
        <div
          className="rounded-[10px] border px-4 py-3 mb-5"
          style={{ backgroundColor: '#FDFBF8', borderColor: '#E0DAD2' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              style={{
                fontFamily: 'DM Sans',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#9E9892',
              }}
            >
              KANJI LEVEL {userLevel}
            </p>
            {gate.canAdvance ? (
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: '11px',
                  color: '#C9920A',
                  fontWeight: 500,
                }}
              >
                Level {gate.nextLevel} ready →
              </p>
            ) : (
              <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#C8C3BC' }}>
                {gate.progress}/{gate.required} to Level {gate.nextLevel}
              </p>
            )}
          </div>

          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '4px', backgroundColor: '#E0DAD2' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, progressPercent * 100)}%`,
                backgroundColor: gate.canAdvance ? '#C9920A' : '#1B4F8A',
              }}
            />
          </div>

          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '11px',
              color: '#C8C3BC',
              marginTop: '8px',
            }}
          >
            Learn kanji here to unlock them in conversations
          </p>
        </div>
      )}

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
        {grade1Kanji.map((kanji, idx) => {
          const isLearned = discoveredKanji.has(kanji.character)
          const isSeen = !isLearned && seenKanji.has(kanji.character)
          const isSelected = selectedKanji?.character === kanji.character
          // 220ms stagger gives the grid a wave-like feel without ever
          // looking synchronized. 80 cells × 220ms wraps within the 3.4s loop.
          const pulseDelay = (idx * 220) % 3400
          return (
            <KanjiCell
              key={kanji.character}
              kanji={kanji}
              isLearned={isLearned}
              isSeen={isSeen}
              isSelected={isSelected}
              pulseDelay={pulseDelay}
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
