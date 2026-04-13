'use client'

import { useMemo } from 'react'
import type { KanaCell } from '@/data/hiragana-grid'

interface Props {
  grid: (KanaCell | null)[][]
  discovered: Set<string>
  rowLabels: string[]
  colLabels: string[]
  selectedChar: KanaCell | null
  onSelectChar: (char: KanaCell) => void
  isAbsoluteBeginner: boolean
  isKatakana?: boolean
}

export default function HiraganaGridView({
  grid,
  discovered,
  rowLabels,
  colLabels,
  selectedChar,
  onSelectChar,
  isAbsoluteBeginner,
  isKatakana = false,
}: Props) {
  const totalCells = useMemo(() => {
    let count = 0
    for (const row of grid) {
      for (const cell of row) {
        if (cell) count++
      }
    }
    return count
  }, [grid])

  const discoveredCount = useMemo(() => {
    let count = 0
    for (const row of grid) {
      for (const cell of row) {
        if (cell && discovered.has(cell.character)) count++
      }
    }
    return count
  }, [grid, discovered])

  const pct = totalCells > 0 ? (discoveredCount / totalCells) * 100 : 0
  const isComplete = discoveredCount >= 46

  return (
    <div className="px-2 py-3">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span
            style={{
              fontFamily: 'DM Sans',
              fontSize: '11px',
              color: '#6B6560',
            }}
          >
            {discoveredCount} / {totalCells} discovered
          </span>
          <span
            style={{
              fontFamily: 'DM Sans',
              fontSize: '11px',
              color: isComplete ? '#3D6B4F' : '#9E9892',
            }}
          >
            {Math.round(pct)}%
          </span>
        </div>
        <div
          className="w-full overflow-hidden rounded-full"
          style={{ height: '3px', backgroundColor: '#E0DAD2' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              backgroundColor: isComplete ? '#3D6B4F' : '#1B4F8A',
            }}
          />
        </div>
      </div>

      {/* Beginner callout */}
      {isAbsoluteBeginner && discoveredCount === 0 && (
        <div
          className="rounded-[10px] p-4 mb-4"
          style={{
            backgroundColor: 'rgba(27, 79, 138, 0.06)',
            border: '1px solid rgba(27, 79, 138, 0.15)',
          }}
        >
          <p
            style={{
              fontFamily: 'Shippori Mincho',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1B4F8A',
              marginBottom: '4px',
            }}
          >
            {isKatakana ? 'Katakana awaits!' : 'Start discovering hiragana!'}
          </p>
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '12px',
              color: '#6B6560',
            }}
          >
            Complete conversations to reveal characters. Each one you encounter lights up here.
          </p>
        </div>
      )}

      {/* Completion banner */}
      {isComplete && (
        <div
          className="rounded-[10px] p-4 mb-4"
          style={{
            backgroundColor: 'rgba(61, 107, 79, 0.06)',
            border: '1px solid rgba(61, 107, 79, 0.15)',
          }}
        >
          <p
            style={{
              fontFamily: 'Shippori Mincho',
              fontSize: '14px',
              fontWeight: 600,
              color: '#3D6B4F',
              marginBottom: '4px',
            }}
          >
            {isKatakana ? 'All katakana discovered!' : 'All hiragana discovered!'}
          </p>
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '12px',
              color: '#6B6560',
            }}
          >
            You have encountered every character. Keep practicing to master them!
          </p>
        </div>
      )}

      {/* Column headers */}
      <div
        className="grid gap-1 mb-1"
        style={{ gridTemplateColumns: '32px repeat(5, 1fr)' }}
      >
        <div /> {/* empty corner */}
        {colLabels.map((label) => (
          <div
            key={label}
            className="text-center"
            style={{
              fontFamily: 'DM Mono',
              fontSize: '9px',
              color: '#9E9892',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {grid.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-1 mb-1"
          style={{ gridTemplateColumns: '32px repeat(5, 1fr)' }}
        >
          {/* Row label */}
          <div
            className="flex items-center justify-center"
            style={{
              fontFamily: 'Noto Sans JP',
              fontSize: '9px',
              color: '#9E9892',
              fontWeight: 300,
            }}
          >
            {rowLabels[rowIdx]}
          </div>

          {/* Character cells */}
          {row.map((cell, colIdx) => {
            if (!cell) {
              return <div key={colIdx} />
            }

            const isDiscovered = discovered.has(cell.character)
            const isSelected =
              selectedChar?.character === cell.character

            return (
              <button
                key={cell.character}
                onClick={() => onSelectChar(cell)}
                className={`
                  aspect-square rounded-[8px] flex flex-col items-center justify-center
                  cursor-pointer transition-all duration-150
                  ${isSelected ? 'ring-2 ring-[#1B4F8A]' : ''}
                `}
                style={
                  isDiscovered
                    ? {
                        backgroundColor: '#FDFBF8',
                        border: '1.5px solid #E0DAD2',
                      }
                    : {
                        backgroundColor: '#DDD7CF',
                        border: '1.5px solid #D4CFC8',
                      }
                }
              >
                {isDiscovered ? (
                  <>
                    <span
                      style={{
                        fontFamily: 'Noto Sans JP',
                        fontSize: '18px',
                        fontWeight: 300,
                        color: '#1A1814',
                        lineHeight: 1.2,
                      }}
                    >
                      {cell.character}
                    </span>
                    <span
                      style={{
                        fontFamily: 'DM Mono',
                        fontSize: '8px',
                        color: '#9E9892',
                        lineHeight: 1,
                      }}
                    >
                      {cell.romaji}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontFamily: 'Noto Sans JP',
                        fontSize: '18px',
                        fontWeight: 300,
                        color: 'rgba(26,24,20,0.10)',
                        lineHeight: 1.2,
                      }}
                    >
                      {cell.character}
                    </span>
                    <span
                      style={{
                        fontFamily: 'DM Mono',
                        fontSize: '8px',
                        color: 'rgba(26,24,20,0.15)',
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
      ))}
    </div>
  )
}
