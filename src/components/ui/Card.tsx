'use client'

import { motion } from 'framer-motion'

type GlowColor = 'accent' | 'jp' | 'en' | 'none'
type Padding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps {
  children: React.ReactNode
  glow?: GlowColor
  padding?: Padding
  onClick?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Delay (seconds) before the card's entrance animation begins */
  delay?: number
}

const glowMap: Record<GlowColor, string> = {
  accent: 'hover:shadow-[0_0_24px_rgba(27,79,138,0.25)]',
  jp: 'hover:shadow-[0_0_24px_rgba(255,107,53,0.25)]',
  en: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.25)]',
  none: '',
}

const paddingMap: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export default function Card({
  children,
  glow = 'none',
  padding = 'md',
  onClick,
  header,
  footer,
  className = '',
  delay = 0,
}: CardProps) {
  const interactive = typeof onClick === 'function'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      whileHover={interactive ? { scale: 1.01 } : undefined}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={[
        'glass-card transition-shadow duration-300',
        glowMap[glow],
        paddingMap[padding],
        interactive ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {header && (
        <div className="mb-4 pb-3 border-b border-black/8">{header}</div>
      )}
      {children}
      {footer && (
        <div className="mt-4 pt-3 border-t border-black/8">{footer}</div>
      )}
    </motion.div>
  )
}
