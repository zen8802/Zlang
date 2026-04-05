'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Lesson {
  id: string
  title: string
  jlpt_level: string
  unit: number
  order: number
  target_language: string
  blocks: Record<string, unknown>[]
  is_published: boolean
}

const BLOCK_ICONS: Record<string, string> = {
  flashcard: '🎴', sentence: '文', quiz: '❓', fill_blank: '✏️',
  matching: '🎯', culture_note: '🏯', shadowing: '🎤', video: '▶️',
  word_bank: '🧩', dialogue: '💬', true_false: '⚖️',
}

type Filter = 'all' | 'published' | 'draft'

export default function JpEnLessonsPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(data => {
        const all = (data.lessons || []) as Lesson[]
        setLessons(all.filter(l => l.target_language === 'english'))
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = lessons.filter(l => {
    if (filter === 'published') return l.is_published
    if (filter === 'draft') return !l.is_published
    return true
  })

  const units: Record<number, Lesson[]> = {}
  filtered.forEach(l => {
    const u = l.unit || 1
    if (!units[u]) units[u] = []
    units[u].push(l)
  })
  Object.values(units).forEach(arr => arr.sort((a, b) => (a.order || 0) - (b.order || 0)))

  const handleNew = async () => {
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Lesson',
        titleJP: '',
        targetLanguage: 'english',
        jlptLevel: 'N5',
        unit: 1,
        order: lessons.length + 1,
        blocks: [],
      }),
    })
    const data = await res.json()
    if (data.lesson?.id) router.push(`/admin/editor/${data.lesson.id}`)
  }

  const jlptColor = (level: string): 'green' | 'blue' | 'gold' | 'red' | 'purple' | 'gray' => {
    const map: Record<string, 'green' | 'blue' | 'gold' | 'red' | 'purple'> = { N5: 'green', N4: 'blue', N3: 'gold', N2: 'red', N1: 'purple' }
    return map[level] || 'gray'
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.push('/admin/lessons')} className="text-[#6B7280] hover:text-[#1A1A2E] text-sm font-bold transition-colors">← Back</button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1B4F8A]" style={{ fontFamily: 'Nunito' }}>
              🇯🇵→🇺🇸 Japanese → English
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{lessons.length} lessons</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleNew}>+ New Lesson</Button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'published', 'draft'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all capitalize ${
                filter === f ? 'bg-[#1B4F8A] text-white shadow-[0_3px_0_#133970]' : 'bg-white text-[#6B7280] border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-[#6B7280]">Loading...</div>}

        {!loading && filtered.length === 0 && (
          <Card variant="flat" className="text-center py-12">
            <p className="text-[#6B7280] text-lg mb-4">No lessons yet</p>
            <Button variant="primary" size="sm" onClick={handleNew}>Create your first lesson</Button>
          </Card>
        )}

        {Object.entries(units).sort(([a], [b]) => Number(a) - Number(b)).map(([unit, unitLessons]) => (
          <div key={unit} className="mb-6">
            <h2 className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest mb-3 px-1">Unit {unit}</h2>
            <div className="flex flex-col gap-2">
              {unitLessons.map(lesson => (
                <Card key={lesson.id} variant="elevated" onClick={() => router.push(`/admin/editor/${lesson.id}`)} padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-[#EBF0F8] text-[#1B4F8A] flex items-center justify-center font-black text-sm shrink-0">{lesson.order}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1A1A2E] truncate" style={{ fontFamily: 'Nunito' }}>{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge color={jlptColor(lesson.jlpt_level)} size="sm">{lesson.jlpt_level}</Badge>
                        <Badge color={lesson.is_published ? 'green' : 'gray'} size="sm">{lesson.is_published ? 'Live' : 'Draft'}</Badge>
                        {lesson.blocks?.length > 0 && (
                          <span className="text-xs text-[#9CA3AF]">{lesson.blocks.length} blocks {lesson.blocks.slice(0, 5).map(b => BLOCK_ICONS[b.type as string] || '').join('')}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[#B8CBE0] text-lg shrink-0">›</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
