'use client'

import { useState, useEffect } from 'react'
import { Mascot } from './Mascot'

interface MascotCelebrationProps {
  message?: string
  onComplete?: () => void
}

export function MascotCelebration({ message, onComplete }: MascotCelebrationProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    // Enter phase: 0 - 400ms
    const holdTimer = setTimeout(() => setPhase('hold'), 400)
    // Exit phase: 2200ms
    const exitTimer = setTimeout(() => setPhase('exit'), 2200)
    // Complete: 2600ms
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 2600)

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'translateY(-20px)' : 'translateY(0)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div className={phase === 'enter' ? 'mascot-bounce-in' : ''}>
        <Mascot expression="smiling" size="xl" animate={false} />
      </div>

      {(phase === 'hold' || phase === 'exit') && message && (
        <p
          className="mt-4 text-center ink-in"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            color: 'var(--ink-dark)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
