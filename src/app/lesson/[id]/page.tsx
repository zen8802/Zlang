'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import LessonRunner from '@/components/lesson/LessonRunner'

export default function LessonPage() {
  const { id } = useParams()
  const router = useRouter()
  const addXP = useAppStore((s) => s.addXP)
  const completeLesson = useAppStore((s) => s.completeLesson)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/lessons/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Lesson not found')
        return r.json()
      })
      .then(data => {
        if (!data.lesson) throw new Error('Lesson not found')
        const l = data.lesson
        // Map DB fields to LessonRunner expected shape
        setLesson({
          id: l.id,
          title: l.title,
          titleJP: l.title_jp || '',
          description: l.description || '',
          jlptLevel: l.jlpt_level || 'N5',
          unit: l.unit || 1,
          order: l.order || 1,
          estimatedMinutes: l.estimated_minutes || 10,
          targetLanguage: l.target_language || 'japanese',
          blocks: l.blocks || [],
          totalXP: l.total_xp || 0,
          tags: l.tags || [],
          isPublished: l.is_published ?? true,
          createdAt: l.created_at || '',
          updatedAt: l.updated_at || '',
        })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0EB' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B4F8A]/20 border-t-[#1B4F8A] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold" style={{ color: '#6B6560' }}>Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0EB' }}>
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-3">😵</p>
          <p className="font-bold mb-2" style={{ color: '#1A1814' }}>Lesson not found</p>
          <p className="text-sm mb-4" style={{ color: '#6B6560' }}>{error}</p>
          <button onClick={() => router.push('/lessons')} className="text-sm font-bold underline" style={{ color: '#1B4F8A' }}>
            Back to lessons
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0EB' }}>
      <LessonRunner
        lesson={lesson}
        onLessonComplete={(totalXP) => {
          addXP(totalXP)
          completeLesson(lesson.id)
          router.push('/dashboard')
        }}
      />
    </div>
  )
}
