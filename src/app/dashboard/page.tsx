'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore, t } from '@/store/useAppStore'
import Navbar from '@/components/layout/Navbar'

interface DbLesson {
  id: string
  title: string
  order: number
  unit: number
  estimated_minutes: number
  jlpt_level: string
}

export default function DashboardPage() {
  const router = useRouter()
  const corridor = useAppStore((s) => s.corridor)
  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const lessonsCompleted = useAppStore((s) => s.lessonsCompleted)
  const xpTotal = useAppStore((s) => s.xpTotal)
  const streak = useAppStore((s) => s.streak)
  const xpToday = useAppStore((s) => s.xpToday)

  const [allLessons, setAllLessons] = useState<DbLesson[]>([])
  const [loadingLessons, setLoadingLessons] = useState(true)

  useEffect(() => {
    if (!corridor) { router.replace('/'); return }
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(data => {
        const published = ((data.lessons || []) as DbLesson[])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((l: any) => l.is_published !== false)
          .sort((a: DbLesson, b: DbLesson) => a.unit - b.unit || a.order - b.order)
        setAllLessons(published)
      })
      .catch(() => setAllLessons([]))
      .finally(() => setLoadingLessons(false))
  }, [corridor, router])

  if (!corridor) return null

  const nextLesson = allLessons.find(l => !lessonsCompleted.includes(l.id)) || null
  const totalLessons = allLessons.length
  const completedCount = lessonsCompleted.filter(id => allLessons.some(l => l.id === id)).length
  const lessonProgress = totalLessons > 0 ? completedCount / totalLessons : 0
  const allDone = !nextLesson && !loadingLessons

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Hero streak + XP card */}
        <div
          className="bg-white rounded-[20px] p-6 mb-4"
          style={{
            boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 6px 0 rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p
                  className="text-3xl font-black"
                  style={{ color: '#FFB800', fontFamily: 'Nunito' }}
                >
                  {streak}
                </p>
                <p className="text-xs font-bold" style={{ color: '#9CA3AF' }}>
                  {t('dashboard.dayStreak', uiLanguage)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-2xl font-black"
                style={{ color: '#1B4F8A', fontFamily: 'Nunito' }}
              >
                {xpTotal.toLocaleString()}
              </p>
              <p className="text-xs font-bold" style={{ color: '#9CA3AF' }}>
                {t('dashboard.totalXP', uiLanguage)}
              </p>
            </div>
          </div>

          {/* Today's goal progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold" style={{ color: '#9CA3AF' }}>
                {t('dashboard.todayXP', uiLanguage)}
              </span>
              <span className="text-xs font-bold" style={{ color: '#9CA3AF' }}>
                {xpToday} / 100 XP
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, xpToday)}%`,
                  background: 'linear-gradient(90deg, #1B4F8A, #1B4F8Acc)',
                  boxShadow: '0 2px 4px #1B4F8A44',
                }}
              />
            </div>
          </div>

          {/* Continue lesson button */}
          {allDone ? (
            <div className="text-center py-4 mt-4">
              <span className="text-4xl mb-2 block">🎉</span>
              <p className="text-sm font-bold" style={{ color: '#6B7280' }}>
                {t('dashboard.curriculumComplete', uiLanguage)}
              </p>
            </div>
          ) : nextLesson ? (
            <div className="mt-4">
              <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>
                {t('dashboard.unit', uiLanguage)} {nextLesson.unit} · Lesson {nextLesson.order}
              </p>
              <p
                className="text-sm font-bold mb-3"
                style={{ color: '#1A1A2E', fontFamily: 'Nunito' }}
              >
                {nextLesson.title}
              </p>
              <Link href={`/lesson/${nextLesson.id}`}>
                <button
                  className="w-full py-4 rounded-[16px] text-base font-bold text-white shadow-[0_4px_0_#133970] hover:brightness-110 active:shadow-none active:translate-y-[4px] transition-all"
                  style={{ backgroundColor: '#1B4F8A', fontFamily: 'Nunito' }}
                >
                  {t('dashboard.startLesson', uiLanguage)} →
                </button>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'Nunito', color: '#1A1A2E' }}>
            {t('dashboard.quickActions', uiLanguage)}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/studio">
              <div className="bg-white rounded-[20px] p-5 text-center cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[2px]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 4px 0 rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="text-3xl block mb-2">🎭</span>
                <span className="text-sm font-bold" style={{ color: '#1A1A2E', fontFamily: 'Nunito' }}>Scenario Studio</span>
              </div>
            </Link>
            <Link href="/lessons">
              <div className="bg-white rounded-[20px] p-5 text-center cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[2px]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 4px 0 rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="text-3xl block mb-2">📚</span>
                <span className="text-sm font-bold" style={{ color: '#1A1A2E', fontFamily: 'Nunito' }}>All Lessons</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div
          className="bg-white rounded-[20px] p-6 mb-4"
          style={{
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.06), 0 4px 0 rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.04)',
          }}
        >
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: 'Nunito', color: '#1A1A2E' }}
          >
            {t('dashboard.yourProgress', uiLanguage)}
          </h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: '#6B7280' }}>
              {t('dashboard.lessonsCompleted', uiLanguage)}
            </span>
            <span className="text-sm font-bold" style={{ color: '#1B4F8A' }}>
              {completedCount}/{totalLessons}
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${lessonProgress * 100}%`,
                background: 'linear-gradient(90deg, #1B4F8A, #1B4F8Acc)',
                boxShadow: '0 2px 4px #1B4F8A44',
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
