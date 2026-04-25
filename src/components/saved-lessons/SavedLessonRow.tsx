'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExamModal } from './ExamModal'

interface SavedLesson {
  id: string
  scenario_title: string
  created_at: string
  vocab_count: number
  kana_count: number
  best_exam_score: number | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface FullLesson {
  id: string
  scenario_title: string
  created_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vocabulary: any[]
  hiragana: string[]
  katakana: string[]
  kanji: string[]
  exam_history: {
    best_score: number | null
    attempts: number
    last_score: number | null
  }
}

interface SavedLessonRowProps {
  lesson: SavedLesson
  onDelete: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SavedLessonRow({ lesson, onDelete }: SavedLessonRowProps) {
  const router = useRouter()
  const [showExam, setShowExam] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [fullLesson, setFullLesson] = useState<FullLesson | null>(null)
  const [loadingFull, setLoadingFull] = useState(false)
  const [activeTab, setActiveTab] = useState<'words' | 'kana' | 'kanji'>('words')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (!fullLesson) {
      setLoadingFull(true)
      try {
        const res = await fetch(`/api/saved-lessons/${lesson.id}`)
        if (res.ok) {
          const data = await res.json()
          setFullLesson(data)
        }
      } catch {
        // silently fail
      } finally {
        setLoadingFull(false)
      }
    }
  }

  const handleDelete = async () => {
    try {
      await fetch(`/api/saved-lessons/${lesson.id}`, { method: 'DELETE' })
      onDelete()
    } catch {
      // silently fail
    }
  }

  const tabs = [
    { key: 'words' as const, label: 'Words' },
    { key: 'kana' as const, label: 'Kana' },
    { key: 'kanji' as const, label: 'Kanji' },
  ]

  return (
    <>
    <div
      className="rounded-[10px] border transition-all"
      style={{ backgroundColor: '#FDFBF8', borderColor: '#E0DAD2' }}
    >
      {/* Collapsed row - always visible */}
      <button
        onClick={handleExpand}
        className="w-full text-left px-4 py-3 hover:bg-[#F8F5F0] rounded-[10px] transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-[#1A1814] font-semibold truncate"
              style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '15px' }}
            >
              {lesson.scenario_title}
            </p>
            <p
              className="text-[#9E9892] text-xs mt-0.5"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {formatDate(lesson.created_at)}
              <span className="text-[#C8C3BC]">
                {' '}· {lesson.vocab_count} word{lesson.vocab_count !== 1 ? 's' : ''}
              </span>
              {lesson.kana_count > 0 && (
                <span className="text-[#C8C3BC]">
                  {' '}· {lesson.kana_count} kana
                </span>
              )}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {lesson.best_exam_score !== null && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: lesson.best_exam_score >= 70 ? '#EFF5F0' : '#FEF2F2',
                  color: lesson.best_exam_score >= 70 ? '#3D6B4F' : '#DC2626',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {lesson.best_exam_score}%
              </span>
            )}
            <span
              className="text-[#C8C3BC] text-sm transition-transform"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: '#E0DAD2' }}>
          {loadingFull ? (
            <div className="py-6 text-center">
              <p
                className="text-xs text-[#9E9892]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Loading lesson…
              </p>
            </div>
          ) : fullLesson ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mt-3 mb-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-[8px] transition-colors ${
                      activeTab === tab.key
                        ? 'bg-[#EBF0F8] text-[#1B4F8A]'
                        : 'text-[#9E9892] hover:text-[#6B6560] hover:bg-[#F0ECE6]'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Words tab */}
              {activeTab === 'words' && (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {fullLesson.vocabulary.length === 0 ? (
                    <p
                      className="text-xs text-[#9E9892] py-3 text-center"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      No vocabulary discovered yet.
                    </p>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    fullLesson.vocabulary.map((word: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[#F8F5F0]"
                      >
                        <span className="text-sm">{word.emoji || '📝'}</span>
                        <span
                          className="text-sm font-semibold text-[#1A1814]"
                          style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                        >
                          {word.word}
                        </span>
                        <span
                          className="text-xs text-[#9E9892]"
                          style={{ fontFamily: 'DM Mono, monospace' }}
                        >
                          {word.romaji}
                        </span>
                        <span
                          className="text-xs text-[#6B6560] flex-1"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          {word.english}
                        </span>
                        {word.pos && (
                          <span
                            className="text-[10px] text-[#9E9892] px-1.5 py-0.5 rounded-full border"
                            style={{
                              borderColor: '#E0DAD2',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            {word.pos}
                          </span>
                        )}
                        {word.produced && (
                          <span
                            className="text-[10px] font-bold text-[#3D6B4F] px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: '#EFF5F0',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            produced
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Kana tab */}
              {activeTab === 'kana' && (
                <div className="space-y-3">
                  {fullLesson.hiragana.length > 0 && (
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-widest text-[#9E9892] font-medium mb-1.5"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Hiragana
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {fullLesson.hiragana.map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 flex items-center justify-center rounded-[6px] border text-sm font-medium"
                            style={{
                              backgroundColor: '#FDFBF8',
                              borderColor: '#E0DAD2',
                              fontFamily: 'Noto Sans JP, sans-serif',
                              color: '#1A1814',
                            }}
                          >
                            {char}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {fullLesson.katakana.length > 0 && (
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-widest text-[#9E9892] font-medium mb-1.5"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Katakana
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {fullLesson.katakana.map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 flex items-center justify-center rounded-[6px] border text-sm font-medium"
                            style={{
                              backgroundColor: '#FDFBF8',
                              borderColor: '#E0DAD2',
                              fontFamily: 'Noto Sans JP, sans-serif',
                              color: '#1A1814',
                            }}
                          >
                            {char}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {fullLesson.hiragana.length === 0 && fullLesson.katakana.length === 0 && (
                    <p
                      className="text-xs text-[#9E9892] py-3 text-center"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      No kana characters in this lesson.
                    </p>
                  )}
                </div>
              )}

              {/* Kanji tab */}
              {activeTab === 'kanji' && (
                <div>
                  {fullLesson.kanji.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {fullLesson.kanji.map((char, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 flex items-center justify-center rounded-[6px] border text-sm font-medium"
                          style={{
                            backgroundColor: '#FDFBF8',
                            borderColor: '#E0DAD2',
                            fontFamily: 'Noto Sans JP, sans-serif',
                            color: '#1A1814',
                          }}
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="text-xs text-[#9E9892] py-3 text-center"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      No kanji in this lesson.
                    </p>
                  )}
                </div>
              )}

              {/* Exam history */}
              {fullLesson.exam_history && fullLesson.exam_history.attempts > 0 && (
                <div
                  className="mt-3 rounded-[8px] border px-3 py-2.5"
                  style={{ borderColor: '#E0DAD2' }}
                >
                  <p
                    className="text-[10px] uppercase tracking-widest text-[#9E9892] font-medium mb-1"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Exam history
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <span
                        className="text-sm font-bold"
                        style={{
                          color:
                            (fullLesson.exam_history.best_score ?? 0) >= 70
                              ? '#3D6B4F'
                              : '#DC2626',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        Best: {fullLesson.exam_history.best_score}%
                      </span>
                    </div>
                    <span className="text-[#C8C3BC] text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {fullLesson.exam_history.attempts} attempt{fullLesson.exam_history.attempts !== 1 ? 's' : ''}
                    </span>
                    {fullLesson.exam_history.last_score !== null && (
                      <span className="text-[#9E9892] text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        Last: {fullLesson.exam_history.last_score}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowExam(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white transition-colors"
                  style={{
                    backgroundColor: '#1B4F8A',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Take exam
                </button>
                <button
                  onClick={() => router.push(`/loop/retake/${lesson.id}`)}
                  className="text-xs font-bold px-3 py-1.5 rounded-[8px] border text-[#1B4F8A] hover:bg-[#EBF0F8] transition-colors"
                  style={{
                    borderColor: '#1B4F8A',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Retake lesson
                </button>
                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors ml-auto"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Delete
                  </button>
                ) : null}
              </div>

              {/* Delete confirmation */}
              {confirmingDelete && (
                <div
                  className="rounded-[8px] border px-3 py-2.5 mt-2"
                  style={{
                    backgroundColor: '#FEF2F2',
                    borderColor: '#FECACA',
                  }}
                >
                  <p
                    className="text-xs text-[#991B1B] mb-2"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Delete this saved lesson permanently? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-white transition-colors"
                      style={{
                        backgroundColor: '#DC2626',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      Delete permanently
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="text-xs font-bold px-3 py-1.5 rounded-[8px] text-[#6B6560] hover:bg-[#F0ECE6] transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <p
                className="text-xs text-[#9E9892]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Could not load lesson details.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    {showExam && (
      <ExamModal
        lessonId={lesson.id}
        lessonTitle={lesson.scenario_title || 'Exam'}
        experienceLevel={3}
        onClose={() => setShowExam(false)}
        onComplete={() => {
          setShowExam(false)
        }}
      />
    )}
    </>
  )
}
