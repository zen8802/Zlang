'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

const PHASE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  attempt: {
    label: 'Mid conversation',
    color: '#1B4F8A',
    bg: '#EBF0F8',
    border: '#1B4F8A20',
  },
  cards: {
    label: 'Viewing new words',
    color: '#7A5C2E',
    bg: '#F5F0E8',
    border: '#D4C4A8',
  },
  diagnosing: {
    label: 'Analyzing',
    color: '#7A5C2E',
    bg: '#F5F0E8',
    border: '#D4C4A8',
  },
  learn: {
    label: 'In lesson',
    color: '#3D6B4F',
    bg: '#EFF5F0',
    border: '#B8D4C0',
  },
  retry: {
    label: 'On retry',
    color: '#1B4F8A',
    bg: '#EBF0F8',
    border: '#1B4F8A20',
  },
  recognize: {
    label: 'Recognition',
    color: '#1B4F8A',
    bg: '#EBF0F8',
    border: '#1B4F8A20',
  },
  complete: {
    label: 'Complete',
    color: '#3D6B4F',
    bg: '#EFF5F0',
    border: '#B8D4C0',
  },
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
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function ConversationsCard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [confirmingEnd, setConfirmingEnd] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
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
      // Notify ResumeCard in case this was the active session
      window.dispatchEvent(new Event('sessions-cleared'))
    } catch {
      // silently fail
    }
  }

  const handleSave = async (sessionId: string) => {
    setSavingId(sessionId)
    try {
      const res = await fetch('/api/saved-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, is_saved: true } : s))
        )
      }
    } catch {
      // silently fail
    } finally {
      setSavingId(null)
    }
  }

  if (loading || sessions.length === 0) return null

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
          <p
            className="text-xs text-[#8B3A3A] mb-2"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Delete all {sessions.length} conversations permanently? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setDeletingAll(true)
                try {
                  await Promise.all(
                    sessions.map((s) =>
                      fetch(`/api/loop/sessions/${s.id}`, { method: 'DELETE' }),
                    ),
                  )
                  setSessions([])
                  window.dispatchEvent(new Event('sessions-cleared'))
                } catch {}
                setDeletingAll(false)
                setConfirmingDeleteAll(false)
              }}
              disabled={deletingAll}
              className="flex-1 py-1.5 rounded-[6px] text-xs font-medium bg-[#8B3A3A] text-white hover:bg-[#7A2E2E] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {deletingAll ? 'Deleting...' : 'Delete all permanently'}
            </button>
            <button
              onClick={() => setConfirmingDeleteAll(false)}
              className="flex-1 py-1.5 rounded-[6px] text-xs font-medium border border-[#E0DAD2] text-[#6B6560]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-2">
        {displayed.map((session) => {
          const phaseConfig =
            PHASE_CONFIG[session.current_phase] || PHASE_CONFIG['complete']
          const isIncomplete = session.status !== 'complete'
          const isComplete = session.status === 'complete'

          return (
            <div
              key={session.id}
              className="w-full text-left rounded-[10px] border transition-all"
              style={{ backgroundColor: '#FDFBF8', borderColor: '#E0DAD2' }}
            >
              {/* Clickable title row */}
              <button
                onClick={() => router.push(`/loop/session/${session.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-[#F8F5F0] rounded-t-[10px] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[#1A1814] font-semibold truncate"
                      style={{
                        fontFamily: 'Shippori Mincho, serif',
                        fontSize: '15px',
                      }}
                    >
                      {session.scenario_title}
                    </p>
                    <p
                      className="text-[#9E9892] text-xs mt-0.5"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {session.character_name}
                      {session.message_count > 0 && (
                        <span className="text-[#C8C3BC]">
                          {' '}
                          · {Math.floor(session.message_count / 2)} exchange
                          {Math.floor(session.message_count / 2) !== 1
                            ? 's'
                            : ''}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right space-y-1.5">
                    <p
                      className="text-[#C8C3BC] text-[10px]"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {timeAgo(session.last_active_at)}
                    </p>
                    <div
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                      style={{
                        backgroundColor: phaseConfig.bg,
                        color: phaseConfig.color,
                        borderColor: phaseConfig.border,
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {isIncomplete && (
                        <span
                          className="w-1.5 h-1.5 rounded-full mr-1"
                          style={{ backgroundColor: phaseConfig.color }}
                        />
                      )}
                      {phaseConfig.label}
                    </div>
                  </div>
                </div>
              </button>

              {/* Action buttons area */}
              <div className="px-4 pb-3">
                {/* Incomplete sessions: End + Delete */}
                {isIncomplete && (
                  <>
                    {confirmingEnd === session.id ? (
                      <div
                        className="rounded-[8px] border px-3 py-2.5 mt-1"
                        style={{
                          backgroundColor: '#FFF8EE',
                          borderColor: '#E0DAD2',
                        }}
                      >
                        <p
                          className="text-xs text-[#6B6560] mb-2"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          End this conversation? A lesson will be generated from
                          what happened so far.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/loop/session/${session.id}?action=end`
                              )
                            }
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white transition-colors"
                            style={{
                              backgroundColor: '#1B4F8A',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            End and build lesson
                          </button>
                          <button
                            onClick={() => setConfirmingEnd(null)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#6B6560] hover:bg-[#F0ECE6] transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            Keep going
                          </button>
                        </div>
                      </div>
                    ) : confirmingDelete === session.id ? (
                      <div
                        className="rounded-[8px] border px-3 py-2.5 mt-1"
                        style={{
                          backgroundColor: '#FEF2F2',
                          borderColor: '#FECACA',
                        }}
                      >
                        <p
                          className="text-xs text-[#991B1B] mb-2"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          Delete this conversation permanently? This cannot be
                          undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white transition-colors"
                            style={{
                              backgroundColor: '#DC2626',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            Delete permanently
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(null)}
                            className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#6B6560] hover:bg-[#F0ECE6] transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
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
                          style={{
                            borderColor: '#E0DAD2',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          End
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(session.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Complete + unsaved: Save button */}
                {isComplete && !session.is_saved && (
                  <button
                    onClick={() => handleSave(session.id)}
                    disabled={savingId === session.id}
                    className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white mt-1 transition-colors disabled:opacity-60"
                    style={{
                      backgroundColor: '#1B4F8A',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {savingId === session.id ? 'Saving…' : 'Save lesson'}
                  </button>
                )}

                {/* Complete + saved: Saved label */}
                {isComplete && session.is_saved && (
                  <p
                    className="text-xs font-bold mt-1"
                    style={{
                      color: '#3D6B4F',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    ✓ Saved to lessons
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
