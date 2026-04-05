'use client'

import { useState } from 'react'
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
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(lesson.title || '')

  const handleTitleSubmit = () => {
    setEditingTitle(false)
    onUpdateLesson((l: AnyLesson) => ({ ...l, title: titleValue }))
  }

  const handleJlptChange = (level: string) => {
    onUpdateLesson((l: AnyLesson) => ({ ...l, jlptLevel: level }))
  }

  const handlePublishToggle = () => {
    onUpdateLesson((l: AnyLesson) => ({ ...l, published: !l.published }))
  }

  return (
    <div className="fixed inset-0 bg-[#1A1A2E] flex flex-col text-white">
      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 flex items-center px-4 gap-3 bg-[#12122A] shrink-0">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <div className="w-px h-6 bg-white/10" />

        {/* Inline title edit */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="bg-white/10 border border-blue-500 rounded px-2 py-1 text-sm font-semibold outline-none w-64"
          />
        ) : (
          <button
            onClick={() => { setTitleValue(lesson.title || ''); setEditingTitle(true) }}
            className="text-sm font-semibold hover:text-blue-400 transition-colors truncate max-w-[300px]"
          >
            {lesson.title || 'Untitled Lesson'}
          </button>
        )}

        {/* JLPT Selector */}
        <div className="flex items-center gap-1 ml-2">
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => handleJlptChange(level)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                lesson.jlptLevel === level
                  ? 'bg-blue-600 text-white'
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
            lesson.published
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          {lesson.published ? 'Published' : 'Draft'}
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
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {/* Preview button */}
        <a
          href={`/lessons/${lesson._id || lesson.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 hover:bg-white/10 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors border border-white/10"
        >
          Preview
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
