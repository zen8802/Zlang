'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mascot } from './Mascot'

interface MascotSpeechProps {
  message: string
  duration?: number // auto-dismiss in ms, 0 = manual
  position?: 'bottom-left' | 'center'
  onDismiss?: () => void
}

export function MascotSpeech({
  message,
  duration = 0,
  position = 'bottom-left',
  onDismiss,
}: MascotSpeechProps) {
  const [isTalking, setIsTalking] = useState(true)
  const [visible, setVisible] = useState(true)

  // Stop talking after 1.5s
  useEffect(() => {
    const t = setTimeout(() => setIsTalking(false), 1500)
    return () => clearTimeout(t)
  }, [message])

  // Auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      const t = setTimeout(() => setVisible(false), duration)
      return () => clearTimeout(t)
    }
  }, [duration])

  // Notify parent on hide
  useEffect(() => {
    if (!visible && onDismiss) {
      const t = setTimeout(onDismiss, 300)
      return () => clearTimeout(t)
    }
  }, [visible, onDismiss])

  const handleDismiss = useCallback(() => {
    setVisible(false)
  }, [])

  if (!visible) return null

  const isCenter = position === 'center'

  return (
    <div
      className={`${
        isCenter
          ? 'fixed inset-0 flex items-center justify-center z-50'
          : 'fixed bottom-24 left-4 z-40'
      }`}
      onClick={onDismiss ? handleDismiss : undefined}
    >
      <div className={`flex flex-col items-start gap-2 ${isCenter ? 'items-center' : ''}`}>
        {/* Speech bubble */}
        <div
          className="bg-white px-4 py-3 max-w-[260px] text-sm leading-relaxed"
          style={{
            borderRadius: '12px 12px 12px 2px',
            color: 'var(--ink-dark)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <p>{message}</p>
          {onDismiss && (
            <p className="text-xs mt-1" style={{ color: 'var(--ink-light)' }}>
              tap to continue
            </p>
          )}
        </div>

        {/* Mascot */}
        <Mascot
          expression={isTalking ? 'talking' : 'smiling'}
          size="sm"
          isTalking={isTalking}
          animate={!isTalking}
        />
      </div>
    </div>
  )
}
