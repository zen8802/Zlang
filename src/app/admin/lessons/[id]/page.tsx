'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

/* ────────────────────────────────────────────
   Block templates
   ──────────────────────────────────────────── */

const BLOCK_TEMPLATES: Record<string, Record<string, unknown>> = {
  flashcard: {
    type: 'flashcard',
    title: 'Vocabulary',
    xpReward: 10,
    cards: [
      { word: '食べる', reading: 'たべる', romaji: 'taberu', english: 'to eat', partOfSpeech: 'verb', jlptLevel: 'N5', exampleJP: '寿司を食べる', exampleEN: 'eat sushi', memoryHook: '' },
    ],
  },
  sentence: {
    type: 'sentence',
    title: 'Key Sentences',
    xpReward: 15,
    sentences: [
      { id: 's1', japanese: '今日はいい天気ですね。', romaji: 'kyou wa ii tenki desu ne.', english: 'Nice weather today, isn\'t it?', keywords: [], emotionTag: 'casual' },
    ],
  },
  quiz: {
    type: 'quiz',
    title: 'Quick Check',
    xpReward: 20,
    instruction: 'Choose the correct answer',
    passingScore: 60,
    questions: [
      { id: 'q1', type: 'multiple_choice', question: 'What does 食べる mean?', options: [{ id: 'a', text: 'to eat', isCorrect: true }, { id: 'b', text: 'to drink', isCorrect: false }, { id: 'c', text: 'to sleep', isCorrect: false }], explanation: '食べる (taberu) means to eat' },
    ],
  },
  fill_blank: {
    type: 'fill_blank',
    title: 'Fill in the Blank',
    xpReward: 15,
    instruction: 'Complete the sentence',
    sentences: [
      { id: 'fb1', before: '私は日本語を', answer: '勉強', after: 'しています。', explanation: '勉強 (benkyou) means study' },
    ],
  },
  matching: {
    type: 'matching',
    title: 'Match the Pairs',
    xpReward: 10,
    instruction: 'Match Japanese to English',
    pairs: [
      { id: 'p1', left: '犬', right: 'dog', leftReading: 'いぬ' },
      { id: 'p2', left: '猫', right: 'cat', leftReading: 'ねこ' },
    ],
  },
  culture_note: {
    type: 'culture_note',
    emoji: '\uD83C\uDFEF',
    headline: 'Cultural Insight',
    body: 'Write your cultural note here...',
    neverInTextbook: 'The surprising thing that textbooks never mention...',
    xpReward: 5,
  },
  shadowing: {
    type: 'shadowing',
    title: 'Shadow Practice',
    targetSentence: 'おはようございます',
    targetReading: 'おはようございます',
    targetRomaji: 'ohayou gozaimasu',
    targetEnglish: 'Good morning',
    whyThisSentence: 'The most common morning greeting',
    breakdown: [{ chunk: 'おはよう', tip: 'stress the HAH' }, { chunk: 'ございます', tip: 'go-ZAI-mass' }],
    emotionContext: 'polite morning greeting',
    xpReward: 15,
  },
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

const BLOCK_TYPES = Object.keys(BLOCK_TEMPLATES)

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1']

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface LessonData {
  id: string
  title: string
  title_jp: string
  description: string
  jlpt_level: string
  unit: number
  order: number
  estimated_minutes: number
  target_language: string
  blocks: Record<string, unknown>[]
  total_xp: number
  tags: string[]
  is_published: boolean
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export default function LessonEditorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [metaOpen, setMetaOpen] = useState(true)
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null)
  const [blockErrors, setBlockErrors] = useState<Record<number, string>>({})
  const [addingType, setAddingType] = useState<string | null>(null)

  /* Load lesson */
  useEffect(() => {
    fetch(`/api/admin/lessons/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.lesson) {
          const l = data.lesson
          // Parse blocks if they come as a string
          if (typeof l.blocks === 'string') l.blocks = JSON.parse(l.blocks)
          setLesson(l)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  /* Field updater */
  const set = useCallback((field: keyof LessonData, value: LessonData[keyof LessonData]) => {
    setLesson(prev => prev ? { ...prev, [field]: value } : prev)
  }, [])

  /* Save */
  const handleSave = async () => {
    if (!lesson) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lesson.title,
          titleJP: lesson.title_jp,
          description: lesson.description,
          jlptLevel: lesson.jlpt_level,
          unit: lesson.unit,
          order: lesson.order,
          estimatedMinutes: lesson.estimated_minutes,
          targetLanguage: lesson.target_language,
          blocks: lesson.blocks,
          totalXP: lesson.total_xp,
          tags: lesson.tags,
          isPublished: lesson.is_published,
        }),
      })
      if (res.ok) {
        setSaveMsg('Saved!')
        setTimeout(() => setSaveMsg(''), 2000)
      } else {
        setSaveMsg('Error saving')
      }
    } catch {
      setSaveMsg('Error saving')
    } finally {
      setSaving(false)
    }
  }

  /* Block operations */
  const addBlock = (type: string) => {
    if (!lesson) return
    const template = JSON.parse(JSON.stringify(BLOCK_TEMPLATES[type]))
    const newBlocks = [...lesson.blocks, template]
    set('blocks', newBlocks)
    setExpandedBlock(newBlocks.length - 1)
    setAddingType(null)
  }

  const deleteBlock = (index: number) => {
    if (!lesson) return
    const newBlocks = lesson.blocks.filter((_, i) => i !== index)
    set('blocks', newBlocks)
    if (expandedBlock === index) setExpandedBlock(null)
    else if (expandedBlock !== null && expandedBlock > index) setExpandedBlock(expandedBlock - 1)
    const newErrors = { ...blockErrors }
    delete newErrors[index]
    setBlockErrors(newErrors)
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (!lesson) return
    const target = index + direction
    if (target < 0 || target >= lesson.blocks.length) return
    const newBlocks = [...lesson.blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[target]
    newBlocks[target] = temp
    set('blocks', newBlocks)
    if (expandedBlock === index) setExpandedBlock(target)
    else if (expandedBlock === target) setExpandedBlock(index)
  }

  const updateBlockFromJSON = (index: number, jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr)
      const newBlocks = [...(lesson?.blocks || [])]
      newBlocks[index] = parsed
      set('blocks', newBlocks)
      const newErrors = { ...blockErrors }
      delete newErrors[index]
      setBlockErrors(newErrors)
    } catch {
      setBlockErrors(prev => ({ ...prev, [index]: 'Invalid JSON' }))
    }
  }

  /* Computed total XP */
  const totalXP = lesson?.blocks?.reduce((sum: number, b: Record<string, unknown>) => sum + ((b.xpReward as number) || 0), 0) || 0

  /* Loading / error */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center">
        <p className="text-[#6B7280]" style={{ fontFamily: 'Nunito, sans-serif' }}>Loading...</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] flex flex-col items-center justify-center gap-4">
        <p className="text-[#6B7280]" style={{ fontFamily: 'Nunito, sans-serif' }}>Lesson not found</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/admin/lessons')}>
          Back to lessons
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/lessons')}
            className="text-[#1B4F8A] font-bold text-lg hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            &larr;
          </button>

          <input
            type="text"
            value={lesson.title}
            onChange={e => set('title', e.target.value)}
            className="flex-1 text-lg font-bold text-[#1B1B1B] bg-transparent border-none outline-none focus:ring-0"
            style={{ fontFamily: 'Nunito, sans-serif' }}
            placeholder="Lesson title"
          />

          <div className="flex items-center gap-2">
            {/* Publish toggle */}
            <button
              onClick={() => set('is_published', !lesson.is_published)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-bold transition-all
                ${lesson.is_published
                  ? 'bg-[#58CC02] text-white'
                  : 'bg-gray-200 text-gray-500'}
              `}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {lesson.is_published ? 'Published' : 'Draft'}
            </button>

            {/* Save */}
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>

            {saveMsg && (
              <span
                className={`text-xs font-bold ${saveMsg === 'Saved!' ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* ── Metadata section ── */}
        <Card variant="default">
          <button
            onClick={() => setMetaOpen(!metaOpen)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="font-bold text-[#1B4F8A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Lesson Metadata
            </h2>
            <span className="text-[#6B7280] text-sm">{metaOpen ? '\u25B2' : '\u25BC'}</span>
          </button>

          {metaOpen && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Title</span>
                <input
                  type="text"
                  value={lesson.title}
                  onChange={e => set('title', e.target.value)}
                  className="border border-gray-200 rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8A]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                />
              </label>

              {/* Title JP */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Title JP</span>
                <input
                  type="text"
                  value={lesson.title_jp}
                  onChange={e => set('title_jp', e.target.value)}
                  className="border border-gray-200 rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8A]"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                />
              </label>

              {/* Description */}
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Description</span>
                <textarea
                  value={lesson.description}
                  onChange={e => set('description', e.target.value)}
                  rows={2}
                  className="border border-gray-200 rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8A] resize-none"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                />
              </label>

              {/* JLPT Level */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>JLPT Level</span>
                <select
                  value={lesson.jlpt_level}
                  onChange={e => set('jlpt_level', e.target.value)}
                  className="border border-gray-200 rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8A] bg-white"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {JLPT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>

              {/* Unit */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Unit</span>
                <input
                  type="number"
                  value={lesson.unit}
                  onChange={e => set('unit', parseInt(e.target.value) || 1)}
                  className="border border-gray-200 rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8A]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                />
              </label>

              {/* Order */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Order</span>
                <input
                  type="number"
                  value={lesson.order}
                  onChange={e => set('order', parseInt(e.target.value) || 0)}
                  className="border border-gray-200 rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8A]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                />
              </label>

              {/* Estimated Minutes */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Est. Minutes</span>
                <input
                  type="number"
                  value={lesson.estimated_minutes}
                  onChange={e => set('estimated_minutes', parseInt(e.target.value) || 10)}
                  className="border border-gray-200 rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8A]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                />
              </label>

              {/* Total XP (computed) */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>Total XP (auto)</span>
                <div className="border border-gray-100 bg-gray-50 rounded-[12px] px-3 py-2 text-sm font-bold text-[#1B4F8A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {totalXP} XP
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ── Blocks list ── */}
        <div>
          <h2 className="font-bold text-[#1B4F8A] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Blocks ({lesson.blocks?.length || 0})
          </h2>

          <div className="flex flex-col gap-3">
            {(lesson.blocks || []).map((block: Record<string, unknown>, index: number) => (
              <Card key={index} variant="default" padding="none">
                {/* Block header */}
                <div
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 rounded-t-[20px] transition-colors"
                  onClick={() => setExpandedBlock(expandedBlock === index ? null : index)}
                >
                  <span className="text-xl">{BLOCK_ICONS[block.type as string] || '?'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[#1B1B1B] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {(block.title as string) || (block.headline as string) || (block.type as string)}
                    </span>
                  </div>
                  <Badge color="gold" size="sm">{(block.xpReward as number) || 0} XP</Badge>

                  {/* Reorder buttons */}
                  <button
                    onClick={e => { e.stopPropagation(); moveBlock(index, -1) }}
                    disabled={index === 0}
                    className="w-7 h-7 rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-xs font-bold transition-colors"
                    title="Move up"
                  >
                    &uarr;
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); moveBlock(index, 1) }}
                    disabled={index === lesson.blocks.length - 1}
                    className="w-7 h-7 rounded-[8px] bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-xs font-bold transition-colors"
                    title="Move down"
                  >
                    &darr;
                  </button>

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); deleteBlock(index) }}
                    className="w-7 h-7 rounded-[8px] bg-[#FFE5E5] text-[#FF4B4B] hover:bg-[#FFCCCC] flex items-center justify-center text-xs font-bold transition-colors"
                    title="Delete block"
                  >
                    &times;
                  </button>

                  <span className="text-gray-400 text-sm">{expandedBlock === index ? '\u25B2' : '\u25BC'}</span>
                </div>

                {/* Expanded editor */}
                {expandedBlock === index && (
                  <div className="px-5 pb-4 border-t border-gray-100">
                    <textarea
                      defaultValue={JSON.stringify(block, null, 2)}
                      onBlur={e => updateBlockFromJSON(index, e.target.value)}
                      className={`
                        w-full mt-3 p-3 rounded-[12px] text-xs font-mono
                        border focus:outline-none resize-y min-h-[200px]
                        ${blockErrors[index] ? 'border-[#FF4B4B] bg-[#FFF5F5]' : 'border-gray-200 bg-[#FAFAFA] focus:border-[#1B4F8A]'}
                      `}
                      rows={12}
                    />
                    {blockErrors[index] && (
                      <p className="text-xs text-[#FF4B4B] mt-1 font-bold" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {blockErrors[index]}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Add Block */}
          <div className="mt-4">
            {addingType === null ? (
              <button
                onClick={() => setAddingType('')}
                className="w-full py-3 rounded-[16px] border-2 border-dashed border-[#B8CBE0] text-[#1B4F8A] font-bold hover:bg-white hover:border-[#1B4F8A] transition-all"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                + Add Block
              </button>
            ) : (
              <Card variant="bordered" padding="md">
                <p className="text-sm font-bold text-[#1B4F8A] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Choose block type:
                </p>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-white border border-gray-200 hover:border-[#1B4F8A] hover:bg-[#EBF0F8] text-sm font-bold text-[#1B1B1B] transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      <span>{BLOCK_ICONS[type]}</span>
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAddingType(null)}
                  className="mt-3 text-xs text-[#6B7280] hover:text-[#1B1B1B] font-bold"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Cancel
                </button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
