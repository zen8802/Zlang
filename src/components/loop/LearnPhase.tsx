'use client'

import { useState, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import type { LessonBlock } from '@/types/lesson-blocks'

interface LearnPhaseProps {
  sessionId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diagnosis: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lessonBlocks: any[]
  onStartRetry: () => void
}

export default function LearnPhase({ diagnosis, lessonBlocks, onStartRetry }: LearnPhaseProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([])
  const [xpEarned, setXpEarned] = useState(0)

  const totalBlocks = lessonBlocks.length
  const allDone = completedBlocks.length >= totalBlocks
  const progress = totalBlocks > 0 ? (completedBlocks.length / totalBlocks) * 100 : 0

  const focusText = diagnosis?.focus || diagnosis?.focusArea || null
  const learnedItems = diagnosis?.learnedItems || diagnosis?.summary || []

  const handleBlockComplete = useCallback((blockXp: number) => {
    setXpEarned(prev => prev + blockXp)
    setCompletedBlocks(prev => {
      const next = [...prev, currentBlockIndex]
      return next
    })
    // Move to next block
    if (currentBlockIndex < totalBlocks - 1) {
      setCurrentBlockIndex(prev => prev + 1)
    }
  }, [currentBlockIndex, totalBlocks])

  // --- Summary view when all blocks done ---
  if (allDone) {
    return (
      <div className="h-full overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Celebration */}
          <div className="text-center py-4">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'Shippori Mincho', color: '#1B4F8A' }}>
              Now you know...
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
              +{xpEarned} XP earned from learning
            </p>
          </div>

          {/* Learned items summary */}
          <div className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] p-5">
            <div className="space-y-3">
              {Array.isArray(learnedItems) && learnedItems.length > 0 ? (
                learnedItems.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-sm mt-0.5 text-[#3D6B4F]">--</span>
                    <p className="text-sm" style={{ color: '#1A1814' }}>
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5 text-[#3D6B4F]">--</span>
                    <p className="text-sm" style={{ color: '#1A1814' }}>
                      Vocabulary from this conversation
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5 text-[#3D6B4F]">--</span>
                    <p className="text-sm" style={{ color: '#1A1814' }}>
                      Grammar patterns you struggled with
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5 text-[#3D6B4F]">--</span>
                    <p className="text-sm" style={{ color: '#1A1814' }}>
                      Cultural context for natural speech
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Retry CTA */}
          <div className="pt-2 pb-8">
            <Button variant="primary" size="lg" fullWidth onClick={onStartRetry}>
              Try again →
            </Button>
            <p className="text-xs text-center mt-2" style={{ color: '#9E9892' }}>
              Same scenario, but now you know the words. Nail it!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Learning blocks view ---
  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold" style={{ color: '#9E9892' }}>
              Learning: {completedBlocks.length}/{totalBlocks}
            </span>
            <Badge color="blue" size="sm">+{xpEarned} XP</Badge>
          </div>
          <ProgressBar value={progress} color="#1B4F8A" height={10} />
        </div>

        {/* Focus area */}
        {focusText && (
          <div className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] px-4 py-3">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs font-semibold" style={{ color: '#9E9892' }}>
                  Focus
                </p>
                <p className="text-sm font-semibold" style={{ fontFamily: 'Noto Sans JP', color: '#1A1814' }}>
                  {focusText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Encouragement on first block */}
        {currentBlockIndex === 0 && completedBlocks.length === 0 && (
          <div className="text-center py-2">
            <p className="text-sm italic" style={{ fontFamily: 'Shippori Mincho', color: '#1B4F8A' }}>
              Let&apos;s fill in the gaps from your conversation
            </p>
          </div>
        )}

        {/* Current block */}
        {lessonBlocks[currentBlockIndex] && (
          <div className="pb-8">
            <BlockRenderer
              block={lessonBlocks[currentBlockIndex] as LessonBlock}
              onComplete={handleBlockComplete}
            />
          </div>
        )}

        {/* Manual advance if block doesn't auto-complete */}
        {!completedBlocks.includes(currentBlockIndex) && lessonBlocks[currentBlockIndex] && (
          <div className="text-center pb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBlockComplete(5)}
            >
              Skip →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
