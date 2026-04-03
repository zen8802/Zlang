'use client'

import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { useAppStore, t } from '@/store/useAppStore'

export default function StreakCard() {
  const { streak, xpToday, uiLanguage } = useAppStore()
  const [displayCount, setDisplayCount] = useState(0)

  // Count-up animation on mount
  useEffect(() => {
    const controls = animate(0, streak, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (value) => setDisplayCount(Math.round(value)),
    })
    return () => controls.stop()
  }, [streak])

  const xpProgress = Math.min(xpToday / 100, 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-card p-6"
    >
      {/* Streak display */}
      <div className="flex items-center gap-4 mb-5">
        {/* Fire emoji with pulse animation */}
        <motion.span
          className="text-5xl select-none"
          animate={
            streak > 0
              ? {
                  scale: [1, 1.15, 1],
                  filter: [
                    'brightness(1)',
                    'brightness(1.4)',
                    'brightness(1)',
                  ],
                }
              : { opacity: 0.3 }
          }
          transition={
            streak > 0
              ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        >
          🔥
        </motion.span>

        <div>
          <motion.span
            className="font-display text-5xl font-bold text-accent text-glow"
            key={displayCount}
          >
            {displayCount}
          </motion.span>
          <p className="text-sm text-foreground/60 mt-0.5">
            {t('dashboard.dayStreak', uiLanguage)}
          </p>
        </div>
      </div>

      {/* Encouragement message when streak is 0 */}
      {streak === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-foreground/50 mb-4 italic"
        >
          {t('dashboard.encouragement', uiLanguage)}
        </motion.p>
      )}

      {/* XP progress for today */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground/70">
            {t('dashboard.todayXP', uiLanguage)}
          </span>
          <span className="text-sm font-medium text-accent">
            {xpToday} / 100
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-black/[0.03] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent"
            style={{
              boxShadow: '0 0 12px rgba(27, 79, 138, 0.4)',
            }}
          />
        </div>

        <p className="text-xs text-foreground/40 mt-1.5">
          {t('dashboard.xpGoalSubtitle', uiLanguage)}
        </p>
      </div>
    </motion.div>
  )
}
