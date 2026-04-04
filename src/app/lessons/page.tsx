'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getLessonsByCorridor } from '@/data/curriculum'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'

export default function LessonsPage() {
  const router = useRouter()
  const corridor = useAppStore((s) => s.corridor)
  const lessonsCompleted = useAppStore((s) => s.lessonsCompleted)

  if (!corridor) {
    router.replace('/')
    return null
  }

  const lessons = getLessonsByCorridor(corridor)

  // Group by unit
  const units = lessons.reduce<Record<number, typeof lessons>>((acc, lesson) => {
    if (!acc[lesson.unit]) acc[lesson.unit] = []
    acc[lesson.unit].push(lesson)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.h1
          className="text-3xl font-display font-bold text-foreground mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Lessons
        </motion.h1>

        <div className="space-y-10">
          {Object.entries(units).map(([unitNum, unitLessons]) => (
            <motion.section
              key={unitNum}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Number(unitNum) * 0.1 }}
            >
              <h2 className="text-xs text-foreground/40 uppercase tracking-widest mb-3">
                Unit {unitNum} — {unitLessons[0].unitTitle}
              </h2>

              <div className="space-y-2">
                {unitLessons.map((lesson) => {
                  const done = lessonsCompleted.includes(lesson.id)
                  return (
                    <motion.button
                      key={lesson.id}
                      onClick={() => router.push(`/lesson/${lesson.id}`)}
                      className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all"
                      style={{
                        borderColor: done ? 'rgba(27, 79, 138, 0.3)' : undefined,
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          done
                            ? 'bg-accent text-white'
                            : 'bg-black/[0.05] text-foreground/40'
                        }`}
                      >
                        {done ? '✓' : lesson.lessonNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {lesson.title}
                        </p>
                        <p className="text-xs text-foreground/40 truncate">
                          {lesson.description}
                        </p>
                      </div>
                      <span className="ml-auto text-xs text-foreground/30 shrink-0">
                        {lesson.estimatedMinutes}m
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.section>
          ))}
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
