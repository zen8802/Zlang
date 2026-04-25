'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Button from '@/components/ui/Button'

interface ExamQuestion {
  id: string
  type: string
  prompt: string
  options?: string[]
  correct_answer: string
  explanation?: string
  sentence?: string
  tiles?: string[]
}

interface ExamData {
  questions: ExamQuestion[]
  estimatedMinutes?: number
  passMark?: number
}

interface ExamModalProps {
  lessonId: string
  lessonTitle: string
  experienceLevel: number
  onClose: () => void
  onComplete: (score: number) => void
}

type Phase = 'loading' | 'ready' | 'taking' | 'results'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function speakJapanese(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.8
  window.speechSynthesis.speak(utterance)
}

export function ExamModal({ lessonId, lessonTitle, onClose, onComplete }: ExamModalProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [exam, setExam] = useState<ExamData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false
    async function fetchExam() {
      try {
        const res = await fetch(`/api/saved-lessons/${lessonId}/generate-exam`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!res.ok) throw new Error('Failed to generate exam')
        const data = await res.json()
        if (!cancelled) {
          setExam(data)
          setPhase('ready')
        }
      } catch {
        if (!cancelled) {
          setExam(null)
          setPhase('ready')
        }
      }
    }
    fetchExam()
    return () => { cancelled = true }
  }, [lessonId])

  const currentQuestion = exam?.questions?.[currentIndex] ?? null

  const handleSelectAnswer = useCallback((answer: string) => {
    if (showFeedback || !currentQuestion) return
    setSelectedAnswer(answer)
    setShowFeedback(true)
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
  }, [showFeedback, currentQuestion])

  const handleNext = useCallback(() => {
    if (!exam) return
    if (currentIndex < exam.questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      // Submit exam
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const finalAnswers = { ...answers }
      if (currentQuestion && selectedAnswer) {
        finalAnswers[currentQuestion.id] = selectedAnswer
      }

      let correct = 0
      exam.questions.forEach(q => {
        if (finalAnswers[q.id] === q.correct_answer) correct++
      })
      const pct = Math.round((correct / exam.questions.length) * 100)
      setScore(pct)

      fetch(`/api/saved-lessons/${lessonId}/submit-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers, timeTaken }),
      })
        .then(r => r.json())
        .then(data => setResults(data))
        .catch(() => {})

      setPhase('results')
      onComplete(pct)
    }
  }, [exam, currentIndex, answers, currentQuestion, selectedAnswer, lessonId, onComplete])

  const startExam = () => {
    startTimeRef.current = Date.now()
    setPhase('taking')
  }

  const isCorrect = selectedAnswer === currentQuestion?.correct_answer

  // ------- RENDER -------

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#FDFBF8' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E0DAD2' }}>
        <button
          onClick={onClose}
          className="text-sm text-[#6B6560] hover:text-[#1A1814]"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          ✕ Close
        </button>
        <p
          className="text-sm font-semibold text-[#1A1814] truncate mx-4"
          style={{ fontFamily: 'Shippori Mincho, serif' }}
        >
          {lessonTitle}
        </p>
        <div className="w-12" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        {/* LOADING */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#1B4F8A', borderTopColor: 'transparent' }}
            />
            <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Generating exam…
            </p>
          </div>
        )}

        {/* READY */}
        {phase === 'ready' && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            {exam ? (
              <>
                <p
                  className="text-2xl font-bold text-[#1A1814]"
                  style={{ fontFamily: 'Shippori Mincho, serif' }}
                >
                  Exam ready
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-[#6B6560]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {exam.questions.length} questions · ~{exam.estimatedMinutes || Math.ceil(exam.questions.length * 0.5)} min
                  </p>
                  <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    Pass mark: {exam.passMark || 70}%
                  </p>
                </div>
                <Button onClick={startExam}>Start exam</Button>
              </>
            ) : (
              <>
                <p className="text-sm text-[#DC2626]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Failed to generate exam. Please try again.
                </p>
                <Button variant="secondary" onClick={onClose}>Go back</Button>
              </>
            )}
          </div>
        )}

        {/* TAKING */}
        {phase === 'taking' && exam && currentQuestion && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="w-full bg-[#E0DAD2] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / exam.questions.length) * 100}%`,
                  backgroundColor: '#1B4F8A',
                }}
              />
            </div>
            <p className="text-xs text-[#9E9892] text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Question {currentIndex + 1} of {exam.questions.length}
            </p>

            {/* Question prompt */}
            <p
              className="text-lg font-semibold text-[#1A1814] text-center"
              style={{ fontFamily: 'Shippori Mincho, serif' }}
            >
              {currentQuestion.prompt}
            </p>

            {/* Audio play button for audio_to_meaning */}
            {currentQuestion.type === 'audio_to_meaning' && (
              <div className="flex justify-center">
                <button
                  onClick={() => speakJapanese(currentQuestion.correct_answer)}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl hover:bg-[#EBF0F8] transition-colors border"
                  style={{ borderColor: '#E0DAD2', backgroundColor: '#FDFBF8' }}
                >
                  🔊
                </button>
              </div>
            )}

            {/* Question type renderers */}
            {(currentQuestion.type === 'word_to_meaning' ||
              currentQuestion.type === 'meaning_to_word' ||
              currentQuestion.type === 'multiple_choice_cultural' ||
              currentQuestion.type === 'audio_to_meaning' ||
              currentQuestion.type === 'context_usage') &&
              currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((opt, i) => {
                    let bgColor = '#FDFBF8'
                    let borderColor = '#E0DAD2'
                    let textColor = '#1A1814'
                    let opacity = '1'

                    if (showFeedback) {
                      if (opt === currentQuestion.correct_answer) {
                        bgColor = '#EFF5F0'
                        borderColor = '#B8D4C0'
                        textColor = '#3D6B4F'
                      } else if (opt === selectedAnswer) {
                        bgColor = '#F5EEEE'
                        borderColor = '#D4BABA'
                        textColor = '#8B3A3A'
                      } else {
                        opacity = '0.4'
                      }
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectAnswer(opt)}
                        disabled={showFeedback}
                        className="w-full text-left px-4 py-3 rounded-[8px] border transition-all text-sm font-medium"
                        style={{
                          backgroundColor: bgColor,
                          borderColor,
                          color: textColor,
                          opacity,
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

            {/* Fill sentence */}
            {currentQuestion.type === 'fill_sentence' && currentQuestion.sentence && currentQuestion.options && (
              <FillBlankQuestion
                sentence={currentQuestion.sentence}
                options={currentQuestion.options}
                correctAnswer={currentQuestion.correct_answer}
                showFeedback={showFeedback}
                selectedAnswer={selectedAnswer}
                onSelect={handleSelectAnswer}
              />
            )}

            {/* Free write */}
            {currentQuestion.type === 'free_write' && !showFeedback && (
              <div
                className="rounded-[8px] border px-4 py-3"
                style={{ backgroundColor: '#EBF0F8', borderColor: '#1B4F8A' }}
              >
                <p className="text-sm text-[#1B4F8A]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Free write coming soon — marked as correct
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => handleSelectAnswer(currentQuestion.correct_answer)}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Sentence assembly */}
            {currentQuestion.type === 'sentence_assembly' && currentQuestion.tiles && (
              <SentenceAssembly
                tiles={currentQuestion.tiles}
                correctAnswer={currentQuestion.correct_answer}
                showFeedback={showFeedback}
                onSubmit={handleSelectAnswer}
              />
            )}

            {/* Feedback card */}
            {showFeedback && (
              <div className="space-y-4">
                <div
                  className="rounded-[10px] border px-4 py-3"
                  style={{
                    backgroundColor: isCorrect ? '#EFF5F0' : '#F5EEEE',
                    borderColor: isCorrect ? '#B8D4C0' : '#D4BABA',
                  }}
                >
                  <p
                    className="text-sm font-bold mb-1"
                    style={{
                      color: isCorrect ? '#3D6B4F' : '#8B3A3A',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  {currentQuestion.explanation && (
                    <p
                      className="text-xs"
                      style={{
                        color: isCorrect ? '#3D6B4F' : '#8B3A3A',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
                <Button fullWidth onClick={handleNext}>
                  {currentIndex < exam.questions.length - 1 ? 'Next question' : 'See results'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* RESULTS */}
        {phase === 'results' && exam && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p
                className="text-5xl font-bold"
                style={{
                  fontFamily: 'Shippori Mincho, serif',
                  color: score >= 70 ? '#3D6B4F' : '#DC2626',
                }}
              >
                {score}%
              </p>
              <p
                className="text-lg font-semibold"
                style={{
                  fontFamily: 'Shippori Mincho, serif',
                  color: score >= 70 ? '#3D6B4F' : '#DC2626',
                }}
              >
                {score >= 70 ? 'Passed' : 'Not yet'}
              </p>
            </div>

            {/* Question breakdown */}
            <div className="space-y-2">
              {exam.questions.map((q, i) => {
                const userAnswer = answers[q.id]
                const wasCorrect = userAnswer === q.correct_answer
                return (
                  <div
                    key={q.id}
                    className="rounded-[8px] border px-3 py-2"
                    style={{
                      borderColor: wasCorrect ? '#B8D4C0' : '#D4BABA',
                      backgroundColor: wasCorrect ? '#FDFBF8' : '#FDFBF8',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="text-sm font-bold mt-0.5"
                        style={{ color: wasCorrect ? '#3D6B4F' : '#DC2626' }}
                      >
                        {wasCorrect ? '✓' : '✗'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-[#1A1814]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {i + 1}. {q.prompt}
                        </p>
                        {!wasCorrect && q.explanation && (
                          <p className="text-xs text-[#8B3A3A] mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {results && results.xpEarned && (
              <p className="text-center text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                +{results.xpEarned} XP earned
              </p>
            )}

            <Button fullWidth onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inline sub-components ───────────────────────────────────────────

function FillBlankQuestion({
  sentence,
  options,
  correctAnswer,
  showFeedback,
  selectedAnswer,
  onSelect,
}: {
  sentence: string
  options: string[]
  correctAnswer: string
  showFeedback: boolean
  selectedAnswer: string | null
  onSelect: (answer: string) => void
}) {
  return (
    <div className="space-y-4">
      <p
        className="text-base text-center text-[#1A1814]"
        style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
      >
        {sentence.replace('___', '______')}
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((opt, i) => {
          let bgColor = '#FDFBF8'
          let borderColor = '#E0DAD2'
          let textColor = '#1A1814'

          if (showFeedback) {
            if (opt === correctAnswer) {
              bgColor = '#EFF5F0'
              borderColor = '#B8D4C0'
              textColor = '#3D6B4F'
            } else if (opt === selectedAnswer) {
              bgColor = '#F5EEEE'
              borderColor = '#D4BABA'
              textColor = '#8B3A3A'
            }
          }

          return (
            <button
              key={i}
              onClick={() => onSelect(opt)}
              disabled={showFeedback}
              className="px-4 py-2 rounded-[8px] border text-sm font-medium transition-all"
              style={{
                backgroundColor: bgColor,
                borderColor,
                color: textColor,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SentenceAssembly({
  tiles,
  correctAnswer,
  showFeedback,
  onSubmit,
}: {
  tiles: string[]
  correctAnswer: string
  showFeedback: boolean
  onSubmit: (answer: string) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [available, setAvailable] = useState<string[]>(tiles)

  const handleTileClick = (tile: string, index: number) => {
    setSelected(prev => [...prev, tile])
    setAvailable(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const handleRemoveTile = (tile: string, index: number) => {
    setAvailable(prev => [...prev, tile])
    setSelected(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const handleCheck = () => {
    onSubmit(selected.join(' '))
  }

  return (
    <div className="space-y-4">
      {/* Assembly area */}
      <div
        className="min-h-[48px] rounded-[8px] border px-3 py-2 flex flex-wrap gap-1.5"
        style={{
          borderColor: showFeedback
            ? selected.join(' ') === correctAnswer
              ? '#B8D4C0'
              : '#D4BABA'
            : '#E0DAD2',
          backgroundColor: '#FDFBF8',
        }}
      >
        {selected.length === 0 && (
          <span className="text-sm text-[#C8C3BC]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Tap tiles to build the sentence…
          </span>
        )}
        {selected.map((tile, i) => (
          <button
            key={i}
            onClick={() => !showFeedback && handleRemoveTile(tile, i)}
            disabled={showFeedback}
            className="px-3 py-1 rounded-[6px] border text-sm font-medium"
            style={{
              backgroundColor: '#EBF0F8',
              borderColor: '#1B4F8A',
              color: '#1B4F8A',
              fontFamily: 'Noto Sans JP, sans-serif',
            }}
          >
            {tile}
          </button>
        ))}
      </div>

      {/* Available tiles */}
      {!showFeedback && (
        <div className="flex flex-wrap gap-2 justify-center">
          {available.map((tile, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(tile, i)}
              className="px-3 py-1.5 rounded-[6px] border text-sm font-medium hover:bg-[#F0ECE6] transition-colors"
              style={{
                backgroundColor: '#FDFBF8',
                borderColor: '#E0DAD2',
                color: '#1A1814',
                fontFamily: 'Noto Sans JP, sans-serif',
              }}
            >
              {tile}
            </button>
          ))}
        </div>
      )}

      {/* Check button */}
      {!showFeedback && selected.length > 0 && (
        <Button fullWidth onClick={handleCheck}>Check answer</Button>
      )}
    </div>
  )
}
