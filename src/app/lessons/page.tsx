'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import Navbar from '@/components/layout/Navbar'
import Badge from '@/components/ui/Badge'

interface DbLesson {
  id: string
  title: string
  title_jp: string
  description: string
  jlpt_level: string
  unit: number
  order: number
  estimated_minutes: number
  total_xp: number
  is_published: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[]
}

export default function LessonsPage() {
  const router = useRouter()
  const corridor = useAppStore((s) => s.corridor)
  const lessonsCompleted = useAppStore((s) => s.lessonsCompleted)
  const [lessons, setLessons] = useState<DbLesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!corridor) { router.replace('/'); return }
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(data => {
        const all = (data.lessons || []) as DbLesson[]
        setLessons(all.filter(l => l.is_published).sort((a, b) => a.unit - b.unit || a.order - b.order))
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false))
  }, [corridor, router])

  if (!corridor) return null

  // Group by unit
  const units: Record<number, DbLesson[]> = {}
  lessons.forEach(l => {
    const u = l.unit || 1
    if (!units[u]) units[u] = []
    units[u].push(l)
  })

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-black mb-6" style={{ fontFamily: 'Nunito', color: '#1B4F8A' }}>Lessons</h1>

        {loading && <p className="text-center text-gray-400 py-12">Loading...</p>}

        {!loading && lessons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-400 font-bold" style={{ fontFamily: 'Nunito' }}>No lessons available yet</p>
          </div>
        )}

        {Object.entries(units).sort(([a], [b]) => Number(a) - Number(b)).map(([unit, unitLessons]) => (
          <div key={unit} className="mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest mb-3 px-1" style={{ color: '#9CA3AF', fontFamily: 'Nunito' }}>
              Unit {unit}
            </h2>
            <div className="space-y-2">
              {unitLessons.map((lesson) => {
                const done = lessonsCompleted.includes(lesson.id)
                return (
                  <button
                    key={lesson.id}
                    onClick={() => router.push(`/lesson/${lesson.id}`)}
                    className="w-full bg-white rounded-[16px] p-4 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5 active:translate-y-[2px]"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 4px 0 rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                      done ? 'bg-[#58CC02] text-white' : 'bg-[#EBF0F8] text-[#1B4F8A]'
                    }`}>
                      {done ? '✓' : lesson.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ fontFamily: 'Nunito', color: '#1A1A2E' }}>{lesson.title}</p>
                      <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{lesson.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge color="blue" size="sm">{lesson.jlpt_level}</Badge>
                      <span className="text-xs text-gray-300">{lesson.estimated_minutes}m</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
