import { useCallback, useRef } from 'react'

interface SavePayload {
  currentPhase?: string
  currentBlockIndex?: number
  completedBlockIds?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attemptMessages?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retryMessages?: any[]
  recognizedLines?: Record<number, boolean>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diagnosis?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  learnBlocks?: any[]
  lessonWordIds?: string[]
  isAbandoned?: boolean
}

/**
 * Auto-save hook for loop sessions. Returns two save functions:
 * - `save(payload)` — debounced 800ms, good for frequent updates (messages)
 * - `saveNow(payload)` — immediate, good for phase changes and important moments
 *
 * Both are idempotent — duplicate payloads are skipped.
 */
export function useSessionAutoSave(sessionId: string) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  const doSave = useCallback(
    async (payload: SavePayload) => {
      const serialized = JSON.stringify(payload)
      if (serialized === lastSavedRef.current) return
      lastSavedRef.current = serialized

      try {
        await fetch(`/api/loop/sessions/${sessionId}/save`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: serialized,
        })
      } catch {
        // Silently fail — don't disrupt the user experience.
        // They'll just lose progress from this specific moment.
      }
    },
    [sessionId],
  )

  /** Debounced save — 800ms. For frequent updates like new messages. */
  const save = useCallback(
    (payload: SavePayload) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => doSave(payload), 800)
    },
    [doSave],
  )

  /** Immediate save — for phase transitions and critical moments. */
  const saveNow = useCallback(
    (payload: SavePayload) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      doSave(payload)
    },
    [doSave],
  )

  return { save, saveNow }
}
