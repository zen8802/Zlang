'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAppStore, t } from '@/store/useAppStore'
import { useMemo, useState, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Japanese character sets for the matrix rain
// ---------------------------------------------------------------------------
const HIRAGANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'
const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
const KANJI = '一二三四五六七八九十百千万円人日月火水木金土年時中大小上下左右前後東西南北口目手足'
const ALL_CHARS = HIRAGANA + KATAKANA + KANJI

function randomChars(count: number): string {
  let result = ''
  for (let i = 0; i < count; i++) {
    result += ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)]
  }
  return result
}

// Pre-generate column data so it doesn't change on re-render
function generateColumns(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    chars: randomChars(12 + Math.floor(Math.random() * 8)),
    left: `${(i / count) * 100}%`,
    duration: 6 + Math.random() * 10,
    delay: Math.random() * -16,
    fontSize: 12 + Math.floor(Math.random() * 6),
    opacity: 0.04 + Math.random() * 0.1,
  }))
}

// ---------------------------------------------------------------------------
// Matrix Rain Background Component
// ---------------------------------------------------------------------------
function MatrixRain() {
  const [mounted, setMounted] = useState(false)
  const columns = useMemo(() => (mounted ? generateColumns(28) : []), [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {columns.map((col) => (
        <div
          key={col.id}
          className="char-rain-column"
          style={{
            left: col.left,
            ['--rain-duration' as string]: `${col.duration}s`,
            ['--rain-delay' as string]: `${col.delay}s`,
            ['--rain-font-size' as string]: `${col.fontSize}px`,
            ['--rain-opacity' as string]: col.opacity,
          }}
        >
          {col.chars.split('').map((char, ci) => (
            <span key={ci}>{char}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const router = useRouter()
  const { uiLanguage, setCorridor, setUiLanguage } = useAppStore()
  const lang = uiLanguage

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Matrix rain background */}
      <MatrixRain />

      {/* Center content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo / Title */}
        <motion.h1
          variants={itemVariants}
          className="font-display text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white text-glow select-none"
        >
          Zlang
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className={`mt-4 text-lg sm:text-xl md:text-2xl text-white/70 max-w-md ${
            lang === 'jp' ? 'font-jp' : 'font-body'
          }`}
        >
          {lang === 'en'
            ? 'Learn through what you love'
            : '好きなコンテンツで学ぼう'}
        </motion.p>

        {/* Corridor cards */}
        <motion.div
          variants={itemVariants}
          className="mt-12 w-full flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center"
        >
          {/* Card A: EN -> JP */}
          <motion.button
            onClick={() => {
              setCorridor('en-to-jp')
              router.push('/setup')
            }}
            className="glass-card group relative flex-1 max-w-md p-6 sm:p-8 text-left cursor-pointer transition-all duration-300 border border-white/[0.08] hover:border-accent-jp/60"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow =
                '0 0 30px rgba(255, 107, 53, 0.25), inset 0 0 30px rgba(255, 107, 53, 0.05)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
            }}
          >
            {/* Decorative gradient placeholder */}
            <div className="w-full h-32 sm:h-40 rounded-xl mb-5 bg-gradient-to-br from-accent-jp/30 via-orange-600/20 to-amber-500/10 flex items-center justify-center">
              <span className="text-5xl sm:text-6xl opacity-60">🏯</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              {t('landing.corridorA.title', lang)}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/50 font-body">
              {t('landing.corridorA.subtitle', lang)}
            </p>
          </motion.button>

          {/* Card B: JP -> EN */}
          <motion.button
            onClick={() => {
              setCorridor('jp-to-en')
              router.push('/setup')
            }}
            className="glass-card group relative flex-1 max-w-md p-6 sm:p-8 text-left cursor-pointer transition-all duration-300 border border-white/[0.08] hover:border-accent-en/60"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow =
                '0 0 30px rgba(59, 130, 246, 0.25), inset 0 0 30px rgba(59, 130, 246, 0.05)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
            }}
          >
            <div className="w-full h-32 sm:h-40 rounded-xl mb-5 bg-gradient-to-br from-accent-en/30 via-blue-600/20 to-cyan-500/10 flex items-center justify-center">
              <span className="text-5xl sm:text-6xl opacity-60">🗽</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white font-jp">
              {t('landing.corridorB.title', lang)}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/50 font-body">
              {t('landing.corridorB.subtitle', lang)}
            </p>
          </motion.button>
        </motion.div>

        {/* Language toggle */}
        <motion.div
          variants={itemVariants}
          className="mt-14 flex items-center gap-3 text-sm text-white/40 font-body"
        >
          <span>{t('landing.appLanguage', lang)}</span>
          <button
            onClick={() => setUiLanguage('en')}
            className={`px-3 py-1 rounded-full transition-all duration-200 ${
              lang === 'en'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            English
          </button>
          <span className="text-white/20">|</span>
          <button
            onClick={() => setUiLanguage('jp')}
            className={`px-3 py-1 rounded-full font-jp transition-all duration-200 ${
              lang === 'jp'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            日本語
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
