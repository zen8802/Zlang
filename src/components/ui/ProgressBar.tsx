'use client'

import { motion } from 'framer-motion'

type ProgressColor = 'accent' | 'jp' | 'en'

interface ProgressBarProps {
  /** Value between 0 and 100 */
  value: number
  color?: ProgressColor
  label?: string
  showPercentage?: boolean
  /** Height Tailwind class, e.g. "h-2" */
  height?: string
  className?: string
  /** Animate on mount */
  animated?: boolean
}

const fillColors: Record<ProgressColor, string> = {
  accent: 'bg-accent',
  jp: 'bg-accent-jp',
  en: 'bg-accent-en',
}

const glowColors: Record<ProgressColor, string> = {
  accent: 'shadow-[0_0_12px_rgba(0,255,178,0.5)]',
  jp: 'shadow-[0_0_12px_rgba(255,107,53,0.5)]',
  en: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]',
}

export default function ProgressBar({
  value,
  color = 'accent',
  label,
  showPercentage = false,
  height = 'h-2.5',
  className = '',
  animated = true,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className={`w-full ${className}`}>
      {/* Label row */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm text-white/70 font-medium">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-white/50 tabular-nums">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={`w-full rounded-full bg-white/10 overflow-hidden ${height}`}
        role="progressbar"
        aria-valuenow={Math.round(clampedValue)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        {/* Fill */}
        <motion.div
          className={[
            'h-full rounded-full',
            fillColors[color],
            glowColors[color],
          ].join(' ')}
          initial={animated ? { width: 0 } : { width: `${clampedValue}%` }}
          animate={{ width: `${clampedValue}%` }}
          transition={
            animated
              ? { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
              : { duration: 0 }
          }
        />
      </div>
    </div>
  )
}
