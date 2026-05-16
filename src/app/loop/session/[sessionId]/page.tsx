'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AttemptPhase from '@/components/loop/AttemptPhase'
import LearnPhase from '@/components/loop/LearnPhase'
import MilestoneCard from '@/components/loop/MilestoneCard'
import SessionReviewView from '@/components/loop/SessionReviewView'
import { useAppStore } from '@/store/useAppStore'
import { useSessionAutoSave } from '@/hooks/useSessionAutoSave'
import { GRADE_1_KANJI } from '@/data/kyouiku-kanji'

const GRADE_1_SET = new Set(GRADE_1_KANJI.map((k) => k.character))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Phase = 'loading' | 'attempt' | 'diagnosing' | 'learn' | 'complete'

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
  loopMode?: 'beginner' | 'elementary' | 'intermediate'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attemptMessages?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retryMessages: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diagnosis: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lessonBlocks: any[]
  lessonTitle?: string
  lessonSubtitle?: string
  estimatedMinutes?: number
  wordCount?: number
  attempts: number
  xpEarned: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bestLine: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  culturalInsight: any
}

const PHASE_STEPS: { key: Phase; label: string; emoji: string }[] = [
  { key: 'attempt', label: 'Experience', emoji: '💬' },
  { key: 'learn', label: 'Learn', emoji: '📖' },
]

export default function LoopSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<LoopSession | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)
  // When set, the completed-session screen swaps the milestone card for a
  // read-only review of either the conversation transcript or the lesson.
  const [reviewMode, setReviewMode] = useState<'conversation' | 'lesson' | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resettingSession, setResettingSession] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const [cardResults, setCardResults] = useState<{ newUnlocks: any[]; strengthened: any[]; mastered: any[] }>({
    newUnlocks: [],
    strengthened: [],
    mastered: [],
  })
  const userProfile = useAppStore((s) => s.userProfile)
  const addSeenKanji = useAppStore((s) => s.addSeenKanji)

  // 3a. Auto-save hook
  const { saveNow } = useSessionAutoSave(sessionId)

  // 3b. Save on every phase transition
  useEffect(() => {
    if (phase !== 'loading') {
      saveNow({ currentPhase: phase })
    }
  }, [phase, saveNow])

  // 3f. beforeunload safety — save state when page closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId && phase !== 'loading' && phase !== 'complete') {
        const payload = JSON.stringify({
          currentPhase: phase,
        })
        navigator.sendBeacon(
          `/api/loop/sessions/${sessionId}/save`,
          payload,
        )
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sessionId, phase])

  // Load session
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/loop/sessions/${sessionId}`)
        if (res.status === 404) {
          router.replace('/dashboard')
          return
        }
        if (!res.ok) throw new Error('Failed to load loop session')
        const data = await res.json()
        setSession(data)

        // 3e. Resume from saved state
        // Restore learn blocks if saved under learnBlocks key
        if (data.learnBlocks?.length > 0 && (!data.lessonBlocks || data.lessonBlocks.length === 0)) {
          data.lessonBlocks = data.learnBlocks
        }

        const savedPhase = data.currentPhase || data.phase || 'attempt'
        if (savedPhase === 'diagnosing' || savedPhase === 'card-reveal' || savedPhase === 'cards') {
          setPhase('attempt')
        } else {
          setPhase(savedPhase as Phase)
        }
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load session.')
      }
    }
    if (sessionId) load()
  }, [sessionId])

  // Run diagnosis on attempt messages. `lessonWords` is the explicit list of
  // word objects (key/word/reading/romaji/english/partOfSpeech) the user
  // encountered through their translated input — diagnose builds the fixed
  // 4-block template directly from these without a vocabulary_cards lookup.
  const runDiagnosis = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (messages: any[], lessonWords: any[] = []) => {
      setPhase('diagnosing')
      try {
        const transcript = (messages || []).map(m => ({
          role: m.role === 'character' ? 'assistant' : 'user',
          content: m.content || '',
        }))
        const res = await fetch(`/api/loop/diagnose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, messages: transcript, userProfile, lessonWords }),
        })
        if (!res.ok) throw new Error('Diagnosis failed')
        const data = await res.json()
        setSession(prev => prev ? {
          ...prev,
          diagnosis: data.diagnosis,
          lessonBlocks: data.learnBlocks || [],
          lessonTitle: data.lessonTitle || '',
          lessonSubtitle: data.lessonSubtitle || '',
          estimatedMinutes: data.estimatedMinutes || 5,
          wordCount: data.wordCount || 0,
          phase: 'learn',
        } : prev)
        setPhase('learn')
        // Persist just the keys so resuming reflects the count; the full
        // objects only need to live for the diagnose call itself.
        saveNow({
          currentPhase: 'learn',
          diagnosis: data.diagnosis,
          learnBlocks: data.learnBlocks || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lessonWordIds: lessonWords.map((w: any) => w?.key).filter(Boolean),
        })
      } catch (err) {
        console.error('Diagnosis error:', err)
        setError('Diagnosis failed. Please try again.')
        setPhase('attempt')
      }
    },
    [sessionId, userProfile, saveNow],
  )

  // End attempt — scan for seen kanji, track vocabulary in background,
  // then go straight to diagnosis with the lesson words gathered during
  // the conversation.
  const handleEndAttempt = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (messages: any[], lessonWords: any[] = []) => {
    saveNow({
      currentPhase: 'diagnosing',
      attemptMessages: messages,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lessonWordIds: lessonWords.map((w: any) => w?.key).filter(Boolean),
    })

    // Scan conversation for seen kanji (background, non-blocking)
    const allText = (messages || []).map((m: { content?: string }) => m.content || '').join('')
    const newKanji: string[] = []
    const seenInScan = new Set<string>()
    for (const ch of allText) {
      if (seenInScan.has(ch)) continue
      const code = ch.charCodeAt(0)
      if (code >= 0x4e00 && code <= 0x9fff) { newKanji.push(ch); seenInScan.add(ch) }
    }
    if (newKanji.length > 0) addSeenKanji(newKanji)

    // Track vocabulary cards in background (fire-and-forget)
    const transcript = (messages || []).map(m => ({
      role: m.role === 'character' ? 'assistant' : 'user',
      content: m.content || '',
    }))
    fetch('/api/vocabulary/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: transcript, scenarioId: session?.scenarioId }),
    })
      .then(r => r.json())
      .then(data => {
        setCardResults({
          newUnlocks: data.newUnlocks || [],
          strengthened: data.strengthened || [],
          mastered: data.mastered || [],
        })
      })
      .catch(() => {})

    runDiagnosis(messages, lessonWords)
  }, [session?.scenarioId, addSeenKanji, saveNow, runDiagnosis])

  // Transition to retry
  // After lesson completes, go straight to complete (no retry/recognize phase)
  const handleStartRetry = useCallback(async () => {
    try {
      const res = await fetch(`/api/loop/sessions/${sessionId}/complete`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Complete failed')
      const data = await res.json()
      setSession(prev => prev ? { ...prev, ...data, phase: 'complete' } : prev)
      setPhase('complete')

      // Save learned words from flashcard blocks
      const blocks = session?.lessonBlocks || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const learnedWords: any[] = []
      for (const block of blocks) {
        if (block.type === 'flashcard' && Array.isArray(block.cards)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const card of block.cards as any[]) {
            learnedWords.push({
              word: card.word,
              reading: card.reading,
              romaji: card.romaji,
              english: card.english,
              partOfSpeech: card.partOfSpeech,
              exampleJP: card.exampleJP,
              exampleRomaji: card.exampleRomaji,
              exampleEN: card.exampleEN,
            })
          }
        }
      }
      if (learnedWords.length > 0) {
        fetch('/api/learned-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            words: learnedWords,
            sessionId,
            scenarioTitle: session?.scenarioTitle,
          }),
        }).catch(() => {})

        // Mark any Grade 1 kanji present in learned words as SEEN.
        // LEARNED status is reserved exclusively for completing the
        // trace+write+speak sequence in the kanji learn flow.
        const kanjiFound: string[] = []
        for (const w of learnedWords) {
          const text = (w.word || '') + (w.exampleJP || '')
          for (const ch of text) {
            if (GRADE_1_SET.has(ch) && !kanjiFound.includes(ch)) {
              kanjiFound.push(ch)
            }
          }
        }
        if (kanjiFound.length > 0) {
          addSeenKanji(kanjiFound)
        }
      }
    } catch {
      setPhase('complete')
    }
  }, [sessionId, session?.lessonBlocks, session?.scenarioTitle, addSeenKanji])


  // ---- Loading state ----
  if (phase === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0EB' }}>
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
      <div className="h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F0EB' }}>
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
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F5F0EB' }}>
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
              <div className="flex items-center gap-1.5">
                {/* Pause — saves progress and returns to dashboard */}
                <button
                  onClick={async () => {
                    if (typeof saveNow === 'function') {
                      await saveNow({ currentPhase: phase })
                    }
                    router.push('/dashboard')
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-[6px] border border-[#E0DAD2] text-[#9E9892] hover:bg-[#EBF0F8] transition-all"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Pause
                </button>
                {/* Reset — clears conversation back to opening line */}
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-[6px] border border-[#D4C4A8] text-[#7A5C2E] hover:bg-[#F5F0E8] transition-all"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Reset
                </button>
                {/* End — permanently deletes session */}
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-[6px] border border-[#D4BABA] text-[#8B3A3A] hover:bg-[#F5EEEE] transition-all"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  End
                </button>
              </div>
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
            lessonTitle={session.lessonTitle}
            lessonSubtitle={session.lessonSubtitle}
            estimatedMinutes={session.estimatedMinutes}
            wordCount={session.wordCount}
            onStartRetry={handleStartRetry}
          />
        )}

        {phase === 'complete' && reviewMode && (
          <SessionReviewView
            session={session}
            initialTab={reviewMode}
            onBack={() => setReviewMode(null)}
          />
        )}

        {phase === 'complete' && !reviewMode && (
          <MilestoneCard
            session={session}
            onTryNew={() => router.push('/dashboard')}
            onDoAgain={() => router.push(`/loop/${session.scenarioId}`)}
            onReviewConversation={() => setReviewMode('conversation')}
            onReviewLesson={() => setReviewMode('lesson')}
          />
        )}
      </div>

      {/* Reset session confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1814]/40 px-6">
          <div
            className="w-full max-w-sm rounded-[10px] p-6"
            style={{ backgroundColor: '#FDFBF8' }}
          >
            <p
              className="text-[#1A1814] font-semibold text-center mb-2"
              style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '18px' }}
            >
              Reset this conversation?
            </p>
            <p
              className="text-[#6B6560] text-sm text-center mb-6 leading-relaxed"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              This will clear your conversation and start over from the beginning. Your lesson progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-[8px] border border-[#E0DAD2] text-[#6B6560] text-sm font-medium hover:bg-[#F5F0EB] transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Cancel
              </button>
              <button
                disabled={resettingSession}
                onClick={async () => {
                  setResettingSession(true)
                  try {
                    await fetch(`/api/loop/sessions/${sessionId}/reset`, { method: 'POST' })
                    // Hard reload the page to pick up the reset state
                    window.location.reload()
                  } catch {
                    setResettingSession(false)
                    setShowResetConfirm(false)
                  }
                }}
                className="flex-1 py-3 rounded-[8px] bg-[#7A5C2E] text-white text-sm font-medium hover:bg-[#634A24] transition-colors disabled:opacity-50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {resettingSession ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End session confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1814]/40 px-6">
          <div
            className="w-full max-w-sm rounded-[10px] p-6"
            style={{ backgroundColor: '#FDFBF8' }}
          >
            <p
              className="text-[#1A1814] font-semibold text-center mb-2"
              style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '18px' }}
            >
              End this session?
            </p>
            <p
              className="text-[#6B6560] text-sm text-center mb-6 leading-relaxed"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              This will permanently delete your conversation and any progress in this session. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-[8px] border border-[#E0DAD2] text-[#6B6560] text-sm font-medium hover:bg-[#F5F0EB] transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowEndConfirm(false)
                  try {
                    await fetch(`/api/loop/sessions/${sessionId}/save`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isAbandoned: true }),
                    })
                  } catch {}
                  router.push('/dashboard')
                }}
                className="flex-1 py-3 rounded-[8px] bg-[#8B3A3A] text-white text-sm font-medium hover:bg-[#6B2A2A] transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
