'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
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
  lessonTitle?: string
  lessonSubtitle?: string
  estimatedMinutes?: number
  wordCount?: number
  onStartRetry: () => void
}

export default function LearnPhase({
  diagnosis,
  lessonBlocks,
  lessonTitle,
  lessonSubtitle,
  estimatedMinutes,
  wordCount,
  onStartRetry,
}: LearnPhaseProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([])
  const [xpEarned, setXpEarned] = useState(0)
  const [showPhraseVictory, setShowPhraseVictory] = useState(false)

  const { user } = useUser()

  const finalizedRef = useRef(false)

  const totalBlocks = lessonBlocks.length
  const allDone = completedBlocks.length >= totalBlocks
  const progress = totalBlocks > 0 ? (completedBlocks.length / totalBlocks) * 100 : 0

  const focusText = diagnosis?.focus || diagnosis?.focusArea || null
  const learnedItems = diagnosis?.learnedItems || diagnosis?.summary || []

  const targetPhrase: string | undefined = diagnosis?.targetPhrase
  const targetPhraseEN: string | undefined = diagnosis?.targetPhraseEN

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

  // When all blocks done: optionally show victory, then fire onStartRetry
  useEffect(() => {
    if (!allDone || totalBlocks === 0) return
    if (finalizedRef.current) return
    finalizedRef.current = true

    // Legacy kana persistence removed — lessons no longer teach individual kana
    void user

    if (targetPhrase) {
      setShowPhraseVictory(true)
      const t = setTimeout(() => {
        setShowPhraseVictory(false)
        onStartRetry()
      }, 2500)
      return () => clearTimeout(t)
    } else {
      onStartRetry()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, totalBlocks])

  // --- Phrase victory full-screen ink-in moment ---
  if (showPhraseVictory && targetPhrase) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 animate-fade-in"
        style={{ backgroundColor: '#F5F0EB' }}
      >
        <p
          className="text-sm mb-6"
          style={{ fontFamily: 'Shippori Mincho', color: '#6B6560' }}
        >
          You can now write
        </p>
        <p
          className="text-center mb-4"
          style={{
            fontFamily: 'Noto Sans JP',
            fontWeight: 300,
            fontSize: '52px',
            color: '#1A1814',
            lineHeight: 1.2,
          }}
        >
          {targetPhrase}
        </p>
        {targetPhraseEN && (
          <p
            className="text-center"
            style={{
              fontFamily: 'Shippori Mincho',
              fontSize: '18px',
              color: '#6B6560',
            }}
          >
            {targetPhraseEN}
          </p>
        )}
      </div>
    )
  }

  // --- Summary view when all blocks done (fallback if victory doesn't show) ---
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

        {/* Lesson title + subtitle — shown only on the first block. Replaces
            the generic "fill in the gaps" line when a proper title was
            generated. */}
        {currentBlockIndex === 0 && completedBlocks.length === 0 && (
          <div className="text-center py-2">
            {lessonTitle ? (
              <>
                <p
                  style={{
                    fontFamily: 'Shippori Mincho',
                    fontSize: '22px',
                    color: '#1A1814',
                  }}
                >
                  {lessonTitle}
                </p>
                {lessonSubtitle && (
                  <p
                    style={{
                      fontFamily: 'DM Sans',
                      fontSize: '13px',
                      color: '#9E9892',
                      marginTop: '4px',
                    }}
                  >
                    {lessonSubtitle}
                  </p>
                )}
                {(wordCount || estimatedMinutes) && (
                  <p
                    style={{
                      fontFamily: 'DM Sans',
                      fontSize: '11px',
                      color: '#C8C3BC',
                      marginTop: '8px',
                    }}
                  >
                    {wordCount ? `${wordCount} word${wordCount !== 1 ? 's' : ''}` : ''}
                    {wordCount && estimatedMinutes ? ' · ' : ''}
                    {estimatedMinutes ? `~${estimatedMinutes} min` : ''}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm italic" style={{ fontFamily: 'Shippori Mincho', color: '#1B4F8A' }}>
                Let&apos;s fill in the gaps from your conversation
              </p>
            )}
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
