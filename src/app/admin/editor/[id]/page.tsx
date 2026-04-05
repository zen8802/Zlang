'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import EditorLayout from '@/components/editor/EditorLayout'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySlide = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLesson = any

export default function EditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<AnyLesson>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => { loadLesson() }, [id])

  useEffect(() => {
    if (!lesson) return
    const timer = setInterval(() => { save() }, 30000)
    return () => clearInterval(timer)
  }, [lesson])

  const loadLesson = async () => {
    const res = await fetch(`/api/admin/lessons/${id}`)
    const data = await res.json()
    const l = data.lesson
    if (!l) return
    if (!l.slides) {
      l.slides = l.blocks?.length > 0
        ? [{ id: 'slide_1', title: 'Slide 1', blocks: l.blocks }]
        : [{ id: 'slide_1', title: 'Slide 1', blocks: [] }]
    }
    setLesson(l)
  }

  const save = useCallback(async () => {
    if (!lesson) return
    setSaving(true)
    await fetch(`/api/admin/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lesson,
        blocks: lesson.slides?.flatMap((s: AnySlide) => s.blocks) || [],
      }),
    })
    setSaving(false)
    setSavedAt(new Date())
  }, [lesson, id])

  const addSlide = () => {
    const newSlide: AnySlide = {
      id: `slide_${Date.now()}`,
      title: `Slide ${(lesson.slides?.length || 0) + 1}`,
      blocks: [],
    }
    setLesson((l: AnyLesson) => ({ ...l, slides: [...(l.slides || []), newSlide] }))
    setActiveSlideIndex(lesson.slides?.length || 0)
  }

  const deleteSlide = (index: number) => {
    if (lesson.slides.length <= 1) return
    setLesson((l: AnyLesson) => ({
      ...l,
      slides: l.slides.filter((_: AnySlide, i: number) => i !== index),
    }))
    setActiveSlideIndex(Math.max(0, index - 1))
  }

  const updateSlide = (index: number, updated: AnySlide) => {
    setLesson((l: AnyLesson) => ({
      ...l,
      slides: l.slides.map((s: AnySlide, i: number) => (i === index ? updated : s)),
    }))
  }

  const addBlockToSlide = (template: AnyBlock) => {
    const newBlock = {
      ...template,
      id: `block_${Date.now()}`,
      order: lesson.slides[activeSlideIndex]?.blocks?.length || 0,
    }
    updateSlide(activeSlideIndex, {
      ...lesson.slides[activeSlideIndex],
      blocks: [...(lesson.slides[activeSlideIndex]?.blocks || []), newBlock],
    })
    setSelectedBlockId(newBlock.id)
  }

  const updateBlock = (blockId: string, updated: AnyBlock) => {
    const slide = lesson.slides[activeSlideIndex]
    updateSlide(activeSlideIndex, {
      ...slide,
      blocks: slide.blocks.map((b: AnyBlock) => (b.id === blockId ? updated : b)),
    })
  }

  const deleteBlock = (blockId: string) => {
    const slide = lesson.slides[activeSlideIndex]
    updateSlide(activeSlideIndex, {
      ...slide,
      blocks: slide.blocks.filter((b: AnyBlock) => b.id !== blockId),
    })
    setSelectedBlockId(null)
  }

  const reorderBlocks = (newBlocks: AnyBlock[]) => {
    updateSlide(activeSlideIndex, {
      ...lesson.slides[activeSlideIndex],
      blocks: newBlocks.map((b: AnyBlock, i: number) => ({ ...b, order: i })),
    })
  }

  if (!lesson) {
    return (
      <div className="fixed inset-0 bg-[#F5F0EB] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4" style={{ fontFamily: 'Noto Sans JP' }}>学</div>
          <p className="text-gray-400 font-bold">Loading editor...</p>
        </div>
      </div>
    )
  }

  const activeSlide = lesson.slides?.[activeSlideIndex]
  const selectedBlock = activeSlide?.blocks?.find((b: AnyBlock) => b.id === selectedBlockId)

  return (
    <EditorLayout
      lesson={lesson}
      activeSlide={activeSlide}
      activeSlideIndex={activeSlideIndex}
      selectedBlock={selectedBlock}
      saving={saving}
      savedAt={savedAt}
      onSave={save}
      onBack={() => router.push('/admin/lessons')}
      onAddBlock={addBlockToSlide}
      onUpdateBlock={updateBlock}
      onDeleteBlock={deleteBlock}
      onReorderBlocks={reorderBlocks}
      onSelectBlock={setSelectedBlockId}
      onAddSlide={addSlide}
      onDeleteSlide={deleteSlide}
      onSelectSlide={setActiveSlideIndex}
      onUpdateLesson={setLesson}
    />
  )
}
