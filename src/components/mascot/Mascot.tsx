'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export type MascotExpression = 'neutral' | 'smiling' | 'frowning' | 'winking' | 'talking'

export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_MAP: Record<MascotSize, number> = {
  xs: 48,
  sm: 72,
  md: 96,
  lg: 160,
  xl: 240,
}

// All mascot expressions and talking frames currently point at the same
// neutral image. The Mascot component still accepts `expression` / `isTalking`
// props from existing call sites so behavior is unchanged — just visually
// always neutral until per-expression art is restored.
const EXPRESSION_FILES: Record<string, string> = {
  neutral: '/mascot/neutral.png',
  smiling: '/mascot/neutral.png',
  frowning: '/mascot/neutral.png',
  winking: '/mascot/neutral.png',
  'talking-0': '/mascot/neutral.png',
  'talking-1': '/mascot/neutral.png',
  'talking-2': '/mascot/neutral.png',
  'talking-3': '/mascot/neutral.png',
}

// Talking cycle: 0 → 1 → 2 → 3 → 1 (bounce-back)
const TALKING_FRAMES = ['talking-0', 'talking-1', 'talking-2', 'talking-3', 'talking-1']

interface MascotProps {
  expression?: MascotExpression
  size?: MascotSize
  isTalking?: boolean
  animate?: boolean // breathing animation
  enterFrom?: 'bottom' | 'left'
  className?: string
  onClick?: () => void
}

export function Mascot({
  expression = 'neutral',
  size = 'md',
  isTalking = false,
  animate = true,
  enterFrom,
  className = '',
  onClick,
}: MascotProps) {
  const [talkingFrame, setTalkingFrame] = useState(0)
  const [entered, setEntered] = useState(!enterFrom)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Talking frame cycling
  useEffect(() => {
    if (isTalking) {
      setTalkingFrame(0)
      intervalRef.current = setInterval(() => {
        setTalkingFrame((prev) => (prev + 1) % TALKING_FRAMES.length)
      }, 140)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isTalking])

  // Entry animation
  useEffect(() => {
    if (enterFrom) {
      const t = setTimeout(() => setEntered(true), 50)
      return () => clearTimeout(t)
    }
  }, [enterFrom])

  const px = SIZE_MAP[size]
  const activeKey = isTalking ? TALKING_FRAMES[talkingFrame] : expression

  // Entry transform
  const entryStyle: React.CSSProperties = enterFrom
    ? {
        transform: entered
          ? 'translate(0, 0)'
          : enterFrom === 'bottom'
            ? 'translateY(30px)'
            : 'translateX(-30px)',
        opacity: entered ? 1 : 0,
        transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      }
    : {}

  return (
    <div
      className={`relative ${animate && !isTalking ? 'mascot-breathe' : ''} ${className}`}
      style={{ width: px, height: px, ...entryStyle }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {Object.entries(EXPRESSION_FILES).map(([key, src]) => (
        <Image
          key={key}
          src={src}
          alt={`mascot ${key}`}
          width={px}
          height={px}
          className="absolute inset-0"
          style={{
            opacity: activeKey === key ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}
          priority={key === 'neutral'}
          draggable={false}
        />
      ))}
    </div>
  )
}
