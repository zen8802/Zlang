'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActiveSession = any

const PHASE_EMOJI: Record<string, string> = {
  attempt: '\u{1F4AC}',
  cards: '\u{1F0CF}',
  learn: '\u{1F4D6}',
  retry: '\u{1F504}',
  recognize: '\u{1F50D}',
  diagnosing: '\u{1F4AC}',
}

function getPhaseLabel(phase: string | undefined): string {
  switch (phase) {
    case 'attempt':
      return 'mid-conversation'
    case 'cards':
      return 'viewing new words'
    case 'learn':
      return 'mid-lesson'
    case 'retry':
      return 'on retry'
    case 'recognize':
      return 'on recognition'
    default:
      return 'in progress'
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ResumeCard() {
  const router = useRouter()
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch('/api/loop/sessions/active')
        if (!res.ok) return
        const data = await res.json()
        if (data.session) setSession(data.session)
        else setSession(null)
      } catch {
        // silently ignore
      }
    }
    fetchActive()

    // Listen for session deletions from ConversationsCard
    const handleSessionsCleared = () => setSession(null)
    window.addEventListener('sessions-cleared', handleSessionsCleared)
    return () => window.removeEventListener('sessions-cleared', handleSessionsCleared)
  }, [])

  if (!session || hidden) return null

  const phaseKey = session.currentPhase || session.phase || 'attempt'
  const emoji = PHASE_EMOJI[phaseKey] || '\u{1F4AC}'

  const handleDismiss = async () => {
    setHidden(true)
    try {
      await fetch(`/api/loop/sessions/${session.id}/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAbandoned: true }),
      })
    } catch {
      // silently ignore
    }
  }

  return (
    <div
      className="bg-[#EBF0F8] rounded-[10px] border border-[#1B4F8A]/20 p-5 mb-4 relative"
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#1B4F8A]/40 hover:text-[#1B4F8A] transition-colors text-lg leading-none"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Phase emoji + label */}
      <p
        className="text-[10px] tracking-widest uppercase text-[#1B4F8A] font-medium mb-1"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        {emoji} Resume session
      </p>

      {/* Scenario title */}
      <p
        className="text-[#1A1814] font-semibold mb-1"
        style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '16px' }}
      >
        {session.scenarioTitle}
      </p>

      {/* Phase label + message count + time ago */}
      <p
        className="text-xs text-[#6B6560] mb-3"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        {getPhaseLabel(phaseKey)}
        {session.messageCount > 0 && ` \u00B7 ${session.messageCount} messages`}
        {session.lastActiveAt && ` \u00B7 ${timeAgo(session.lastActiveAt)}`}
      </p>

      {/* Continue button */}
      <button
        onClick={() => router.push(`/loop/session/${session.id}`)}
        className="w-full py-3 rounded-[8px] bg-[#1B4F8A] text-white text-sm font-semibold hover:bg-[#164070] transition-colors"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        Continue where you left off →
      </button>
    </div>
  )
}
