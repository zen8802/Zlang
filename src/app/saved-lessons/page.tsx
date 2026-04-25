'use client'

import { useState, useEffect } from 'react'
import SavedLessonRow from '@/components/saved-lessons/SavedLessonRow'

interface SavedLesson {
  id: string
  scenario_title: string
  created_at: string
  vocab_count: number
  kana_count: number
  best_exam_score: number | null
}

export default function SavedLessonsPage() {
  const [lessons, setLessons] = useState<SavedLesson[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLessons = () => {
    fetch('/api/saved-lessons')
      .then((r) => r.json())
      .then((data) => {
        setLessons(data.lessons || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchLessons()
  }, [])

  const handleDelete = (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-[#1A1814]"
            style={{ fontFamily: 'Shippori Mincho, serif' }}
          >
            保存したレッスン
          </h1>
          {!loading && lessons.length > 0 && (
            <p
              className="text-xs text-[#9E9892] mt-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {lessons.length} saved lesson{lessons.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center">
          <p
            className="text-sm text-[#9E9892]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Loading…
          </p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p
            className="text-lg font-semibold text-[#1A1814] mb-1"
            style={{ fontFamily: 'Shippori Mincho, serif' }}
          >
            No saved lessons yet
          </p>
          <p
            className="text-sm text-[#9E9892]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Complete a conversation to generate a lesson, then save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <SavedLessonRow
              key={lesson.id}
              lesson={lesson}
              onDelete={() => handleDelete(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
