'use client'

import Button from '@/components/ui/Button'

interface MilestoneCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  onTryNew: () => void
  onDoAgain?: () => void
  /** Open the conversation transcript in review mode. */
  onReviewConversation?: () => void
  /** Open the generated lesson in review mode. */
  onReviewLesson?: () => void
}

export default function MilestoneCard({
  session,
  onTryNew,
  onReviewConversation,
  onReviewLesson,
}: MilestoneCardProps) {
  const succeeded = session?.phase === 'complete'
  const scenarioTitle = session?.scenarioTitle || 'Conversation'
  const attempts = session?.attempts || 1
  const xpEarned = session?.xpEarned || 0
  const bestLine = session?.bestLine || null
  const culturalInsight = session?.culturalInsight || null

  const hasConversation = Array.isArray(session?.attemptMessages) && session.attemptMessages.length > 0
  const hasLesson = Array.isArray(session?.lessonBlocks) && session.lessonBlocks.length > 0

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Shareable milestone card — printed keepsake style */}
        <div
          className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[4px] overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(26,24,20,0.08)' }}
        >
          {/* Header section */}
          <div className="bg-[#1B4F8A] px-6 py-5 text-center">
            <h1 className="text-[18px] text-white" style={{ fontFamily: 'Shippori Mincho' }}>
              {succeeded ? 'Loop Complete' : 'Nice effort'}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.1em] text-white/60 mt-1">
              {scenarioTitle}
            </p>
          </div>

          <div className="px-6 py-5">
            {/* Best Japanese line */}
            {bestLine && (
              <div className="mb-4">
                <p
                  className="text-[24px] leading-relaxed"
                  style={{ fontFamily: 'Noto Sans JP', fontWeight: 400, color: '#1A1814' }}
                >
                  {bestLine.japanese}
                </p>
                {bestLine.english && (
                  <p
                    className="text-[14px] mt-1 italic"
                    style={{ fontFamily: 'DM Sans', fontWeight: 300, color: '#6B6560' }}
                  >
                    {bestLine.english}
                  </p>
                )}
                <hr className="border-[#E0DAD2] mt-4" />
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center justify-center gap-6 py-3">
              <div className="text-center">
                <p
                  className="text-2xl font-semibold"
                  style={{ color: '#1B4F8A' }}
                >
                  {attempts}
                </p>
                <p className="text-xs font-semibold" style={{ color: '#9E9892' }}>
                  Attempt{attempts !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-px h-10 bg-[#E0DAD2]" />
              <div className="text-center">
                <p
                  className="text-2xl font-semibold"
                  style={{ color: '#7A5C2E' }}
                >
                  +{xpEarned}
                </p>
                <p className="text-xs font-semibold" style={{ color: '#9E9892' }}>
                  XP
                </p>
              </div>
            </div>

            {/* Cultural insight */}
            {culturalInsight && (
              <div
                className="rounded-[6px] px-3.5 py-2.5 mt-3 bg-transparent border-l-[2px] border-[#1B4F8A]/30"
              >
                <p className="text-[13px] leading-relaxed italic" style={{ color: '#6B6560' }}>
                  ↳ {culturalInsight}
                </p>
              </div>
            )}

            {/* Colophon mark */}
            <div className="text-center mt-5">
              <span
                style={{
                  fontFamily: 'Geist, sans-serif',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#bbead6',
                }}
              >
                KOMBU
              </span>
            </div>
          </div>
        </div>

        {/* Review — go back and look at what happened */}
        {(hasConversation || hasLesson) && (onReviewConversation || onReviewLesson) && (
          <div className="grid grid-cols-2 gap-2 pt-3">
            {hasConversation && onReviewConversation && (
              <button
                onClick={onReviewConversation}
                className="rounded-[10px] border px-3 py-3 text-sm font-medium transition-colors hover:bg-[#EBF0F8]"
                style={{
                  fontFamily: 'DM Sans',
                  borderColor: '#E0DAD2',
                  backgroundColor: '#FDFBF8',
                  color: '#1B4F8A',
                }}
              >
                Review conversation
              </button>
            )}
            {hasLesson && onReviewLesson && (
              <button
                onClick={onReviewLesson}
                className="rounded-[10px] border px-3 py-3 text-sm font-medium transition-colors hover:bg-[#EBF0F8]"
                style={{
                  fontFamily: 'DM Sans',
                  borderColor: '#E0DAD2',
                  backgroundColor: '#FDFBF8',
                  color: '#1B4F8A',
                }}
              >
                Review lesson
              </button>
            )}
          </div>
        )}

        {/* Done — return to dashboard */}
        <div className="pt-4 pb-8">
          <Button variant="primary" size="lg" fullWidth onClick={onTryNew}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
