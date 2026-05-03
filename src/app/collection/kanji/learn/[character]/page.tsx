'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GRADE_1_KANJI } from '@/data/kyouiku-kanji'
import { useAppStore } from '@/store/useAppStore'
import { TracePhase } from '@/components/kanji-learn/TracePhase'
import { WritePhase } from '@/components/kanji-learn/WritePhase'
import { LearnComplete } from '@/components/kanji-learn/LearnComplete'

// SpeakPhase is temporarily disabled — see commit history if reviving.
// The flow is now: trace → write → finish → complete.
type LearnPhase = 'trace' | 'write' | 'complete'

const PHASES: { key: 'trace' | 'write'; label: string }[] = [
  { key: 'trace', label: 'Trace' },
  { key: 'write', label: 'Write' },
]

export default function KanjiLearnPage() {
  const params = useParams()
  const router = useRouter()
  const character = decodeURIComponent(params.character as string)
  const addDiscoveredKanji = useAppStore((s) => s.addDiscoveredKanji)

  const [phase, setPhase] = useState<LearnPhase>('trace')

  const kanjiData = useMemo(
    () => GRADE_1_KANJI.find((k) => k.character === character),
    [character],
  )

  useEffect(() => {
    if (!kanjiData) router.replace('/collection')
  }, [kanjiData, router])

  if (!kanjiData) return null

  const handlePhaseComplete = (completedPhase: 'trace' | 'write') => {
    if (completedPhase === 'trace') {
      setPhase('write')
    } else if (completedPhase === 'write') {
      // Free write succeeded — register as learned. Update local store
      // immediately so the grid reflects gold the moment we return; persist
      // to DB in the background.
      addDiscoveredKanji([character])
      fetch('/api/collection/kanji/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character }),
      }).catch(() => {})
      setPhase('complete')
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Header — hidden on the complete screen */}
      {phase !== 'complete' && (
        <div
          className="px-5 pt-5 pb-3 shrink-0 border-b border-[#E0DAD2]"
          style={{ backgroundColor: 'white' }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="text-[#9E9892] text-sm"
              style={{ fontFamily: 'DM Sans' }}
            >
              ← Back
            </button>
            <p style={{ fontFamily: 'Noto Sans JP', fontSize: '28px', color: '#1A1814', fontWeight: 300 }}>
              {character}
            </p>
            <div style={{ width: '48px' }} />
          </div>

          {/* 2-step progress */}
          <div className="flex gap-2">
            {PHASES.map((p, i) => {
              const isActive = phase === p.key
              const isDone = p.key === 'trace' && phase === 'write'

              return (
                <div key={p.key} className="flex-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isDone ? '#3D6B4F' : isActive ? '#1B4F8A' : '#E0DAD2',
                    }}
                  />
                  <p
                    className="text-[10px] mt-1 text-center"
                    style={{
                      fontFamily: 'DM Sans',
                      color: isDone ? '#3D6B4F' : isActive ? '#1B4F8A' : '#C8C3BC',
                    }}
                  >
                    {i + 1}. {p.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {phase === 'trace' && (
          <TracePhase kanji={kanjiData} onComplete={() => handlePhaseComplete('trace')} />
        )}
        {phase === 'write' && (
          <WritePhase kanji={kanjiData} onComplete={() => handlePhaseComplete('write')} />
        )}
        {phase === 'complete' && (
          <LearnComplete kanji={kanjiData} onDone={() => router.push('/collection')} />
        )}
      </div>
    </div>
  )
}
