'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AttemptPhase from '@/components/loop/AttemptPhase'
import LearnPhase from '@/components/loop/LearnPhase'
import RetryPhase from '@/components/loop/RetryPhase'
import MilestoneCard from '@/components/loop/MilestoneCard'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Phase = 'loading' | 'attempt' | 'diagnosing' | 'learn' | 'retry' | 'complete'

interface LoopSession {
  id: string
  scenarioId: string
  scenarioTitle: string
  scenarioTitleJP: string
  scenarioEmoji: string
  characterName: string
  characterNameJP: string
  characterColor: string
  characterAvatar: string
  voiceId: string
  characterDescription: string
  phase: Phase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retryMessages: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diagnosis: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lessonBlocks: any[]
  attempts: number
  xpEarned: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bestLine: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  culturalInsight: any
}

const PHASE_STEPS: { key: Phase; label: string; emoji: string }[] = [
  { key: 'attempt', label: 'Try', emoji: '💬' },
  { key: 'learn', label: 'Learn', emoji: '📖' },
  { key: 'retry', label: 'Retry', emoji: '🔄' },
]

export default function LoopSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<LoopSession | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)

  // Load session
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/loop/sessions/${sessionId}`)
        if (!res.ok) throw new Error('Failed to load loop session')
        const data = await res.json()
        setSession(data)
        setPhase(data.phase || 'attempt')
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load session.')
      }
    }
    if (sessionId) load()
  }, [sessionId])

  // Transition to diagnosis phase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEndAttempt = useCallback(async (messages: any[]) => {
    setPhase('diagnosing')
    try {
      // Convert UI roles ('character'/'user') to Claude roles ('assistant'/'user')
      const transcript = (messages || []).map(m => ({
        role: m.role === 'character' ? 'assistant' : 'user',
        content: m.content || '',
      }))
      const res = await fetch(`/api/loop/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages: transcript }),
      })
      if (!res.ok) throw new Error('Diagnosis failed')
      const data = await res.json()
      setSession(prev => prev ? {
        ...prev,
        diagnosis: data.diagnosis,
        lessonBlocks: data.learnBlocks || [],
        phase: 'learn',
      } : prev)
      setPhase('learn')
    } catch (err) {
      console.error('Diagnosis error:', err)
      setError('Diagnosis failed. Please try again.')
      setPhase('attempt')
    }
  }, [sessionId])

  // Transition to retry
  const handleStartRetry = useCallback(() => {
    setPhase('retry')
    setSession(prev => prev ? { ...prev, phase: 'retry' } : prev)
  }, [])

  // Transition to complete
  const handleRetryDone = useCallback(async () => {
    try {
      const res = await fetch(`/api/loop/sessions/${sessionId}/complete`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Complete failed')
      const data = await res.json()
      setSession(prev => prev ? {
        ...prev,
        ...data,
        phase: 'complete',
      } : prev)
      setPhase('complete')
    } catch (err) {
      console.error('Complete error:', err)
      // Still transition to show what we have
      setPhase('complete')
    }
  }, [sessionId])

  // ---- Loading state ----
  if (phase === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF8' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B4F8A]/20 border-t-[#1B4F8A] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold" style={{ color: '#6B6560' }}>
            Preparing your loop...
          </p>
        </div>
      </div>
    )
  }

  // ---- Error state ----
  if (error && !session) {
    return (
      <div className="h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FDFBF8' }}>
        <Card variant="elevated" padding="lg" className="max-w-sm w-full text-center">
          <p className="text-4xl mb-3">😵</p>
          <p className="font-bold mb-2" style={{ color: '#1A1814' }}>
            Something went wrong
          </p>
          <p className="text-sm mb-4" style={{ color: '#6B6560' }}>
            {error}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (!session) return null

  // Determine which phase step is active
  const currentPhase: string = phase
  const currentStepIndex = PHASE_STEPS.findIndex(s => {
    if (currentPhase === 'diagnosing') return s.key === 'attempt'
    if (currentPhase === 'complete') return false
    return s.key === currentPhase
  })

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#FDFBF8' }}>
      {/* Phase indicator strip */}
      {phase !== 'complete' && (
        <div className="shrink-0 bg-[#FDFBF8]/80 backdrop-blur-md border-b border-[#E0DAD2]/50 safe-top z-30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{session.scenarioEmoji}</span>
                <span className="text-sm font-semibold truncate" style={{ color: '#1A1814' }}>
                  {session.scenarioTitle}
                </span>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xs font-semibold px-2.5 py-1 rounded-[6px] border border-[#E0DAD2] text-[#9E9892] hover:bg-[#F5EEEE] transition-all"
              >
                Exit
              </button>
            </div>

            {/* Phase steps */}
            <div className="flex items-center gap-1">
              {PHASE_STEPS.map((step, idx) => {
                const isActive = idx === currentStepIndex
                const isDone = idx < currentStepIndex || currentPhase === 'complete'
                return (
                  <div key={step.key} className="flex-1 flex items-center gap-1">
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full h-1.5 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: isDone
                            ? '#3D6B4F'
                            : isActive
                              ? '#1B4F8A'
                              : '#E5E7EB',
                        }}
                      />
                      <span
                        className="text-[10px] font-bold mt-1 flex items-center gap-0.5"
                        style={{
                          color: isDone ? '#3D6B4F' : isActive ? '#1B4F8A' : '#9E9892',
                        }}
                      >
                        {step.emoji} {step.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Phase content */}
      <div className="flex-1 overflow-hidden">
        {(phase === 'attempt' || phase === 'diagnosing') && (
          <AttemptPhase
            sessionId={sessionId}
            session={session}
            diagnosing={phase === 'diagnosing'}
            onEndAttempt={handleEndAttempt}
          />
        )}

        {phase === 'learn' && (
          <LearnPhase
            sessionId={sessionId}
            diagnosis={session.diagnosis}
            lessonBlocks={session.lessonBlocks || []}
            onStartRetry={handleStartRetry}
          />
        )}

        {phase === 'retry' && (
          <RetryPhase
            sessionId={sessionId}
            session={session}
            diagnosis={session.diagnosis}
            onDone={handleRetryDone}
          />
        )}

        {phase === 'complete' && (
          <MilestoneCard
            session={session}
            onTryNew={() => router.push('/dashboard')}
            onDoAgain={() => router.push(`/loop/${session.scenarioId}`)}
          />
        )}
      </div>
    </div>
  )
}
