'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import FlipCard from '@/components/ui/FlipCard'
import ProgressBar from '@/components/ui/ProgressBar'
import { useAppStore } from '@/store/useAppStore'
import { getClipById } from '@/data/clips'
import { getLessonById } from '@/data/curriculum'
import { recordReview } from '@/lib/srs'
import { calculateLessonXP } from '@/lib/progress'
import { VocabItem } from '@/types'

interface VocabLockPhaseProps {
  clipId: string
  lessonId: string
  shadowingStars: number
  responseGrade: string
  onComplete: () => void
}

// Confetti colors
const CONFETTI_COLORS = ['#1B4F8A', '#FF6B35', '#3B82F6', '#A855F7', '#F59E0B', '#EC4899']

function ConfettiPiece({ index }: { index: number }) {
  const left = Math.random() * 100
  const delay = Math.random() * 1.5
  const size = 6 + Math.random() * 8
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
  const rotation = Math.random() * 360
  const duration = 2.5 + Math.random() * 2

  return (
    <motion.div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${left}%`,
        top: '-20px',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
      initial={{ y: -20, rotate: rotation, opacity: 1 }}
      animate={{
        y: '100vh',
        rotate: rotation + 720,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeIn',
      }}
    />
  )
}

export default function VocabLockPhase({
  clipId,
  lessonId,
  shadowingStars,
  responseGrade,
  onComplete,
}: VocabLockPhaseProps) {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const lesson = getLessonById(lessonId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())
  const [isComplete, setIsComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const confettiShownRef = useRef(false)

  const corridor = useAppStore((s) => s.corridor)
  const completeLesson = useAppStore((s) => s.completeLesson)
  const addXP = useAppStore((s) => s.addXP)
  const updateSkill = useAppStore((s) => s.updateSkill)
  const updateStreak = useAppStore((s) => s.updateStreak)

  const clip = getClipById(clipId)
  const vocab: VocabItem[] = useMemo(() => clip?.vocab?.slice(0, 5) || [], [clip])

  const handleRate = useCallback(
    (vocabIndex: number, confidence: number) => {
      const vocabItem = vocab[vocabIndex]
      if (!vocabItem) return

      // Record SRS review
      recordReview(vocabItem.id, confidence as 1 | 2 | 3)

      // Mark as reviewed
      setReviewed((prev) => {
        const next = new Set(prev)
        next.add(vocabIndex)
        return next
      })

      // Auto-advance to next card after a small delay
      setTimeout(() => {
        if (vocabIndex < vocab.length - 1) {
          setCurrentIndex(vocabIndex + 1)
        }
      }, 600)
    },
    [vocab],
  )

  // Check completion
  useEffect(() => {
    if (reviewed.size >= vocab.length && vocab.length > 0 && !confettiShownRef.current) {
      confettiShownRef.current = true

      // Calculate XP
      const totalXP = calculateLessonXP({
        immersion: true,
        decode: true,
        shadowingStars,
        responseGrade,
      })
      setXpEarned(totalXP)

      // Award XP and complete lesson
      addXP(totalXP)
      completeLesson(lessonId)
      updateStreak()

      // Update skill levels based on lesson data
      const lessonData = getLessonById(lessonId)
      if (lessonData?.skills) {
        lessonData.skills.forEach((skill: string) => {
          updateSkill(skill, 0.2)
        })
      }

      // Trigger confetti with a slight delay for dramatic effect
      setTimeout(() => {
        setShowConfetti(true)
        setIsComplete(true)
      }, 300)
    }
  }, [reviewed, vocab.length, shadowingStars, responseGrade, lessonId, addXP, completeLesson, updateStreak, updateSkill])

  const reviewedCount = reviewed.size
  const progressPercent = vocab.length > 0 ? (reviewedCount / vocab.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 60 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      {/* Phase header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-accent uppercase tracking-[0.2em] mb-1">Phase 6</p>
        <h2 className="text-2xl font-display font-bold text-foreground">Vocab Lock-in</h2>
        <p className="text-sm text-foreground/40 mt-1">
          Lock these words into long-term memory.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="vocab"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Progress */}
            <div className="space-y-2">
              <ProgressBar
                value={progressPercent}
                color="accent"
                label={`${reviewedCount}/${vocab.length} words reviewed`}
                showPercentage={false}
                height="h-2"
              />

              {/* Word navigation dots */}
              <div className="flex justify-center gap-2 pt-1">
                {vocab.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i === currentIndex
                        ? 'bg-accent scale-125'
                        : reviewed.has(i)
                          ? 'bg-accent/30'
                          : 'bg-black/[0.07]'
                    }`}
                    aria-label={`Word ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* FlipCard for current vocab */}
            {vocab[currentIndex] && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <FlipCard
                  word={vocab[currentIndex].word}
                  reading={vocab[currentIndex].reading}
                  meaning={vocab[currentIndex].meaning}
                  exampleSentence={vocab[currentIndex].exampleSentence}
                  exampleTranslation={vocab[currentIndex].exampleTranslation}
                  wordColor={corridor === 'en-to-jp' ? 'jp' : 'en'}
                  onRate={
                    reviewed.has(currentIndex)
                      ? undefined
                      : (confidence) => handleRate(currentIndex, confidence)
                  }
                />

                {/* Already reviewed indicator */}
                {reviewed.has(currentIndex) && (
                  <motion.p
                    className="text-center text-sm text-accent/60 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Reviewed! Tap a dot above to move to another word.
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Navigation buttons for manual control */}
            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentIndex >= vocab.length - 1}
                onClick={() => setCurrentIndex((i) => Math.min(vocab.length - 1, i + 1))}
              >
                Next
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Completion screen */
          <motion.div
            key="complete"
            className="space-y-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Big celebration */}
            <motion.div
              className="space-y-4"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              <motion.div
                className="text-6xl font-display font-bold text-accent text-glow"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Lesson Complete!
              </motion.div>
              <p className="text-foreground/50 text-sm">
                You crushed it. Every lesson makes you sharper.
              </p>
            </motion.div>

            {/* XP earned card */}
            <motion.div
              className="glass-card p-8 max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-foreground/30 uppercase tracking-wider mb-3">XP Earned</p>
              <motion.p
                className="text-5xl font-display font-bold text-accent tabular-nums"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              >
                +{xpEarned}
              </motion.p>
              <p className="text-xs text-foreground/30 mt-3">
                {xpEarned >= 100 ? 'Perfect lesson bonus earned!' : 'Great work! Keep improving.'}
              </p>
            </motion.div>

            {/* Phase breakdown */}
            <motion.div
              className="grid grid-cols-2 gap-3 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[
                { label: 'Immersion', icon: '🎬', done: true },
                { label: 'Decode', icon: '🔍', done: true },
                { label: 'Shadowing', icon: '🎙', done: true, detail: `${shadowingStars}/5 stars` },
                { label: 'Response', icon: '✍', done: true, detail: `Grade ${responseGrade}` },
                { label: 'Culture', icon: '🌏', done: true },
                { label: 'Vocab', icon: '🧠', done: true, detail: `${vocab.length} words` },
              ].map((phase, i) => (
                <motion.div
                  key={phase.label}
                  className="glass-card p-3 flex items-center gap-3"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                >
                  <span className="text-lg">{phase.icon}</span>
                  <div className="text-left">
                    <p className="text-xs text-foreground/60">{phase.label}</p>
                    {phase.detail && (
                      <p className="text-[10px] text-accent/60">{phase.detail}</p>
                    )}
                  </div>
                  <svg
                    className="ml-auto text-accent"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M13.333 4L6 11.333 2.667 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              ))}
            </motion.div>

            {/* Back to dashboard OR guest upsell */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="max-w-md mx-auto w-full space-y-3"
            >
              {!isSignedIn && lesson?.lessonNumber === 1 ? (
                <>
                  <div className="text-center mb-4">
                    <span className="text-4xl">&#x1F525;</span>
                    <p className="text-foreground/50 text-sm mt-2">
                      Create a free account to keep your streak alive and unlock all lessons.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      localStorage.setItem('zlang_intended_lesson', lessonId)
                      router.push('/sign-up?reason=streak')
                    }}
                  >
                    Save My Progress &mdash; It&apos;s Free
                  </Button>
                  <button
                    onClick={onComplete}
                    className="w-full py-3 text-foreground/40 text-sm hover:text-foreground/60 transition-colors"
                  >
                    Maybe later
                  </button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={onComplete}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7.5 17.5V10h5v7.5M2.5 7.5L10 1.667 17.5 7.5v9.167a1.667 1.667 0 01-1.667 1.666H4.167A1.667 1.667 0 012.5 16.667V7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                >
                  Back to Dashboard
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
