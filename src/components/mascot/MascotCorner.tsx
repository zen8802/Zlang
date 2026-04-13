'use client'

import { useState, useEffect } from 'react'
import { Mascot } from './Mascot'
import type { MascotExpression } from './Mascot'

interface MascotCornerProps {
  isTalking?: boolean
  lastResult?: 'correct' | 'wrong' | 'hint' | null
  isWaiting?: boolean
  expression?: MascotExpression
}

export function MascotCorner({
  isTalking = false,
  lastResult = null,
  isWaiting = false,
  expression: externalExpression,
}: MascotCornerProps) {
  const [expression, setExpression] = useState<MascotExpression>(externalExpression ?? 'neutral')
  const [visible, setVisible] = useState(false)

  // Delayed entrance
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  // React to lastResult
  useEffect(() => {
    if (!lastResult) return

    const map: Record<string, { expr: MascotExpression; duration: number }> = {
      correct: { expr: 'smiling', duration: 2000 },
      wrong: { expr: 'frowning', duration: 1500 },
      hint: { expr: 'winking', duration: 2000 },
    }

    const { expr, duration } = map[lastResult]
    setExpression(expr)

    const t = setTimeout(() => setExpression(externalExpression ?? 'neutral'), duration)
    return () => clearTimeout(t)
  }, [lastResult, externalExpression])

  // Sync external expression
  useEffect(() => {
    if (externalExpression && !lastResult) {
      setExpression(externalExpression)
    }
  }, [externalExpression, lastResult])

  // Talking overrides expression display
  const displayExpression = isTalking ? 'talking' : expression

  if (!visible) return null

  return (
    <div
      className="fixed bottom-24 left-4 z-30 pointer-events-none"
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
    >
      <Mascot
        expression={displayExpression}
        size="sm"
        isTalking={isTalking}
        animate={!isTalking && !isWaiting}
        enterFrom="bottom"
      />
    </div>
  )
}
