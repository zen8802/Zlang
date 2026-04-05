'use client'

import { useState } from 'react'
import type { Lesson } from '@/types/lesson-blocks'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import BlockRenderer from '@/components/blocks/BlockRenderer'

interface Props {
  lesson: Lesson
  onLessonComplete?: (totalXP: number) => void
}

export default function LessonRunner({ lesson, onLessonComplete }: Props) {
  const [blockIndex, setBlockIndex] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [completed, setCompleted] = useState(false)

  const progress = lesson.blocks.length > 0
    ? ((blockIndex + (completed ? 1 : 0)) / lesson.blocks.length) * 100
    : 0

  const handleBlockComplete = (xp: number) => {
    const newXP = totalXP + xp
    setTotalXP(newXP)

    if (blockIndex + 1 < lesson.blocks.length) {
      setBlockIndex(blockIndex + 1)
    } else {
      setCompleted(true)
    }
  }

  const handleFinish = () => {
    if (onLessonComplete) {
      onLessonComplete(totalXP)
    } else {
      window.location.href = '/dashboard'
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
        {/* Big green checkmark */}
        <div className="bounce-in">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
            <circle cx="48" cy="48" r="48" fill="#58CC02" />
            <path
              d="M28 48L42 62L68 36"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-ui)' }}>
          Lesson Complete!
        </h1>

        {/* XP card */}
        <Card variant="elevated" className="text-center w-full max-w-xs">
          <div className="bg-[#FFF3CC] rounded-[16px] p-4">
            <p className="text-sm text-[#CC7700] font-bold" style={{ fontFamily: 'var(--font-ui)' }}>
              XP Earned
            </p>
            <p className="text-4xl font-extrabold text-[#FFB800] xp-appear" style={{ fontFamily: 'var(--font-ui)' }}>
              +{totalXP}
            </p>
          </div>
        </Card>

        <Button onClick={handleFinish} fullWidth size="lg">
          Continue
        </Button>
      </div>
    )
  }

  const currentBlock = lesson.blocks[blockIndex]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar: progress + close */}
      <div className="sticky top-0 z-30 bg-[#F5F0EB] px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => {
            if (confirm('Leave this lesson? Progress will be lost.')) {
              window.location.href = '/dashboard'
            }
          }}
          className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#1A1A2E] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} color="#58CC02" height={10} />
        </div>
        <span className="text-xs text-[#6B7280] font-bold min-w-[40px] text-right" style={{ fontFamily: 'var(--font-ui)' }}>
          {blockIndex + 1}/{lesson.blocks.length}
        </span>
      </div>

      {/* Block content */}
      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full" key={currentBlock.id}>
        <BlockRenderer block={currentBlock} onComplete={handleBlockComplete} />
      </div>
    </div>
  )
}
