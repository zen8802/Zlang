'use client'

import { motion } from 'framer-motion'

type BadgeColor = 'accent' | 'jp' | 'en' | 'neutral' | 'danger' | 'warning'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  size?: BadgeSize
  emoji?: string
  className?: string
}

const colorMap: Record<BadgeColor, string> = {
  accent: 'bg-accent/15 text-accent border-accent/20',
  jp: 'bg-accent-jp/15 text-accent-jp border-accent-jp/20',
  en: 'bg-accent-en/15 text-accent-en border-accent-en/20',
  neutral: 'bg-black/[0.05] text-foreground/80 border-black/10',
  danger: 'bg-red-500/15 text-red-400 border-red-500/20',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
}

const sizeMap: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
}

export default function Badge({
  children,
  color = 'accent',
  size = 'md',
  emoji,
  className = '',
}: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={[
        'inline-flex items-center font-medium rounded-full border whitespace-nowrap',
        colorMap[color],
        sizeMap[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {emoji && (
        <span className="shrink-0" role="img" aria-hidden="true">
          {emoji}
        </span>
      )}
      {children}
    </motion.span>
  )
}
