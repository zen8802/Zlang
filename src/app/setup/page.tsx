'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, t } from '@/store/useAppStore'
import { EN_TO_JP_INTERESTS, JP_TO_EN_INTERESTS } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 4

const LEVELS = [
  { value: 'beginner' as const, icon: '🌱', key: 'beginner' },
  { value: 'basics' as const, icon: '🌿', key: 'basics' },
  { value: 'intermediate' as const, icon: '🌳', key: 'intermediate' },
  { value: 'advanced' as const, icon: '⛰️', key: 'advanced' },
]

const GOALS = [
  { value: 'media', icon: '🎬', key: 'media' },
  { value: 'travel', icon: '✈️', key: 'travel' },
  { value: 'social', icon: '💬', key: 'social' },
  { value: 'business', icon: '💼', key: 'business' },
  { value: 'exam', icon: '📝', key: 'exam' },
  { value: 'fun', icon: '🎉', key: 'fun' },
]

const TIME_OPTIONS = [
  { value: 5, icon: '⏱️', key: '5' },
  { value: 15, icon: '🚶', key: '15' },
  { value: 30, icon: '🏃', key: '30' },
  { value: 60, icon: '🔥', key: '60' },
]

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

const pageTransition = {
  type: 'tween' as const,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  duration: 0.4,
}

const pillStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const pillItem = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const cardStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

// ---------------------------------------------------------------------------
// Progress Dots
// ---------------------------------------------------------------------------
function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < step
        const isActive = i === step
        return (
          <motion.div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              isActive
                ? 'w-8 h-3 bg-accent'
                : isCompleted
                ? 'w-3 h-3 bg-accent/60'
                : 'w-3 h-3 bg-white/15'
            }`}
            layout
          />
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Interests
// ---------------------------------------------------------------------------
function StepInterests({
  corridor,
  lang,
  selected,
  onToggle,
}: {
  corridor: 'en-to-jp' | 'jp-to-en'
  lang: 'en' | 'jp'
  selected: string[]
  onToggle: (id: string) => void
}) {
  const interests =
    corridor === 'en-to-jp' ? EN_TO_JP_INTERESTS : JP_TO_EN_INTERESTS

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm text-white/40 mb-6 font-body">
        {t('setup.interests.instruction', lang)}
      </p>
      <motion.div
        className="flex flex-wrap justify-center gap-3 max-w-lg"
        variants={pillStagger}
        initial="hidden"
        animate="visible"
      >
        {interests.map((interest) => {
          const isSelected = selected.includes(interest.id)
          return (
            <motion.button
              key={interest.id}
              variants={pillItem}
              onClick={() => onToggle(interest.id)}
              className={`px-4 py-2.5 rounded-full text-sm font-body transition-all duration-200 cursor-pointer select-none ${
                isSelected
                  ? 'bg-accent/15 text-accent border border-accent/50 shadow-[0_0_12px_rgba(0,255,178,0.15)]'
                  : 'bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-1.5">{interest.emoji}</span>
              {lang === 'jp' ? interest.labelJP : interest.label}
            </motion.button>
          )
        })}
      </motion.div>
      <p className="mt-5 text-xs text-white/30">
        {selected.length}/5 {lang === 'en' ? 'selected' : '選択済み'}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Level
// ---------------------------------------------------------------------------
function StepLevel({
  lang,
  selected,
  onSelect,
}: {
  lang: 'en' | 'jp'
  selected: string
  onSelect: (val: '' | 'beginner' | 'basics' | 'intermediate' | 'advanced') => void
}) {
  return (
    <motion.div
      className="flex flex-col gap-3 w-full max-w-md"
      variants={cardStagger}
      initial="hidden"
      animate="visible"
    >
      {LEVELS.map((level) => {
        const isSelected = selected === level.value
        return (
          <motion.button
            key={level.value}
            variants={cardItem}
            onClick={() => onSelect(level.value)}
            className={`glass-card p-5 text-left transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-accent/50 shadow-[0_0_20px_rgba(0,255,178,0.12)]'
                : 'border-white/[0.08]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <h3 className="font-display font-semibold text-white text-base">
                  {t(`setup.level.${level.key}`, lang)}
                </h3>
                <p className="text-sm text-white/40 mt-0.5 font-body">
                  {t(`setup.level.${level.key}Desc`, lang)}
                </p>
              </div>
            </div>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Goal
// ---------------------------------------------------------------------------
function StepGoal({
  lang,
  corridor,
  selected,
  onSelect,
}: {
  lang: 'en' | 'jp'
  corridor: 'en-to-jp' | 'jp-to-en'
  selected: string
  onSelect: (val: string) => void
}) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
      variants={cardStagger}
      initial="hidden"
      animate="visible"
    >
      {GOALS.map((goal) => {
        const isSelected = selected === goal.value
        // For the exam goal, use corridor-specific label
        let label: string
        if (goal.key === 'exam') {
          label =
            corridor === 'en-to-jp'
              ? t('setup.goal.exam', lang)
              : t('setup.goal.examEN', lang)
        } else {
          label = t(`setup.goal.${goal.key}`, lang)
        }
        return (
          <motion.button
            key={goal.value}
            variants={cardItem}
            onClick={() => onSelect(goal.value)}
            className={`glass-card p-5 text-left transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-accent/50 shadow-[0_0_20px_rgba(0,255,178,0.12)]'
                : 'border-white/[0.08]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl block mb-2">{goal.icon}</span>
            <h3 className="font-body font-medium text-white text-sm">
              {label}
            </h3>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Daily Time
// ---------------------------------------------------------------------------
function StepTime({
  lang,
  selected,
  onSelect,
}: {
  lang: 'en' | 'jp'
  selected: number
  onSelect: (val: number) => void
}) {
  return (
    <motion.div
      className="flex flex-col gap-3 w-full max-w-md"
      variants={cardStagger}
      initial="hidden"
      animate="visible"
    >
      {TIME_OPTIONS.map((opt) => {
        const isSelected = selected === opt.value
        return (
          <motion.button
            key={opt.value}
            variants={cardItem}
            onClick={() => onSelect(opt.value)}
            className={`glass-card p-5 text-left transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-accent/50 shadow-[0_0_20px_rgba(0,255,178,0.12)]'
                : 'border-white/[0.08]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{opt.icon}</span>
              <h3 className="font-body font-medium text-white text-sm">
                {t(`setup.time.${opt.key}`, lang)}
              </h3>
            </div>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Setup Page (Wizard)
// ---------------------------------------------------------------------------
export default function SetupPage() {
  const router = useRouter()
  const {
    corridor,
    uiLanguage,
    interests,
    level,
    goal,
    dailyMinutes,
    setInterests,
    setLevel,
    setGoal,
    setDailyMinutes,
    completeSetup,
  } = useAppStore()

  const lang = uiLanguage
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // -- Interest toggling --
  const toggleInterest = useCallback(
    (id: string) => {
      const current = [...interests]
      const idx = current.indexOf(id)
      if (idx >= 0) {
        current.splice(idx, 1)
      } else if (current.length < 5) {
        current.push(id)
      }
      setInterests(current)
    },
    [interests, setInterests],
  )

  // If no corridor selected, redirect back to landing
  useEffect(() => {
    if (!corridor) {
      router.replace('/')
    }
  }, [corridor, router])

  if (!corridor) {
    return null
  }

  // -- Navigation --
  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return interests.length >= 3
      case 1:
        return !!level
      case 2:
        return !!goal
      case 3:
        return dailyMinutes > 0
      default:
        return false
    }
  }

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      completeSetup()
      router.push('/dashboard')
    }
  }

  const goBack = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  // Step titles
  const stepTitles: Record<number, string> = {
    0: t('setup.interests.title', lang),
    1: t('setup.level.title', lang),
    2: t('setup.goal.title', lang),
    3: t('setup.time.title', lang),
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Progress dots */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ProgressDots step={step} total={TOTAL_STEPS} />
      </motion.div>

      {/* Step title */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={`title-${step}`}
          className={`font-display text-2xl sm:text-3xl font-bold text-white text-center mb-10 ${
            lang === 'jp' ? 'font-jp' : ''
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {stepTitles[step]}
        </motion.h1>
      </AnimatePresence>

      {/* Step content */}
      <div className="flex-1 w-full flex justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="w-full flex justify-center"
          >
            {step === 0 && (
              <StepInterests
                corridor={corridor}
                lang={lang}
                selected={interests}
                onToggle={toggleInterest}
              />
            )}
            {step === 1 && (
              <StepLevel
                lang={lang}
                selected={level}
                onSelect={setLevel}
              />
            )}
            {step === 2 && (
              <StepGoal
                lang={lang}
                corridor={corridor}
                selected={goal}
                onSelect={setGoal}
              />
            )}
            {step === 3 && (
              <StepTime
                lang={lang}
                selected={dailyMinutes}
                onSelect={setDailyMinutes}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Back / Next buttons */}
      <motion.div
        className="mt-10 flex items-center gap-4 w-full max-w-md justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={goBack}
          disabled={step === 0}
          className={`px-6 py-3 rounded-xl font-body text-sm transition-all duration-200 ${
            step === 0
              ? 'text-white/20 cursor-not-allowed'
              : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          {t('setup.nav.back', lang)}
        </button>

        <button
          onClick={goNext}
          disabled={!canAdvance()}
          className={`px-8 py-3 rounded-xl font-display font-semibold text-sm transition-all duration-200 ${
            canAdvance()
              ? 'bg-accent text-background hover:shadow-[0_0_24px_rgba(0,255,178,0.4)] hover:scale-105'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {step === TOTAL_STEPS - 1
            ? t('setup.nav.finish', lang)
            : t('setup.nav.next', lang)}
        </button>
      </motion.div>
    </div>
  )
}
