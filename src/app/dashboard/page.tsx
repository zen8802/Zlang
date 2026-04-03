'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, type Variants, type Easing } from 'framer-motion'
import { useAppStore, t } from '@/store/useAppStore'
import { getNextLessonForCorridor, getLessonsByCorridor } from '@/data/curriculum'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import StreakCard from '@/components/dashboard/StreakCard'
import FeaturedClip from '@/components/dashboard/FeaturedClip'
import SkillTree from '@/components/dashboard/SkillTree'

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as Easing, delay: i * 0.15 },
  }),
}

export default function DashboardPage() {
  const router = useRouter()
  const {
    corridor,
    uiLanguage,
    lessonsCompleted,
    skillLevels,
    xpTotal,
  } = useAppStore()

  // Guard: redirect if no corridor
  useEffect(() => {
    if (!corridor) {
      router.replace('/')
    }
  }, [corridor, router])

  if (!corridor) {
    return null
  }

  const nextLesson = getNextLessonForCorridor(corridor, lessonsCompleted)
  const totalLessons = getLessonsByCorridor(corridor).length
  const completedCount = lessonsCompleted.length
  const lessonProgress = totalLessons > 0 ? completedCount / totalLessons : 0
  const allDone = !nextLesson

  const corridorBorderColor =
    corridor === 'en-to-jp' ? 'border-accent-jp/30' : 'border-accent-en/30'

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome header */}
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-display text-2xl sm:text-3xl font-bold mb-6"
        >
          {t('dashboard.welcome', uiLanguage)}{' '}
          <span className="text-accent text-glow">
            {t('dashboard.title', uiLanguage)}
          </span>
        </motion.h1>

        {/* Three-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== LEFT COLUMN ===== */}
          <motion.div
            custom={0}
            variants={columnVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Streak Card */}
            <StreakCard />

            {/* Next Lesson Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={`glass-card p-6 border ${corridorBorderColor}`}
            >
              <h2 className="font-display text-lg font-semibold mb-3 text-foreground/90">
                {t('dashboard.nextLesson', uiLanguage)}
              </h2>

              {allDone ? (
                <div className="text-center py-4">
                  <span className="text-4xl mb-2 block">🎉</span>
                  <p className="text-foreground/60 text-sm">
                    {t('dashboard.curriculumComplete', uiLanguage)}
                  </p>
                </div>
              ) : nextLesson ? (
                <div>
                  <p className="text-xs text-foreground/40 mb-1">
                    {t('dashboard.unit', uiLanguage)} {nextLesson.unit}:{' '}
                    {uiLanguage === 'jp'
                      ? nextLesson.unitTitleJP
                      : nextLesson.unitTitle}
                  </p>
                  <h3 className="font-semibold text-foreground mb-1">
                    {t('dashboard.lesson', uiLanguage)}{' '}
                    {nextLesson.lessonNumber}:{' '}
                    {uiLanguage === 'jp'
                      ? nextLesson.titleJP
                      : nextLesson.title}
                  </h3>
                  <p className="text-xs text-foreground/40 mb-4">
                    ~{nextLesson.estimatedMinutes}{' '}
                    {t('dashboard.min', uiLanguage)}
                  </p>

                  <Link href={`/lesson/${nextLesson.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-xl font-semibold text-background bg-accent shadow-[0_0_20px_rgba(27,79,138,0.25)] hover:shadow-[0_0_30px_rgba(27,79,138,0.4)] transition-shadow"
                    >
                      {t('dashboard.startLesson', uiLanguage)}
                    </motion.button>
                  </Link>
                </div>
              ) : null}
            </motion.div>
          </motion.div>

          {/* ===== CENTER COLUMN ===== */}
          <motion.div
            custom={1}
            variants={columnVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Featured Clip */}
            <div>
              <h2 className="font-display text-lg font-semibold mb-3 text-foreground/90">
                {t('dashboard.featuredClip', uiLanguage)}
              </h2>
              {nextLesson ? (
                <FeaturedClip clipId={nextLesson.clipId} />
              ) : (
                <div className="glass-card p-8 text-center text-foreground/40 text-sm">
                  {t('dashboard.curriculumComplete', uiLanguage)}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="font-display text-lg font-semibold mb-3 text-foreground/90">
                {t('dashboard.quickActions', uiLanguage)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3">
                {/* Conversation Dojo */}
                <Link href="/dojo">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-card p-4 text-center cursor-pointer hover:border-accent/20 transition-colors"
                  >
                    <span className="text-2xl block mb-1">🥋</span>
                    <span className="text-sm font-medium text-foreground/80">
                      {t('dashboard.conversationDojo', uiLanguage)}
                    </span>
                  </motion.div>
                </Link>

                {/* Humor Lab */}
                {completedCount >= 10 ? (
                  <Link href="/humor-lab">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="glass-card p-4 text-center cursor-pointer hover:border-accent/20 transition-colors"
                    >
                      <span className="text-2xl block mb-1">😂</span>
                      <span className="text-sm font-medium text-foreground/80">
                        {t('dashboard.humorLabTitle', uiLanguage)}
                      </span>
                    </motion.div>
                  </Link>
                ) : (
                  <motion.div
                    className="glass-card p-4 text-center opacity-50 cursor-not-allowed relative"
                  >
                    <span className="text-2xl block mb-1">🔒</span>
                    <span className="text-sm font-medium text-foreground/50">
                      {t('dashboard.humorLabTitle', uiLanguage)}
                    </span>
                    <span className="text-[10px] block text-foreground/30 mt-0.5">
                      {t('dashboard.locked', uiLanguage)} (10 {t('dashboard.lessonProgress', uiLanguage)})
                    </span>
                  </motion.div>
                )}

                {/* Review Vocab */}
                <Link href="/settings">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-card p-4 text-center cursor-pointer hover:border-accent/20 transition-colors"
                  >
                    <span className="text-2xl block mb-1">📚</span>
                    <span className="text-sm font-medium text-foreground/80">
                      {t('dashboard.reviewVocab', uiLanguage)}
                    </span>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ===== RIGHT COLUMN ===== */}
          <motion.div
            custom={2}
            variants={columnVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Skills */}
            <div className="glass-card p-6">
              <h2 className="font-display text-lg font-semibold mb-4 text-foreground/90">
                {t('dashboard.yourSkills', uiLanguage)}
              </h2>
              <SkillTree skillLevels={skillLevels} />
            </div>

            {/* Lesson progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="glass-card p-6"
            >
              <h2 className="font-display text-lg font-semibold mb-3 text-foreground/90">
                {t('dashboard.yourProgress', uiLanguage)}
              </h2>

              {/* Lessons completed bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground/60">
                    {t('dashboard.lessonsCompleted', uiLanguage)}
                  </span>
                  <span className="text-sm font-medium text-accent">
                    {completedCount}/{totalLessons}
                  </span>
                </div>
                <div className="h-2.5 bg-black/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lessonProgress * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent"
                    style={{
                      boxShadow: '0 0 12px rgba(27, 79, 138, 0.4)',
                    }}
                  />
                </div>
              </div>

              {/* Total XP */}
              <div className="flex items-center justify-between pt-3 border-t border-black/8">
                <span className="text-sm text-foreground/60">
                  {t('dashboard.totalXP', uiLanguage)}
                </span>
                <span className="font-display text-xl font-bold text-accent text-glow">
                  {xpTotal.toLocaleString()}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
