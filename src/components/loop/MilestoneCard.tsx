'use client'

import { useCallback } from 'react'
import Button from '@/components/ui/Button'

interface MilestoneCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  onTryNew: () => void
  onDoAgain: () => void
}

export default function MilestoneCard({ session, onTryNew, onDoAgain }: MilestoneCardProps) {
  const succeeded = session?.phase === 'complete'
  const scenarioTitle = session?.scenarioTitle || 'Conversation'
  const attempts = session?.attempts || 1
  const xpEarned = session?.xpEarned || 0
  const bestLine = session?.bestLine || null
  const culturalInsight = session?.culturalInsight || null

  const handleShare = useCallback(async () => {
    const shareText = [
      scenarioTitle,
      bestLine ? `Best line: ${bestLine.japanese}` : '',
      bestLine?.english ? `"${bestLine.english}"` : '',
      `${attempts} attempt${attempts !== 1 ? 's' : ''} | +${xpEarned} XP`,
      '',
      'Learning Japanese with Zlang',
    ].filter(Boolean).join('\n')

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Zlang Loop - ${scenarioTitle}`,
          text: shareText,
        })
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText)
        alert('Copied to clipboard!')
      } catch {
        // Silently fail
      }
    }
  }, [scenarioTitle, bestLine, attempts, xpEarned])

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
              <span className="text-[12px]" style={{ fontFamily: 'Shippori Mincho', color: '#9E9892' }}>
                未来
              </span>
            </div>
          </div>
        </div>

        {/* Share button — simple text link */}
        <div className="text-center">
          <button
            onClick={handleShare}
            className="text-[13px] underline transition-opacity hover:opacity-70"
            style={{ fontFamily: 'DM Sans', color: '#1B4F8A' }}
          >
            → Share this
          </button>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2 pb-8">
          <Button variant="primary" size="lg" fullWidth onClick={onTryNew}>
            Try a new scenario
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onDoAgain}>
            Do this again
          </Button>
        </div>
      </div>
    </div>
  )
}
