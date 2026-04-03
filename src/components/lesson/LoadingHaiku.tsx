'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const haikus = [
  {
    jp: '古池や蛙飛び込む水の音',
    en: 'An old silent pond / A frog jumps into the pond / Splash! Silence again.',
    author: 'Basho',
  },
  {
    jp: '菜の花や月は東に日は西に',
    en: 'Canola flowers / The moon in the east / The sun in the west.',
    author: 'Buson',
  },
  {
    jp: '痩蛙負けるな一茶是にあり',
    en: 'Lean frog, do not give up / Issa is here / cheering for you.',
    author: 'Issa',
  },
  {
    jp: '閑さや岩にしみ入る蝉の声',
    en: 'Such stillness / The cries of cicadas / Sink into the rocks.',
    author: 'Basho',
  },
  {
    jp: '夏草や兵どもが夢の跡',
    en: 'Summer grasses / All that remains / Of warriors\' dreams.',
    author: 'Basho',
  },
]

export default function LoadingHaiku({ className = '' }: { className?: string }) {
  const [haiku] = useState(() => haikus[Math.floor(Math.random() * haikus.length)])
  const [displayedJP, setDisplayedJP] = useState('')
  const [displayedEN, setDisplayedEN] = useState('')
  const [phase, setPhase] = useState<'jp' | 'en'>('jp')

  // Character-by-character reveal for JP
  useEffect(() => {
    if (phase !== 'jp') return
    const chars = haiku.jp.split('')
    let i = 0
    const interval = setInterval(() => {
      if (i < chars.length) {
        setDisplayedJP((prev) => prev + chars[i])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setPhase('en'), 400)
      }
    }, 80)
    return () => clearInterval(interval)
  }, [haiku.jp, phase])

  // Character-by-character reveal for EN
  useEffect(() => {
    if (phase !== 'en') return
    const chars = haiku.en.split('')
    let i = 0
    const interval = setInterval(() => {
      if (i < chars.length) {
        setDisplayedEN((prev) => prev + chars[i])
        i++
      } else {
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [haiku.en, phase])

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {/* Ink brush SVG animation */}
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer circle brush stroke */}
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          stroke="rgba(27, 79, 138, 0.3)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="314"
          initial={{ strokeDashoffset: 314 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
        />
        {/* Brush stroke 1 - horizontal */}
        <motion.path
          d="M 30 55 Q 45 50 60 55 Q 75 60 90 55"
          stroke="#1B4F8A"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0.7] }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
        {/* Brush stroke 2 - diagonal */}
        <motion.path
          d="M 35 40 Q 50 55 65 50 Q 80 45 85 65"
          stroke="#1B4F8A"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0.7] }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.5,
            delay: 0.3,
          }}
        />
        {/* Brush stroke 3 - vertical */}
        <motion.path
          d="M 55 30 Q 58 45 60 60 Q 62 75 58 90"
          stroke="#1B4F8A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0.7] }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.5,
            delay: 0.6,
          }}
        />
        {/* Ink dot */}
        <motion.circle
          cx="60"
          cy="60"
          r="3"
          fill="#1B4F8A"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1, 1.2, 0] }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />
      </motion.svg>

      {/* Haiku text */}
      <AnimatePresence mode="wait">
        <div className="text-center space-y-4 min-h-[120px]">
          {/* Japanese text */}
          <motion.p
            className="text-2xl font-jp text-accent-jp/80 tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {displayedJP}
            {phase === 'jp' && (
              <motion.span
                className="inline-block w-0.5 h-6 bg-accent-jp/60 ml-1 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </motion.p>

          {/* English translation */}
          {phase === 'en' && (
            <motion.p
              className="text-sm text-foreground/40 italic max-w-xs mx-auto"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {displayedEN}
              <motion.span
                className="inline-block w-0.5 h-3 bg-black/20 ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.p>
          )}

          {/* Attribution */}
          <motion.p
            className="text-xs text-foreground/20 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            -- {haiku.author}
          </motion.p>
        </div>
      </AnimatePresence>

      {/* Loading text */}
      <motion.p
        className="text-sm text-foreground/30 mt-8 tracking-widest uppercase"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Preparing your lesson...
      </motion.p>
    </div>
  )
}
