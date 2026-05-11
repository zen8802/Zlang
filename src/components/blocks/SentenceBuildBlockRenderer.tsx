'use client'

import { useState } from 'react'
import { renderFurigana } from '@/components/japanese/FuriganaText'

interface Block {
  title?: string
  targetSentenceJP: string
  targetSentenceEN: string
  tiles: string[]
  correctTiles: string[]
  explanation?: string
}

interface Props {
  block: Block
  onComplete: (xp: number) => void
}

function stripFuri(s: string): string {
  return (s || '').replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
}

export default function SentenceBuildBlockRenderer({ block, onComplete }: Props) {
  const tiles = Array.isArray(block.tiles) ? block.tiles : []
  const correct = Array.isArray(block.correctTiles) ? block.correctTiles : []

  // Shuffle once on mount
  const [shuffled] = useState(() => [...tiles].sort(() => Math.random() - 0.5))
  const [picked, setPicked] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const remainingIndexes = shuffled.map((_, i) => i).filter((i) => !picked.includes(i))
  const pickedTiles = picked.map((i) => shuffled[i])

  const handlePick = (i: number) => {
    if (submitted) return
    setPicked((p) => [...p, i])
  }

  const handleRemove = (slot: number) => {
    if (submitted) return
    setPicked((p) => p.filter((_, idx) => idx !== slot))
  }

  const handleCheck = () => {
    const assembled = stripFuri(pickedTiles.join(''))
    const target = stripFuri(correct.join('')) || stripFuri(block.targetSentenceJP).replace(/\s/g, '')
    setIsCorrect(assembled === target)
    setSubmitted(true)
  }

  const handleReset = () => {
    setPicked([])
    setSubmitted(false)
    setIsCorrect(false)
  }

  return (
    <div className="space-y-5 py-2">
      <div>
        <h2 style={{ fontFamily: 'Shippori Mincho', fontSize: '22px', color: '#1A1814' }}>
          {block.title || 'Put it together'}
        </h2>
        <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: '#9E9892', marginTop: '4px' }}>
          {block.targetSentenceEN}
        </p>
      </div>

      {/* Assembly area */}
      <div
        className="min-h-16 rounded-[12px] p-3 flex flex-wrap gap-2 items-start content-start"
        style={{
          backgroundColor: submitted ? (isCorrect ? '#EFF5F0' : '#F5EEEE') : '#F5F0EB',
          border: `2px ${submitted ? 'solid' : 'dashed'}`,
          borderColor: submitted ? (isCorrect ? '#3D6B4F' : '#8B3A3A') : '#D4CFC8',
          transition: 'all 0.3s ease',
        }}
      >
        {pickedTiles.length === 0 && !submitted && (
          <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: '#C8C3BC', padding: '4px' }}>
            Tap tiles to build the sentence
          </p>
        )}
        {pickedTiles.map((tile, slot) => (
          <button
            key={slot}
            onClick={() => handleRemove(slot)}
            disabled={submitted}
            className="px-3 py-2 rounded-[8px] text-sm border-2 transition-all disabled:cursor-default"
            style={{
              fontFamily: 'Noto Sans JP',
              backgroundColor: submitted ? (isCorrect ? '#EFF5F0' : '#F5EEEE') : '#EBF0F8',
              borderColor: submitted ? (isCorrect ? '#3D6B4F' : '#8B3A3A') : '#1B4F8A',
              color: submitted ? (isCorrect ? '#3D6B4F' : '#8B3A3A') : '#1B4F8A',
            }}
          >
            {renderFurigana(tile, '0.4em')}
          </button>
        ))}
      </div>

      {/* Result */}
      {submitted && (
        <div className="space-y-1">
          {isCorrect ? (
            <p style={{ fontFamily: 'DM Sans', fontSize: '14px', color: '#3D6B4F', fontWeight: 500 }}>
              ✓ {renderFurigana(block.targetSentenceJP)}
            </p>
          ) : (
            <>
              <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: '#8B3A3A' }}>Not quite</p>
              <p style={{ fontFamily: 'Noto Sans JP', fontSize: '14px', color: '#3D6B4F', fontWeight: 300 }}>
                Answer: {renderFurigana(block.targetSentenceJP)}
              </p>
            </>
          )}
          {block.explanation && (
            <p
              style={{
                fontFamily: 'DM Sans',
                fontSize: '12px',
                color: '#9E9892',
                marginTop: '4px',
                fontStyle: 'italic',
              }}
            >
              {block.explanation}
            </p>
          )}
        </div>
      )}

      {/* Tile bank */}
      {!submitted && (
        <div className="flex flex-wrap gap-2">
          {remainingIndexes.map((i) => (
            <button
              key={i}
              onClick={() => handlePick(i)}
              className="px-3 py-2 rounded-[8px] text-sm border transition-all active:translate-y-px"
              style={{
                fontFamily: 'Noto Sans JP',
                backgroundColor: '#FDFBF8',
                borderColor: '#E0DAD2',
                color: '#1A1814',
              }}
            >
              {renderFurigana(shuffled[i], '0.4em')}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      {!submitted && pickedTiles.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-[10px] border border-[#E0DAD2] text-sm text-[#6B6560]"
            style={{ fontFamily: 'DM Sans' }}
          >
            Reset
          </button>
          <button
            onClick={handleCheck}
            className="flex-1 py-3 rounded-[10px] bg-[#1B4F8A] text-white text-sm font-medium"
            style={{ fontFamily: 'DM Sans' }}
          >
            Check
          </button>
        </div>
      )}

      {submitted && (
        <button
          onClick={() => onComplete(isCorrect ? 20 : 10)}
          className="w-full py-4 rounded-[10px] bg-[#1B4F8A] text-white text-sm font-medium transition-all active:translate-y-px"
          style={{ fontFamily: 'DM Sans' }}
        >
          Last one →
        </button>
      )}
    </div>
  )
}
