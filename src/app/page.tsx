'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 1 | 2
type Level = 'beginner' | 'basics' | 'intermediate' | 'advanced'

// ---------------------------------------------------------------------------
// Level pills data
// ---------------------------------------------------------------------------
const LEVELS: { jp: string; en: string; value: Level }[] = [
  { jp: '完全初心者', en: 'Beginner', value: 'beginner' },
  { jp: '少し知ってる', en: 'Some Basics', value: 'basics' },
  { jp: '日常会話', en: 'Intermediate', value: 'intermediate' },
  { jp: 'ほぼペラペラ', en: 'Advanced', value: 'advanced' },
]

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
  exit: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const slideUpContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
}

const slideUpItem = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: 30,
    transition: { duration: 0.25 },
  },
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const router = useRouter()
  const { corridor, uiLanguage, setCorridor, setLevel, setUiLanguage } = useAppStore()
  const [step, setStep] = useState<Step>(1)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)

  const handleCorridorPick = useCallback(
    (c: 'en-to-jp' | 'jp-to-en') => {
      setCorridor(c)
      setStep(2)
    },
    [setCorridor],
  )

  const handleBack = useCallback(() => {
    setCorridor('en-to-jp') // reset — store expects non-null, we treat step as source of truth
    setStep(1)
    setSelectedLevel(null)
  }, [setCorridor])

  const handleLevelPick = useCallback(
    (level: Level) => {
      setSelectedLevel(level)
      setLevel(level)
      const lessonId = corridor === 'jp-to-en' ? 'jp-en-1-1' : 'en-jp-1-1'
      setTimeout(() => {
        router.push(`/lesson/${lessonId}`)
      }, 300)
    },
    [corridor, setLevel, router],
  )

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* ---- Main content ---- */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl w-full">
        <AnimatePresence mode="wait">
          {/* ============================================================= */}
          {/* STEP 1 — Corridor selection                                    */}
          {/* ============================================================= */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="flex flex-col items-center w-full"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Logo */}
              <motion.h1
                variants={fadeUpItem}
                className="font-display text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight select-none"
                style={{ color: '#1a1a2e' }}
              >
                Zlang
              </motion.h1>

              {/* Tagline */}
              <motion.p
                variants={fadeUpItem}
                className="mt-3 text-lg sm:text-xl text-foreground/50 font-body"
              >
                Choose your path
              </motion.p>

              {/* Cards */}
              <motion.div
                variants={fadeUpItem}
                className="mt-14 w-full flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center"
              >
                {/* Card A — Learn Japanese */}
                <motion.button
                  onClick={() => handleCorridorPick('en-to-jp')}
                  className="group relative flex-1 max-w-lg rounded-2xl p-8 text-left cursor-pointer overflow-hidden"
                  style={{
                    background: '#1B4F8A',
                    minHeight: 280,
                    color: '#ffffff',
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 0 50px rgba(27, 79, 138, 0.5), 0 20px 60px rgba(27, 79, 138, 0.3)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* CSS decorative wave/circle pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.08] pointer-events-none"
                    style={{
                      backgroundImage:
                        'repeating-radial-gradient(circle at 30% 40%, transparent 0, transparent 20px, rgba(255,183,197,0.4) 20px, rgba(255,183,197,0.4) 21px, transparent 21px, transparent 60px), repeating-radial-gradient(circle at 70% 60%, transparent 0, transparent 30px, rgba(255,183,197,0.3) 30px, rgba(255,183,197,0.3) 31px, transparent 31px, transparent 80px)',
                    }}
                  />
                  {/* Accent cherry blossom dot */}
                  <div
                    className="absolute top-6 right-6 w-3 h-3 rounded-full"
                    style={{ background: '#FFB7C5', opacity: 0.6 }}
                  />
                  <div className="relative z-10">
                    <span className="text-3xl sm:text-4xl">🇺🇸 → 🇯🇵</span>
                    <h2 className="mt-5 font-display text-2xl sm:text-3xl font-bold">
                      Learn Japanese
                    </h2>
                    <p className="mt-3 text-sm sm:text-base opacity-70 font-body leading-relaxed">
                      Through anime, J-drama, and real street Japanese
                    </p>
                  </div>
                  {/* Bottom accent bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 opacity-40"
                    style={{ background: 'linear-gradient(to right, transparent, #FFB7C5, transparent)' }}
                  />
                </motion.button>

                {/* Card B — Learn English */}
                <motion.button
                  onClick={() => handleCorridorPick('jp-to-en')}
                  className="group relative flex-1 max-w-lg rounded-2xl p-8 text-left cursor-pointer overflow-hidden"
                  style={{
                    background: '#1A1A2E',
                    minHeight: 280,
                    color: '#ffffff',
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 0 50px rgba(0, 255, 178, 0.3), 0 20px 60px rgba(26, 26, 46, 0.5)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* CSS decorative star/dot pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.07] pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, rgba(0,255,178,0.5) 1px, transparent 1px), radial-gradient(circle, rgba(0,255,178,0.3) 1px, transparent 1px)',
                      backgroundSize: '40px 40px, 20px 20px',
                      backgroundPosition: '0 0, 10px 10px',
                    }}
                  />
                  {/* Accent mint dot */}
                  <div
                    className="absolute top-6 right-6 w-3 h-3 rounded-full"
                    style={{ background: '#00FFB2', opacity: 0.6 }}
                  />
                  <div className="relative z-10">
                    <span className="text-3xl sm:text-4xl">🇯🇵 → 🇺🇸</span>
                    <h2 className="mt-5 font-display text-2xl sm:text-3xl font-bold font-jp">
                      英語を学ぶ
                    </h2>
                    <p className="mt-3 text-sm sm:text-base opacity-70 font-body leading-relaxed">
                      Through TikTok, NBA, and internet culture
                    </p>
                  </div>
                  {/* Bottom accent bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 opacity-40"
                    style={{ background: 'linear-gradient(to right, transparent, #00FFB2, transparent)' }}
                  />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ============================================================= */}
          {/* STEP 2 — Level selector                                        */}
          {/* ============================================================= */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="flex flex-col items-center w-full"
              variants={slideUpContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Logo (smaller) */}
              <motion.h1
                variants={slideUpItem}
                className="font-display text-5xl sm:text-6xl font-bold tracking-tight select-none"
                style={{ color: '#1a1a2e' }}
              >
                Zlang
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={slideUpItem}
                className="mt-3 text-base sm:text-lg text-foreground/50 font-body"
              >
                {corridor === 'en-to-jp' ? 'Learning Japanese' : '英語を学ぶ'} — How much do you know?
              </motion.p>

              {/* Back link */}
              <motion.button
                variants={slideUpItem}
                onClick={handleBack}
                className="mt-4 text-sm text-foreground/40 hover:text-foreground/70 transition-colors font-body underline underline-offset-4 decoration-foreground/20 hover:decoration-foreground/40"
              >
                Change language
              </motion.button>

              {/* Level pills */}
              <motion.div
                variants={slideUpContainer}
                initial="hidden"
                animate="visible"
                className="mt-12 flex flex-wrap justify-center gap-4"
              >
                {LEVELS.map((lvl) => {
                  const isSelected = selectedLevel === lvl.value
                  return (
                    <motion.button
                      key={lvl.value}
                      variants={slideUpItem}
                      onClick={() => handleLevelPick(lvl.value)}
                      className="relative rounded-xl px-6 py-4 text-center cursor-pointer transition-all duration-200 min-w-[150px]"
                      style={{
                        background: isSelected ? '#1B4F8A' : 'transparent',
                        color: isSelected ? '#ffffff' : '#1a1a2e',
                        border: isSelected
                          ? '1.5px solid #1B4F8A'
                          : '1.5px solid rgba(26, 26, 46, 0.2)',
                      }}
                      whileHover={{
                        scale: 1.04,
                        borderColor: 'rgba(27, 79, 138, 0.5)',
                        boxShadow: '0 4px 20px rgba(27, 79, 138, 0.15)',
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="block font-jp text-base font-medium leading-snug">
                        {lvl.jp}
                      </span>
                      <span
                        className="block text-xs mt-1 font-body"
                        style={{ opacity: isSelected ? 0.8 : 0.5 }}
                      >
                        {lvl.en}
                      </span>
                    </motion.button>
                  )
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Bottom language toggle (always visible) ---- */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
        <div className="flex items-center gap-3 text-sm text-foreground/35 font-body">
          <span>App language:</span>
          <button
            onClick={() => setUiLanguage('en')}
            className={`px-3 py-1 rounded-full transition-all duration-200 ${
              uiLanguage === 'en'
                ? 'bg-[#1B4F8A]/10 text-[#1B4F8A] border border-[#1B4F8A]/30'
                : 'text-foreground/40 hover:text-foreground/70'
            }`}
          >
            English
          </button>
          <span className="text-foreground/15">|</span>
          <button
            onClick={() => setUiLanguage('jp')}
            className={`px-3 py-1 rounded-full font-jp transition-all duration-200 ${
              uiLanguage === 'jp'
                ? 'bg-[#1B4F8A]/10 text-[#1B4F8A] border border-[#1B4F8A]/30'
                : 'text-foreground/40 hover:text-foreground/70'
            }`}
          >
            日本語
          </button>
        </div>
      </div>
    </div>
  )
}
