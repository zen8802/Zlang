'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Lesson {
  id: string
  title: string
  title_jp: string
  description: string
  jlpt_level: string
  unit: number
  order: number
  estimated_minutes: number
  blocks: Record<string, unknown>[]
  total_xp: number
  tags: string[]
  is_published: boolean
}

const BLOCK_ICONS: Record<string, string> = {
  flashcard: '\uD83C\uDCB4',
  sentence: '\u6587',
  quiz: '\u2753',
  fill_blank: '\u270F\uFE0F',
  matching: '\uD83C\uDFAF',
  culture_note: '\uD83C\uDFEF',
  shadowing: '\uD83C\uDF64',
  video: '\u25B6\uFE0F',
}

type Filter = 'all' | 'published' | 'draft'

export default function AdminLessonsPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(data => setLessons(data.lessons || []))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = lessons.filter(l => {
    if (filter === 'published') return l.is_published
    if (filter === 'draft') return !l.is_published
    return true
  })

  const handleNew = async () => {
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Lesson', blocks: [] }),
    })
    const data = await res.json()
    if (data.lesson?.id) {
      router.push(`/admin/lessons/${data.lesson.id}`)
    }
  }

  const jlptColor = (level: string) => {
    const map: Record<string, 'green' | 'blue' | 'gold' | 'red' | 'purple'> = {
      N5: 'green', N4: 'blue', N3: 'gold', N2: 'red', N1: 'purple',
    }
    return map[level] || 'gray'
  }

  const blockTypeSummary = (blocks: Record<string, unknown>[]) => {
    if (!blocks || !blocks.length) return ''
    const types = blocks.map(b => BLOCK_ICONS[b.type as string] || '?')
    return types.join(' ')
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B4F8A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Lesson Editor
          </h1>
          <Button variant="primary" size="sm" onClick={handleNew}>
            + New Lesson
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'published', 'draft'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-full text-sm font-bold transition-all capitalize
                ${filter === f
                  ? 'bg-[#1B4F8A] text-white shadow-[0_3px_0_#133970]'
                  : 'bg-white text-[#6B7280] border border-gray-200 hover:bg-gray-50'}
              `}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {f} {f === 'all' ? `(${lessons.length})` : f === 'published' ? `(${lessons.filter(l => l.is_published).length})` : `(${lessons.filter(l => !l.is_published).length})`}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-[#6B7280]" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Loading lessons...
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <Card variant="flat" className="text-center py-12">
            <p className="text-[#6B7280] text-lg mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              No lessons yet
            </p>
            <Button variant="primary" size="sm" onClick={handleNew}>
              Create your first lesson
            </Button>
          </Card>
        )}

        {/* Lesson list */}
        <div className="flex flex-col gap-3">
          {filtered.map(lesson => (
            <Card
              key={lesson.id}
              variant="elevated"
              onClick={() => router.push(`/admin/lessons/${lesson.id}`)}
              padding="md"
            >
              <div className="flex items-start gap-4">
                {/* Order number */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-[#EBF0F8] text-[#1B4F8A] flex items-center justify-center font-bold text-lg"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {lesson.order}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-bold text-[#1B1B1B] truncate"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      {lesson.title}
                    </h3>
                    {lesson.title_jp && (
                      <span
                        className="text-sm text-[#6B7280] truncate"
                        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                      >
                        {lesson.title_jp}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge color={jlptColor(lesson.jlpt_level)} size="sm">
                      {lesson.jlpt_level}
                    </Badge>
                    <Badge color={lesson.is_published ? 'green' : 'gray'} size="sm">
                      {lesson.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    {lesson.blocks && lesson.blocks.length > 0 && (
                      <span className="text-xs text-[#6B7280]">
                        {lesson.blocks.length} blocks {blockTypeSummary(lesson.blocks)}
                      </span>
                    )}
                    <span className="text-xs text-[#6B7280]">
                      Unit {lesson.unit}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-[#B8CBE0] text-xl">
                  &rsaquo;
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
