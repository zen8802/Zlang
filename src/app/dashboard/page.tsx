'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore, t } from '@/store/useAppStore'
import Navbar from '@/components/layout/Navbar'
import { SCENARIO_TEMPLATES } from '@/data/scenarios'

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
          className="bg-[#FDFBF8] rounded-[10px] p-6 mb-4"
          style={{
            boxShadow: '0 1px 4px rgba(26,24,20,0.06)',
            border: '1px solid #E0DAD2',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div>
                <p
                  className="text-3xl font-semibold"
                  style={{ fontFamily: 'DM Sans', color: '#6B6560' }}
                >
                  {streak}<span style={{ fontSize: '20px' }}>日</span>
                </p>
                <p className="text-xs" style={{ color: '#9E9892' }}>
                  {t('dashboard.dayStreak', uiLanguage)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-2xl font-semibold"
                style={{ color: '#1B4F8A' }}
              >
                {xpTotal.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: '#9E9892' }}>
                {t('dashboard.totalXP', uiLanguage)}
              </p>
            </div>
          </div>

          {/* Today's goal progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs" style={{ color: '#9E9892' }}>
                {t('dashboard.todayXP', uiLanguage)}
              </span>
              <span className="text-xs" style={{ color: '#9E9892' }}>
                {xpToday} / 100 XP
              </span>
            </div>
            <div className="w-full h-[2px] rounded-full overflow-hidden bg-[#E0DAD2]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, xpToday)}%`,
                  backgroundColor: '#1B4F8A',
                }}
              />
            </div>
          </div>

          {/* Continue lesson button */}
          {allDone ? (
            <div className="text-center py-4 mt-4">
              <p className="text-sm font-semibold" style={{ fontFamily: 'Shippori Mincho', color: '#1B4F8A' }}>
                {t('dashboard.curriculumComplete', uiLanguage)}
              </p>
            </div>
          ) : nextLesson ? (
            <div className="mt-4">
              <p className="text-xs mb-1" style={{ color: '#9E9892' }}>
                {t('dashboard.unit', uiLanguage)} {nextLesson.unit} · Lesson {nextLesson.order}
              </p>
              <p
                className="text-sm font-bold mb-3"
                style={{ color: '#1A1814' }}
              >
                {nextLesson.title}
              </p>
              <Link href={`/lesson/${nextLesson.id}`}>
                <button
                  className="w-full py-4 rounded-[8px] text-base font-bold text-white hover:brightness-110 active:translate-y-px transition-all"
                  style={{ backgroundColor: '#1B4F8A' }}
                >
                  {t('dashboard.startLesson', uiLanguage)} →
                </button>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Loop Hero — Jump into a conversation */}
        <div className="mb-4">
          <h2 className="mb-1" style={{ fontFamily: 'DM Sans', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9E9892' }}>
            Jump in
          </h2>
          <p className="text-xs mb-3" style={{ fontFamily: 'DM Sans', color: '#6B6560' }}>
            Try, learn, retry — the fastest way to real Japanese
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {SCENARIO_TEMPLATES.slice(0, 6).map(scenario => (
              <Link key={scenario.id} href={`/loop/${scenario.id}`}>
                <div
                  className="w-[130px] shrink-0 bg-[#FDFBF8] rounded-[10px] p-4 text-center cursor-pointer transition-all duration-150 hover:border-[#1B4F8A] active:translate-y-px"
                  style={{
                    boxShadow: '0 1px 4px rgba(26,24,20,0.06)',
                    border: '1px solid #E0DAD2',
                  }}
                >
                  <span className="text-3xl block mb-2">{scenario.emoji}</span>
                  <span
                    className="text-xs font-bold block leading-tight"
                    style={{ color: '#1A1814' }}
                  >
                    {scenario.title}
                  </span>
                  <span
                    className="text-[10px] block mt-1"
                    style={{ color: '#9E9892' }}
                  >
                    {scenario.estimatedMinutes} min
                  </span>
                </div>
              </Link>
            ))}
            <Link href="/loop/custom">
              <div
                className="w-[130px] shrink-0 bg-[#FDFBF8] rounded-[10px] p-4 text-center cursor-pointer transition-all duration-150 hover:border-[#1B4F8A] active:translate-y-px border-2 border-dashed border-[#E0DAD2]"
                style={{
                  boxShadow: '0 1px 4px rgba(26,24,20,0.06)',
                }}
              >
                <span className="text-3xl block mb-2">+</span>
                <span
                  className="text-xs font-bold block leading-tight"
                  style={{ color: '#1B4F8A' }}
                >
                  Custom
                </span>
                <span
                  className="text-[10px] block mt-1"
                  style={{ color: '#9E9892' }}
                >
                  Any situation
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#E0DAD2]" />
          <span style={{ fontFamily: 'DM Sans', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9E9892' }}>
            or study specific skills
          </span>
          <div className="flex-1 h-px bg-[#E0DAD2]" />
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1A1814' }}>
            {t('dashboard.quickActions', uiLanguage)}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/studio">
              <div className="bg-[#FDFBF8] rounded-[10px] p-5 text-center cursor-pointer transition-all duration-150 hover:border-[#1B4F8A]" style={{ boxShadow: '0 1px 4px rgba(26,24,20,0.06)', border: '1px solid #E0DAD2' }}>
                <span className="text-3xl block mb-2">🎭</span>
                <span className="text-sm font-bold" style={{ color: '#1A1814' }}>Scenario Studio</span>
              </div>
            </Link>
            <Link href="/lessons">
              <div className="bg-[#FDFBF8] rounded-[10px] p-5 text-center cursor-pointer transition-all duration-150 hover:border-[#1B4F8A]" style={{ boxShadow: '0 1px 4px rgba(26,24,20,0.06)', border: '1px solid #E0DAD2' }}>
                <span className="text-3xl block mb-2">📚</span>
                <span className="text-sm font-bold" style={{ color: '#1A1814' }}>All Lessons</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div
          className="bg-[#FDFBF8] rounded-[10px] p-6 mb-4"
          style={{
            boxShadow: '0 1px 4px rgba(26,24,20,0.06)',
            border: '1px solid #E0DAD2',
          }}
        >
          <h2
            className="text-lg font-semibold mb-3"
            style={{ color: '#1A1814' }}
          >
            {t('dashboard.yourProgress', uiLanguage)}
          </h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: '#6B6560' }}>
              {t('dashboard.lessonsCompleted', uiLanguage)}
            </span>
            <span className="text-sm font-bold" style={{ color: '#1B4F8A' }}>
              {completedCount}/{totalLessons}
            </span>
          </div>
          <div className="w-full h-[2px] rounded-full overflow-hidden bg-[#E0DAD2]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${lessonProgress * 100}%`,
                backgroundColor: '#1B4F8A',
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
