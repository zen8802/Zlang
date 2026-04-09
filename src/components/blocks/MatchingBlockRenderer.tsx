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
        <div className="text-5xl">&#9989;</div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
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
      <p className="text-center text-sm text-[#6B6560] font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
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
                  p-3 rounded-[8px] text-left font-semibold transition-all duration-150
                  ${
                    isMatched
                      ? 'bg-[#EFF5F0] border border-[#B8D4C0] text-[#3D6B4F] opacity-70'
                      : isSelected
                      ? 'bg-[#1B4F8A] text-white border border-[#1B4F8A]'
                      : 'bg-[#FDFBF8] border border-[#E0DAD2] text-[#1A1814]'
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
                  p-3 rounded-[8px] text-left font-semibold transition-all duration-150
                  ${
                    isMatched
                      ? 'bg-[#EFF5F0] border border-[#B8D4C0] text-[#3D6B4F] opacity-70'
                      : isWrong
                      ? 'bg-[#F5EEEE] border border-[#D4BABA] text-[#8B3A3A]'
                      : 'bg-[#FDFBF8] border border-[#E0DAD2] text-[#1A1814]'
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
