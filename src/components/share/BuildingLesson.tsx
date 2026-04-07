'use client'

import { useEffect, useState } from 'react'
import type { ParsedUrl } from '@/lib/url-parser'

type BuildStep = 'meta' | 'transcribing' | 'generating' | 'streaming'

const STEPS: { key: BuildStep; label: string; labelJP: string; percent: number }[] = [
  { key: 'meta', label: 'Reading video info', labelJP: '動画情報を取得中', percent: 10 },
  { key: 'transcribing', label: 'Listening to audio', labelJP: '音声を聞いています', percent: 40 },
  { key: 'generating', label: 'Building your lesson', labelJP: 'レッスンを作成中', percent: 75 },
  { key: 'streaming', label: 'Almost ready', labelJP: 'もうすぐ完成', percent: 92 },
]

const TIPS = [
  'AssemblyAI is transcribing the real Japanese audio...',
  'This usually takes 15-30 seconds for short videos',
  'Longer videos take a bit more time',
  'Real speech-to-text is worth the wait!',
  'Claude is analyzing every sentence for you...',
]

export default function BuildingLesson({ parsed, step = 'meta' }: { parsed: ParsedUrl | null; step?: BuildStep }) {
  const [elapsed, setElapsed] = useState(0)
  const [tipIdx, setTipIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const currentStep = STEPS.find(s => s.key === step) || STEPS[0]
  const currentStepIdx = STEPS.findIndex(s => s.key === step)

  // Smooth progress: interpolate between step percents based on time
  const basePercent = currentStep.percent
  const nextPercent = STEPS[currentStepIdx + 1]?.percent || 100
  const interpolated = Math.min(basePercent + (elapsed % 20) * 0.5, nextPercent - 2)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Video playing at top */}
      <div style={{ height: '45vh' }}>
        {parsed && (
          <iframe src={parsed.embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
        )}
      </div>

      {/* Loading panel */}
      <div className="flex-1 bg-background rounded-t-3xl flex flex-col items-center px-6 pt-8" style={{ marginTop: '-16px' }}>
        {/* Step indicators */}
        <div className="w-full max-w-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  i < currentStepIdx ? 'bg-[#58CC02] text-white' :
                  i === currentStepIdx ? 'bg-[#1B4F8A] text-white shadow-[0_3px_0_#133970]' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {i < currentStepIdx ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-1 mx-1 rounded-full transition-all duration-500 ${
                    i < currentStepIdx ? 'bg-[#58CC02]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mb-4">
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${interpolated}%`,
                background: 'linear-gradient(90deg, #1B4F8A, #3B82F6)',
                boxShadow: '0 2px 4px rgba(27,79,138,0.3)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs font-bold text-[#1B4F8A]">{Math.round(interpolated)}%</span>
            <span className="text-xs text-[#9CA3AF]">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Current step label */}
        <div className="text-center mb-4">
          <p className="text-base font-black text-[#1A1A2E]" style={{ fontFamily: 'Nunito' }}>
            {currentStep.label}
          </p>
          <p className="text-sm text-[#1B4F8A] mt-0.5" style={{ fontFamily: 'Noto Sans JP' }}>
            {currentStep.labelJP}
          </p>
        </div>

        {/* Tip — rotates every 5s */}
        <p className="text-xs text-[#9CA3AF] text-center max-w-xs transition-opacity duration-500" style={{ fontFamily: 'Nunito' }}>
          {TIPS[tipIdx]}
        </p>
      </div>
    </div>
  )
}
