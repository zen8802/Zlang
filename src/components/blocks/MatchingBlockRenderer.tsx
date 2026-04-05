'use client'

import { useState } from 'react'
import type { MatchingBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: MatchingBlock
  onComplete: (xp: number) => void
}

export default function MatchingBlockRenderer({ block, onComplete }: Props) {
  const [shuffledRight] = useState(() =>
    [...block.pairs].sort(() => Math.random() - 0.5)
  )
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongFlash, setWrongFlash] = useState<string | null>(null)

  const allMatched = matched.size === block.pairs.length

  const handleLeftClick = (id: string) => {
    if (matched.has(id)) return
    setSelectedLeft(id)
  }

  const handleRightClick = (pair: { id: string; right: string }) => {
    if (!selectedLeft || matched.has(pair.id)) return

    if (pair.id === selectedLeft) {
      // Correct match
      setMatched((prev) => {
        const next = new Set(prev)
        next.add(pair.id)
        return next
      })
      setSelectedLeft(null)
    } else {
      // Wrong
      setWrongFlash(pair.id)
      setTimeout(() => setWrongFlash(null), 400)
    }
  }

  if (allMatched) {
    return (
      <div className="page-enter flex flex-col items-center gap-6 py-8">
        <div className="text-5xl bounce-in">&#9989;</div>
        <h2 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-ui)' }}>
          All Matched!
        </h2>
        <Button onClick={() => onComplete(block.xpReward)} fullWidth>
          Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col gap-5 py-4">
      <p className="text-center text-sm text-[#6B7280] font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
        Match Japanese to English
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column - Japanese */}
        <div className="flex flex-col gap-2">
          {block.pairs.map((p) => {
            const isMatched = matched.has(p.id)
            const isSelected = selectedLeft === p.id

            return (
              <button
                key={p.id}
                onClick={() => handleLeftClick(p.id)}
                disabled={isMatched}
                className={`
                  p-3 rounded-[16px] text-left font-bold transition-all duration-150
                  ${
                    isMatched
                      ? 'bg-[#E5F9D0] border-2 border-[#89E219] text-[#2D8800] opacity-70'
                      : isSelected
                      ? 'bg-[#1B4F8A] text-white shadow-[0_4px_0_#133970] border-2 border-[#1B4F8A]'
                      : 'bg-white border-2 border-[#B8CBE0] text-[#1A1A2E] shadow-[0_4px_0_#B8CBE0]'
                  }
                `}
                style={{ fontFamily: 'var(--font-jp)' }}
              >
                {p.left}
              </button>
            )
          })}
        </div>

        {/* Right column - English (shuffled) */}
        <div className="flex flex-col gap-2">
          {shuffledRight.map((p) => {
            const isMatched = matched.has(p.id)
            const isWrong = wrongFlash === p.id

            return (
              <button
                key={p.id}
                onClick={() => handleRightClick(p)}
                disabled={isMatched}
                className={`
                  p-3 rounded-[16px] text-left font-bold transition-all duration-150
                  ${
                    isMatched
                      ? 'bg-[#E5F9D0] border-2 border-[#89E219] text-[#2D8800] opacity-70'
                      : isWrong
                      ? 'bg-[#FFE5E5] border-2 border-[#FF4B4B] text-[#CC0000]'
                      : 'bg-white border-2 border-[#B8CBE0] text-[#1A1A2E] shadow-[0_4px_0_#B8CBE0]'
                  }
                `}
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {p.right}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
