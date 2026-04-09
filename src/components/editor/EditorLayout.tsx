'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BlockPalette from './BlockPalette'
import SlideCanvas from './SlideCanvas'
import SlideStrip from './SlideStrip'
import BlockInspector from './BlockInspector'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySlide = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLesson = any

interface EditorLayoutProps {
  lesson: AnyLesson
  activeSlide: AnySlide
  activeSlideIndex: number
  selectedBlock: AnyBlock | null
  saving: boolean
  savedAt: Date | null
  onSave: () => void
  onBack: () => void
  onAddBlock: (template: AnyBlock) => void
  onUpdateBlock: (blockId: string, updated: AnyBlock) => void
  onDeleteBlock: (blockId: string) => void
  onReorderBlocks: (newBlocks: AnyBlock[]) => void
  onSelectBlock: (blockId: string | null) => void
  onAddSlide: () => void
  onDeleteSlide: (index: number) => void
  onSelectSlide: (index: number) => void
  onUpdateLesson: (updater: (l: AnyLesson) => AnyLesson) => void
}

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1']

export default function EditorLayout({
  lesson,
  activeSlide,
  activeSlideIndex,
  selectedBlock,
  saving,
  savedAt,
  onSave,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBack,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  onSelectBlock,
  onAddSlide,
  onDeleteSlide,
  onSelectSlide,
  onUpdateLesson,
}: EditorLayoutProps) {
  const router = useRouter()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(lesson.title || '')
  const [showLessonDropdown, setShowLessonDropdown] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allLessons, setAllLessons] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load lessons for the dropdown — filtered to same corridor
  const corridor = lesson.target_language || lesson.targetLanguage || 'japanese'
  useEffect(() => {
    fetch('/api/admin/lessons')
      .then(r => r.json())
      .then(d => {
        const all = d.lessons || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAllLessons(all.filter((l: any) => (l.target_language || 'japanese') === corridor))
      })
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!showLessonDropdown) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLessonDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showLessonDropdown])

  const handleTitleSubmit = () => {
    setEditingTitle(false)
    onUpdateLesson((l: AnyLesson) => ({ ...l, title: titleValue }))
  }

  const handleJlptChange = (level: string) => {
    onUpdateLesson((l: AnyLesson) => ({ ...l, jlptLevel: level, jlpt_level: level }))
  }

  const handlePublishToggle = () => {
    onUpdateLesson((l: AnyLesson) => ({ ...l, published: !l.published, is_published: !l.is_published }))
  }

  const handleUnitChange = (unit: number) => {
    onUpdateLesson((l: AnyLesson) => ({ ...l, unit }))
  }

  const handleOrderChange = (order: number) => {
    onUpdateLesson((l: AnyLesson) => ({ ...l, order }))
  }

  // Group lessons by unit for dropdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessonsByUnit: Record<number, any[]> = {}
  allLessons.forEach(l => {
    const u = l.unit || 1
    if (!lessonsByUnit[u]) lessonsByUnit[u] = []
    lessonsByUnit[u].push(l)
  })
  Object.values(lessonsByUnit).forEach(arr => arr.sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0)))

  return (
    <div className="fixed inset-0 bg-[#1A1A2E] flex flex-col text-white">
      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 flex items-center px-4 gap-3 bg-[#12122A] shrink-0">
        <button
          onClick={() => {
            const lang = lesson.target_language || lesson.targetLanguage || 'japanese'
            router.push(lang === 'japanese' ? '/admin/lessons/enjp' : '/admin/lessons/jpen')
          }}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">{corridor === 'japanese' ? '🇺🇸→🇯🇵' : '🇯🇵→🇺🇸'}</span>
        </button>

        <div className="w-px h-6 bg-white/10" />

        {/* Unit + Order */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">U</span>
          <input
            type="number"
            value={lesson.unit || 1}
            onChange={e => handleUnitChange(parseInt(e.target.value) || 1)}
            className="w-10 bg-white/10 text-white text-xs font-bold rounded px-1.5 py-1 border border-white/10 focus:outline-none focus:border-[#1B4F8A] text-center"
            min={1}
          />
          <span className="text-xs text-gray-500">L</span>
          <input
            type="number"
            value={lesson.order || 1}
            onChange={e => handleOrderChange(parseInt(e.target.value) || 1)}
            className="w-10 bg-white/10 text-white text-xs font-bold rounded px-1.5 py-1 border border-white/10 focus:outline-none focus:border-[#1B4F8A] text-center"
            min={1}
          />
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* Inline title edit + lesson dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-1">
            {editingTitle ? (
              <input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="bg-white/10 border border-[#1B4F8A] rounded px-2 py-1 text-sm font-semibold outline-none w-64"
              />
            ) : (
              <button
                onClick={() => { setTitleValue(lesson.title || ''); setEditingTitle(true) }}
                className="text-sm font-semibold hover:text-[#93b4d4] transition-colors truncate max-w-[250px]"
              >
                {lesson.title || 'Untitled Lesson'}
              </button>
            )}

            {/* Dropdown toggle */}
            <button
              onClick={() => setShowLessonDropdown(p => !p)}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Lesson dropdown */}
          {showLessonDropdown && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-[#1A1A2E] border border-white/10 rounded-[6px] shadow-2xl z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                {Object.entries(lessonsByUnit)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([unit, lessons]) => (
                  <div key={unit} className="mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-1">
                      Unit {unit}
                    </p>
                    {lessons.map((l: { id: string; order?: number; title?: string; title_jp?: string; jlpt_level?: string; is_published?: boolean; blocks?: unknown[] }) => {
                      const isCurrent = l.id === lesson.id
                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            setShowLessonDropdown(false)
                            if (!isCurrent) router.push(`/admin/editor/${l.id}`)
                          }}
                          className={`w-full text-left px-2 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                            isCurrent
                              ? 'bg-[#1B4F8A]/20 text-white'
                              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                            isCurrent ? 'bg-[#1B4F8A] text-white' : 'bg-white/10 text-gray-500'
                          }`}>
                            {l.order || '?'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{l.title || 'Untitled'}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                              {l.jlpt_level || '?'}
                            </span>
                            {l.is_published && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
                {allLessons.length === 0 && (
                  <p className="text-gray-600 text-xs text-center py-4">No lessons found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* JLPT Selector */}
        <div className="flex items-center gap-1 ml-2">
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => handleJlptChange(level)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                (lesson.jlptLevel || lesson.jlpt_level) === level
                  ? 'bg-[#1B4F8A] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Publish toggle */}
        <button
          onClick={handlePublishToggle}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            lesson.published || lesson.is_published
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          {lesson.published || lesson.is_published ? '● Live' : '○ Draft'}
        </button>

        {/* Save status */}
        <span className="text-xs text-gray-500">
          {saving
            ? 'Saving...'
            : savedAt
              ? `Saved ${savedAt.toLocaleTimeString()}`
              : ''}
        </span>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-[#1B4F8A] hover:bg-[#133970] disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg font-bold transition-colors active:translate-y-px"
        >
          Save
        </button>

        {/* Preview button */}
        <a
          href={`/lesson/${lesson.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 hover:bg-white/10 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors border border-white/10"
        >
          Preview ↗
        </a>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Block Palette */}
        <div className="w-56 border-r border-white/10 bg-[#12122A] overflow-y-auto shrink-0">
          <BlockPalette onAddBlock={onAddBlock} />
        </div>

        {/* Center - Canvas + Slide Strip */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <SlideCanvas
              slide={activeSlide}
              selectedBlockId={selectedBlock?.id || null}
              onSelectBlock={onSelectBlock}
              onReorderBlocks={onReorderBlocks}
              onDeleteBlock={onDeleteBlock}
            />
          </div>
          <div className="border-t border-white/10 bg-[#12122A]">
            <SlideStrip
              slides={lesson.slides || []}
              activeIndex={activeSlideIndex}
              onSelectSlide={onSelectSlide}
              onAddSlide={onAddSlide}
              onDeleteSlide={onDeleteSlide}
            />
          </div>
        </div>

        {/* Right Panel - Block Inspector */}
        <div className="w-72 border-l border-white/10 bg-[#12122A] overflow-y-auto shrink-0">
          <BlockInspector
            block={selectedBlock}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
          />
        </div>
      </div>
    </div>
  )
}
