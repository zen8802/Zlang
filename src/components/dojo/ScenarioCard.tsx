'use client'

import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'

interface ScenarioCardProps {
  emoji: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  onClick: () => void
  delay?: number
}

const difficultyColor: Record<string, 'accent' | 'warning' | 'danger'> = {
  Beginner: 'accent',
  Intermediate: 'warning',
  Advanced: 'danger',
}

export default function ScenarioCard({
  emoji,
  title,
  description,
  difficulty,
  onClick,
  delay = 0,
}: ScenarioCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-5 text-left w-full cursor-pointer group transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(0,255,178,0.15)]"
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0 mt-0.5" role="img" aria-hidden="true">
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-base font-semibold text-white group-hover:text-accent transition-colors">
              {title}
            </h3>
            <Badge color={difficultyColor[difficulty]} size="sm">
              {difficulty}
            </Badge>
          </div>
          <p className="text-sm text-white/50 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.button>
  )
}
