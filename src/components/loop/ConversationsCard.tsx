'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatCircle } from '@phosphor-icons/react'

interface LearnedWord {
  word: string
  english: string
  pos: string
}

interface SessionSummary {
  id: string
  scenario_title: string
  current_phase: string
  status: string
  loop_mode: string
  last_active_at: string
  created_at: string
  message_count: number
  character_name: string
  is_saved: boolean
  is_favorite: boolean
  learned_words: LearnedWord[]
}

const PHASE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  attempt: { label: 'Mid conversation', color: '#1B4F8A', bg: '#EBF0F8', border: '#1B4F8A20' },
  cards: { label: 'Viewing new words', color: '#7A5C2E', bg: '#F5F0E8', border: '#D4C4A8' },
  diagnosing: { label: 'Analyzing', color: '#7A5C2E', bg: '#F5F0E8', border: '#D4C4A8' },
  learn: { label: 'In lesson', color: '#3D6B4F', bg: '#EFF5F0', border: '#B8D4C0' },
  retry: { label: 'On retry', color: '#1B4F8A', bg: '#EBF0F8', border: '#1B4F8A20' },
  recognize: { label: 'Recognition', color: '#1B4F8A', bg: '#EBF0F8', border: '#1B4F8A20' },
  complete: { label: 'Complete', color: '#3D6B4F', bg: '#EFF5F0', border: '#B8D4C0' },
}

const POS_DOT: Record<string, string> = {
  noun: '#1B4F8A',
  verb: '#8B3A3A',
  adjective: '#6B5B8D',
  adverb: '#3D6B4F',
  phrase: '#8B5A6B',
  greeting: '#3D6B5A',
  expression: '#7A5C2E',
  particle: '#7A5C2E',
  counter: '#6366F1',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripFurigana(text: string): string {
  return text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
}

export default function ConversationsCard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [confirmingEnd, setConfirmingEnd] = useState<string | null>(null)
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    fetch('/api/loop/sessions/recent')
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/loop/sessions/${id}`, { method: 'DELETE' })
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id)
        if (next.length === 0) window.dispatchEvent(new Event('sessions-cleared'))
        return next
      })
      setConfirmingDelete(null)
      window.dispatchEvent(new Event('sessions-cleared'))
    } catch {}
  }

  const handleToggleFavorite = async (id: string, current: boolean) => {
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_favorite: !current } : s)),
    )
    await fetch(`/api/loop/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: !current }),
    })
  }

  if (loading) return null

  // Empty state — render a small placeholder instead of returning null so
  // the dashboard's bento grid stays balanced after a "delete all".
  if (sessions.length === 0) {
    return (
      <div className="mb-4">
        <p
          className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-3 px-1"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Your conversations
        </p>
        <div
          className="rounded-[12px] px-5 py-8 text-center"
          style={{
            backgroundColor: '#FDFBF8',
            border: '1px solid #E0DAD2',
          }}
        >
          <div
            className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: '#F5F0EB', border: '1px solid #E0DAD2' }}
          >
            <ChatCircle size={22} weight="thin" color="#9E9892" />
          </div>
          <p
            style={{
              fontFamily: 'Shippori Mincho, serif',
              fontSize: '16px',
              color: '#1A1814',
              letterSpacing: '-0.01em',
            }}
          >
            No previous conversations
          </p>
          <p
            className="mt-1.5 text-[13px]"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B6560' }}
          >
            Start one from Jump In above — they&apos;ll show up here.
          </p>
        </div>
      </div>
    )
  }

  const displayed = showAll ? sessions : sessions.slice(0, 3)

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p
          className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Your conversations
        </p>
        <div className="flex items-center gap-3">
          {sessions.length > 3 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-[10px] text-[#1B4F8A] font-medium"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {showAll ? 'Show less' : `See all ${sessions.length}`}
            </button>
          )}
          <button
            onClick={() => setConfirmingDeleteAll(true)}
            className="text-[10px] text-[#8B3A3A] font-medium"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Delete all
          </button>
        </div>
      </div>

      {/* Delete all confirmation */}
      {confirmingDeleteAll && (
        <div
          className="rounded-[8px] border px-3 py-2.5 mb-3"
          style={{ backgroundColor: '#F5EEEE', borderColor: '#D4BABA' }}
        >
          <p className="text-xs text-[#8B3A3A] mb-2" style={{ fontFamily: 'DM Sans' }}>
            Delete all {sessions.length} conversations permanently? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setDeletingAll(true)
                // allSettled so one stuck DELETE doesn't abort the rest and
                // leave the user with a half-deleted state + a stuck button.
                try {
                  await Promise.allSettled(
                    sessions.map((s) =>
                      fetch(`/api/loop/sessions/${s.id}`, { method: 'DELETE' }),
                    ),
                  )
                } catch {
                  // Promise.allSettled never throws, but keep the catch for safety.
                }
                setSessions([])
                setDeletingAll(false)
                setConfirmingDeleteAll(false)
                window.dispatchEvent(new Event('sessions-cleared'))
              }}
              disabled={deletingAll}
              className="flex-1 py-1.5 rounded-[6px] text-xs font-medium bg-[#8B3A3A] text-white hover:bg-[#7A2E2E] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'DM Sans' }}
            >
              {deletingAll ? 'Deleting...' : 'Delete all permanently'}
            </button>
            <button
              onClick={() => setConfirmingDeleteAll(false)}
              className="flex-1 py-1.5 rounded-[6px] text-xs font-medium border border-[#E0DAD2] text-[#6B6560]"
              style={{ fontFamily: 'DM Sans' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-2">
        {displayed.map((session) => {
          const phaseConfig = PHASE_CONFIG[session.current_phase] || PHASE_CONFIG['complete']
          const isIncomplete = session.status !== 'complete'
          const isComplete = session.status === 'complete'
          const words = session.learned_words || []

          return (
            <div
              key={session.id}
              className="w-full text-left rounded-[10px] border transition-all"
              style={{ backgroundColor: '#FDFBF8', borderColor: '#E0DAD2' }}
            >
              {/* Title row */}
              <div className="relative">
                <button
                  onClick={() => router.push(`/loop/session/${session.id}`)}
                  className="w-full text-left px-4 py-3 pr-12 hover:bg-[#F8F5F0] rounded-t-[10px] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[#1A1814] font-semibold truncate"
                        style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '15px' }}
                      >
                        {session.scenario_title}
                      </p>
                      <p className="text-[#9E9892] text-xs mt-0.5" style={{ fontFamily: 'DM Sans' }}>
                        {session.character_name}
                        {session.message_count > 0 && (
                          <span className="text-[#C8C3BC]">
                            {' '} · {Math.floor(session.message_count / 2)} exchange
                            {Math.floor(session.message_count / 2) !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right space-y-1.5">
                      <p className="text-[#C8C3BC] text-[10px]" style={{ fontFamily: 'DM Sans' }}>
                        {timeAgo(session.last_active_at)}
                      </p>
                      <div
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                        style={{
                          backgroundColor: phaseConfig.bg,
                          color: phaseConfig.color,
                          borderColor: phaseConfig.border,
                          fontFamily: 'DM Sans',
                        }}
                      >
                        {isIncomplete && (
                          <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: phaseConfig.color }} />
                        )}
                        {phaseConfig.label}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Favorite star — top right corner */}
                {isComplete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(session.id, session.is_favorite) }}
                    className="absolute top-2.5 right-3 p-1 transition-transform hover:scale-110"
                    title={session.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {session.is_favorite ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8C3BC" strokeWidth="1.5">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Learned words (completed sessions only) */}
              {isComplete && words.length > 0 && (
                <div className="px-4 pb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold tracking-wide uppercase text-[#9E9892] mr-0.5" style={{ fontFamily: 'DM Sans' }}>
                      Learned
                    </span>
                    {words.slice(0, 3).map((w, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                        title={w.english}
                        style={{
                          backgroundColor: '#F5F0EB',
                          color: '#6B6560',
                          fontFamily: 'Noto Sans JP',
                          fontWeight: 300,
                        }}
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: POS_DOT[w.pos] || '#9E9892' }}
                        />
                        {stripFurigana(w.word)}
                      </span>
                    ))}
                    {words.length > 3 && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: '#C8C3BC', fontFamily: 'DM Mono' }}
                      >
                        +{words.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="px-4 pb-3">
                {isIncomplete && (
                  <>
                    {confirmingEnd === session.id ? (
                      <div className="rounded-[8px] border px-3 py-2.5 mt-1" style={{ backgroundColor: '#FFF8EE', borderColor: '#E0DAD2' }}>
                        <p className="text-xs text-[#6B6560] mb-2" style={{ fontFamily: 'DM Sans' }}>
                          End this conversation? A lesson will be generated from what happened so far.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/loop/session/${session.id}?action=end`)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white transition-colors"
                            style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans' }}
                          >
                            End and build lesson
                          </button>
                          <button
                            onClick={() => setConfirmingEnd(null)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#6B6560] hover:bg-[#F0ECE6] transition-colors"
                            style={{ fontFamily: 'DM Sans' }}
                          >
                            Keep going
                          </button>
                        </div>
                      </div>
                    ) : confirmingDelete === session.id ? (
                      <div className="rounded-[8px] border px-3 py-2.5 mt-1" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                        <p className="text-xs text-[#991B1B] mb-2" style={{ fontFamily: 'DM Sans' }}>
                          Delete this conversation permanently?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white transition-colors"
                            style={{ backgroundColor: '#DC2626', fontFamily: 'DM Sans' }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(null)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#6B6560] hover:bg-[#F0ECE6] transition-colors"
                            style={{ fontFamily: 'DM Sans' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setConfirmingEnd(session.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-[8px] border text-[#6B6560] hover:bg-[#F0ECE6] transition-colors"
                          style={{ borderColor: '#E0DAD2', fontFamily: 'DM Sans' }}
                        >
                          End
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(session.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Complete sessions: Delete */}
                {isComplete && (
                  <>
                    {confirmingDelete === session.id ? (
                      <div className="rounded-[8px] border px-3 py-2.5 mt-1" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                        <p className="text-xs text-[#991B1B] mb-2" style={{ fontFamily: 'DM Sans' }}>
                          Delete this conversation permanently?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white transition-colors"
                            style={{ backgroundColor: '#DC2626', fontFamily: 'DM Sans' }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(null)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#6B6560] hover:bg-[#F0ECE6] transition-colors"
                            style={{ fontFamily: 'DM Sans' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setConfirmingDelete(session.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-[8px] text-[#C8C3BC] hover:text-[#8B3A3A] hover:bg-[#FEF2F2] transition-colors"
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
