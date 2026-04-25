'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import Button from '@/components/ui/Button'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LessonData = any

export default function RetakePage() {
  const params = useParams()
  const router = useRouter()
  const savedLessonId = params.savedLessonId as string

  const [lesson, setLesson] = useState<LessonData>(null)
  const [loading, setLoading] = useState(true)
  const [currentBlock, setCurrentBlock] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!savedLessonId) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/saved-lessons/${savedLessonId}`)
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (!cancelled) {
          setLesson(data.lesson ?? data)
          setLoading(false)
        }

        // Increment retaken count
        await fetch(`/api/saved-lessons/${savedLessonId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incrementRetaken: true }),
        })
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [savedLessonId])

  const blocks = lesson?.learn_blocks ?? []

  const handleBlockComplete = () => {
    if (currentBlock < blocks.length - 1) {
      setCurrentBlock(prev => prev + 1)
    } else {
      setDone(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF8' }}>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#1B4F8A', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!lesson || blocks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: '#FDFBF8' }}>
        <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          No lesson blocks found.
        </p>
        <Button variant="secondary" onClick={() => router.push('/saved-lessons')}>
          Back to saved lessons
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: '#FDFBF8' }}>
        <p
          className="text-2xl font-bold text-[#1A1814]"
          style={{ fontFamily: 'Shippori Mincho, serif' }}
        >
          復習完了
        </p>
        <p className="text-sm text-[#6B6560]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Lesson reviewed
        </p>
        <Button onClick={() => router.push('/saved-lessons')}>Back to saved lessons</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFBF8' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: '#E0DAD2' }}>
        <button
          onClick={() => router.push('/saved-lessons')}
          className="text-sm text-[#6B6560] hover:text-[#1A1814]"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          ← Back
        </button>
        <div className="flex-1">
          <div className="w-full bg-[#E0DAD2] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentBlock + 1) / blocks.length) * 100}%`,
                backgroundColor: '#1B4F8A',
              }}
            />
          </div>
        </div>
        <span className="text-xs text-[#9E9892] shrink-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {currentBlock + 1}/{blocks.length}
        </span>
      </div>

      {/* Block renderer */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <BlockRenderer
          block={blocks[currentBlock]}
          onComplete={handleBlockComplete}
        />
      </div>
    </div>
  )
}
