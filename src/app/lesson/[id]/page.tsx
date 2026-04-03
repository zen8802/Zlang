'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getLessonById } from '@/data/curriculum'
import ImmersionPhase from '@/components/lesson/ImmersionPhase'
import DecodePhase from '@/components/lesson/DecodePhase'
import ShadowingPhase from '@/components/lesson/ShadowingPhase'
import ResponsePhase from '@/components/lesson/ResponsePhase'
import CulturalDivePhase from '@/components/lesson/CulturalDivePhase'
import VocabLockPhase from '@/components/lesson/VocabLockPhase'
import GuestLessonGate from '@/components/GuestLessonGate'

type Phase = 1 | 2 | 3 | 4 | 5 | 6

const PHASE_LABELS = [
  'Immersion',
  'Decode',
  'Shadowing',
  'Response',
  'Culture',
  'Vocab',
] as const

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string

  const [currentPhase, setCurrentPhase] = useState<Phase>(1)
  const [shadowingStars, setShadowingStars] = useState(0)
  const [responseGrade, setResponseGrade] = useState('')
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back

  const uiLanguage = useAppStore((s) => s.uiLanguage)

  const lesson = getLessonById(lessonId)

  // Advance to next phase
  const advancePhase = useCallback(() => {
    setDirection(1)
    setCurrentPhase((prev) => Math.min(6, prev + 1) as Phase)
  }, [])

  const handleShadowingComplete = useCallback(
    (stars: number) => {
      setShadowingStars(stars)
      advancePhase()
    },
    [advancePhase],
  )

  const handleResponseComplete = useCallback(
    (grade: string) => {
      setResponseGrade(grade)
      advancePhase()
    },
    [advancePhase],
  )

  const handleLessonComplete = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const handleBack = useCallback(() => {
    if (currentPhase > 1) {
      setDirection(-1)
      setCurrentPhase((prev) => Math.max(1, prev - 1) as Phase)
    } else {
      router.push('/dashboard')
    }
  }, [currentPhase, router])

  // 404 state
  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-6xl font-display font-bold text-foreground/20">404</p>
          <p className="text-foreground/50">Lesson not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-accent hover:text-accent/80 underline text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  }

  return (
    <div className="min-h-screen bg-background relative">
      <GuestLessonGate lessonId={lessonId} />
      {/* Top bar */}
      <motion.header
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-black/5"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="text-foreground/40 hover:text-foreground/70 transition-colors p-1"
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Lesson title */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground/30 truncate">
              Unit {lesson.unit}: {uiLanguage === 'jp' ? lesson.unitTitleJP : lesson.unitTitle}
            </p>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {uiLanguage === 'jp' ? lesson.titleJP : lesson.title}
            </h1>
          </div>

          {/* Phase progress indicator */}
          <div className="flex items-center gap-1.5">
            {PHASE_LABELS.map((label, i) => {
              const phaseNum = (i + 1) as Phase
              const isActive = phaseNum === currentPhase
              const isCompleted = phaseNum < currentPhase

              return (
                <div key={label} className="flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      isActive
                        ? 'bg-accent shadow-[0_0_8px_rgba(27,79,138,0.5)]'
                        : isCompleted
                          ? 'bg-accent/40'
                          : 'bg-black/[0.05]'
                    }`}
                    animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                    transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
                  />
                </div>
              )
            })}
            <span className="text-[10px] text-foreground/30 ml-2 tabular-nums">
              {currentPhase}/6
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-black/[0.03]">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${((currentPhase - 1) / 5) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPhase}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {currentPhase === 1 && (
              <ImmersionPhase
                lessonId={lessonId}
                clipId={lesson.clipId}
                onComplete={advancePhase}
              />
            )}

            {currentPhase === 2 && (
              <DecodePhase
                lessonId={lessonId}
                clipId={lesson.clipId}
                onComplete={advancePhase}
              />
            )}

            {currentPhase === 3 && (
              <ShadowingPhase
                clipId={lesson.clipId}
                onComplete={handleShadowingComplete}
              />
            )}

            {currentPhase === 4 && (
              <ResponsePhase
                lessonId={lessonId}
                clipId={lesson.clipId}
                onComplete={handleResponseComplete}
              />
            )}

            {currentPhase === 5 && (
              <CulturalDivePhase
                lessonId={lessonId}
                clipId={lesson.clipId}
                onComplete={advancePhase}
              />
            )}

            {currentPhase === 6 && (
              <VocabLockPhase
                clipId={lesson.clipId}
                lessonId={lessonId}
                shadowingStars={shadowingStars}
                responseGrade={responseGrade}
                onComplete={handleLessonComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Phase label tooltip at bottom */}
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="glass-card px-4 py-2 text-xs text-foreground/30 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Phase {currentPhase}: {PHASE_LABELS[currentPhase - 1]}
          <span className="text-foreground/15 ml-1">
            ~ {lesson.estimatedMinutes} min total
          </span>
        </div>
      </motion.div>
    </div>
  )
}
