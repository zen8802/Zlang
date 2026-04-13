'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { MascotExpression } from '@/components/mascot/Mascot'

interface MascotState {
  expression: MascotExpression
  isTalking: boolean
  speechMessage: string | null
  isCelebrating: boolean
  celebrationMessage: string | null
}

interface MascotActions {
  setExpression: (expr: MascotExpression, duration?: number) => void
  startTalking: () => void
  stopTalking: () => void
  speak: (message: string, duration?: number) => void
  celebrate: (message?: string) => void
  wink: () => void
  react: (result: 'correct' | 'wrong' | 'hint') => void
}

type MascotContextValue = MascotState & MascotActions

const MascotContext = createContext<MascotContextValue | null>(null)

export function MascotProvider({ children }: { children: React.ReactNode }) {
  const [expression, setExpressionState] = useState<MascotExpression>('neutral')
  const [isTalking, setIsTalking] = useState(false)
  const [speechMessage, setSpeechMessage] = useState<string | null>(null)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)

  const expressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setExpression = useCallback((expr: MascotExpression, duration?: number) => {
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current)
    setExpressionState(expr)
    if (duration) {
      expressionTimerRef.current = setTimeout(() => {
        setExpressionState('neutral')
        expressionTimerRef.current = null
      }, duration)
    }
  }, [])

  const startTalking = useCallback(() => {
    setIsTalking(true)
  }, [])

  const stopTalking = useCallback(() => {
    setIsTalking(false)
  }, [])

  const speak = useCallback((message: string, duration = 4000) => {
    setSpeechMessage(message)
    setIsTalking(true)

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    speechTimerRef.current = setTimeout(() => {
      setIsTalking(false)
      setSpeechMessage(null)
      speechTimerRef.current = null
    }, duration)
  }, [])

  const celebrate = useCallback((message?: string) => {
    setCelebrationMessage(message ?? null)
    setIsCelebrating(true)
    setTimeout(() => {
      setIsCelebrating(false)
      setCelebrationMessage(null)
    }, 2800)
  }, [])

  const wink = useCallback(() => {
    setExpression('winking', 2000)
  }, [setExpression])

  const react = useCallback(
    (result: 'correct' | 'wrong' | 'hint') => {
      const map: Record<string, { expr: MascotExpression; duration: number }> = {
        correct: { expr: 'smiling', duration: 2000 },
        wrong: { expr: 'frowning', duration: 1500 },
        hint: { expr: 'winking', duration: 2000 },
      }
      const { expr, duration } = map[result]
      setExpression(expr, duration)
    },
    [setExpression]
  )

  const value: MascotContextValue = {
    expression,
    isTalking,
    speechMessage,
    isCelebrating,
    celebrationMessage,
    setExpression,
    startTalking,
    stopTalking,
    speak,
    celebrate,
    wink,
    react,
  }

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
}

export function useMascot(): MascotContextValue {
  const ctx = useContext(MascotContext)
  if (!ctx) throw new Error('useMascot must be used within MascotProvider')
  return ctx
}
