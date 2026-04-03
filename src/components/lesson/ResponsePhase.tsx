'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import LoadingHaiku from './LoadingHaiku'
import { useStreamingFetch } from '@/lib/useStreamingFetch'
import { useAppStore } from '@/store/useAppStore'
import { getClipById } from '@/data/clips'
import { getLessonById } from '@/data/curriculum'

interface GradeResult {
  naturalness: number
  culturalFit: number
  grammarAccuracy: number
  creativity: number
  overallFeedback: string
  improvedVersion: string
  specificPraise: string
  oneThingToFix: string
}

interface ResponsePhaseProps {
  lessonId: string
  clipId: string
  onComplete: (grade: string) => void
}

export default function ResponsePhase({
  lessonId,
  clipId,
  onComplete,
}: ResponsePhaseProps) {
  const [stage, setStage] = useState<'writing' | 'grading' | 'result'>('writing')
  const [userResponse, setUserResponse] = useState('')
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)

  const { content, isLoading, fetchStream } = useStreamingFetch()
  const corridor = useAppStore((s) => s.corridor)
  const level = useAppStore((s) => s.level)

  const clip = getClipById(clipId)
  const lesson = getLessonById(lessonId)

  // Parse grade result from streamed JSON
  useEffect(() => {
    if (!content || isLoading) return

    try {
      let cleaned = content.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
      cleaned = cleaned.trim()

      const parsed = JSON.parse(cleaned) as GradeResult
      if (parsed.naturalness !== undefined && parsed.overallFeedback) {
        setGradeResult(parsed)
        setStage('result')
      }
    } catch {
      if (!isLoading && content.length > 50) {
        // Fallback result
        setGradeResult({
          naturalness: 3,
          culturalFit: 3,
          grammarAccuracy: 3,
          creativity: 3,
          overallFeedback: content,
          improvedVersion: '',
          specificPraise: '',
          oneThingToFix: '',
        })
        setStage('result')
      }
    }
  }, [content, isLoading])

  const handleSubmit = useCallback(async () => {
    if (!userResponse.trim()) return

    setStage('grading')

    const context = `Clip: "${clip?.title || ''}"
Transcript: ${clip?.transcript || ''}
Translation: ${clip?.translation || ''}
Scene: ${lesson?.description || ''}`

    await fetchStream({
      action: 'grade-response',
      corridor,
      level,
      userResponse: userResponse.trim(),
      context,
    })
  }, [fetchStream, corridor, level, userResponse, clip, lesson])

  // Calculate overall grade letter from scores
  const getLetterGrade = (result: GradeResult): string => {
    const avg = (result.naturalness + result.culturalFit + result.grammarAccuracy + result.creativity) / 4
    if (avg >= 4.5) return 'A'
    if (avg >= 3.5) return 'B'
    if (avg >= 2.5) return 'C'
    if (avg >= 1.5) return 'D'
    return 'F'
  }

  const scoreBarColor = (score: number): string => {
    if (score >= 4) return 'bg-accent'
    if (score >= 3) return 'bg-accent-en'
    if (score >= 2) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const isEnToJp = corridor === 'en-to-jp'
  const prompt = isEnToJp
    ? 'How would you respond to this character? Write in Japanese. Use the correct politeness level for the situation.'
    : "How would you reply to this in the comments? Write in English. Make it sound like something a real English speaker would say."

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-accent uppercase tracking-[0.2em] mb-1">Phase 4</p>
        <h2 className="text-2xl font-display font-bold text-foreground">Response</h2>
        <p className="text-sm text-foreground/40 mt-1">
          Show what you&apos;ve learned. Write your own response.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Writing stage */}
        {stage === 'writing' && (
          <motion.div
            key="writing"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Context card */}
            <motion.div
              className="glass-card p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs text-foreground/30 uppercase tracking-wider mb-2">Scene</p>
              <p className={`text-lg font-jp mb-2 ${
                isEnToJp ? 'text-accent-jp' : 'text-accent-en'
              }`}>
                {clip?.transcript || ''}
              </p>
              <p className="text-sm text-foreground/50">{clip?.translation || ''}</p>
              <p className="text-xs text-foreground/30 mt-3 italic">
                {lesson?.description || ''}
              </p>
            </motion.div>

            {/* Prompt */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-foreground/70 text-sm leading-relaxed max-w-md mx-auto">
                {prompt}
              </p>
            </motion.div>

            {/* Textarea */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder={isEnToJp ? 'ここに日本語で書いてください...' : 'Write your response here...'}
                rows={5}
                className={`w-full bg-black/[0.03] border border-black/10 rounded-2xl px-5 py-4 text-foreground text-lg placeholder-foreground/20 focus:outline-none focus:ring-2 transition-all resize-none leading-relaxed ${
                  isEnToJp
                    ? 'font-jp focus:border-accent-jp/50 focus:ring-accent-jp/30'
                    : 'focus:border-accent-en/50 focus:ring-accent-en/30'
                }`}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-foreground/20">
                  {userResponse.length} characters
                </p>
                <p className="text-xs text-foreground/20">
                  {isEnToJp ? 'Hint: Think about keigo level' : 'Hint: Keep it casual and natural'}
                </p>
              </div>
            </motion.div>

            {/* Submit button */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={userResponse.trim().length < 3}
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M17.5 2.5l-7.5 15-3.333-6.667L0 7.5l17.5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                Submit Response
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Grading stage */}
        {stage === 'grading' && (
          <motion.div
            key="grading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingHaiku />
          </motion.div>
        )}

        {/* Result stage */}
        {stage === 'result' && gradeResult && (
          <motion.div
            key="result"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Naturalness', score: gradeResult.naturalness },
                { label: 'Cultural Fit', score: gradeResult.culturalFit },
                { label: 'Grammar', score: gradeResult.grammarAccuracy },
                { label: 'Creativity', score: gradeResult.creativity },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="glass-card p-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-foreground/40 uppercase tracking-wider">{item.label}</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{item.score}/5</p>
                  </div>
                  <div className="w-full h-2 bg-black/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${scoreBarColor(item.score)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.score / 5) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Overall feedback */}
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-foreground/70 text-sm leading-relaxed">
                {gradeResult.overallFeedback}
              </p>
            </motion.div>

            {/* Improved version */}
            {gradeResult.improvedVersion && (
              <motion.div
                className="relative glass-card p-5 border-l-4 border-accent/60"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs text-accent/60 uppercase tracking-wider mb-2">Improved Version</p>
                <p className={`text-lg leading-relaxed ${
                  isEnToJp ? 'text-accent-jp font-jp' : 'text-accent-en'
                }`}>
                  {gradeResult.improvedVersion}
                </p>
              </motion.div>
            )}

            {/* Specific praise */}
            {gradeResult.specificPraise && (
              <motion.div
                className="glass-card p-4 border-l-4 border-green-500/60"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-xs text-green-400/60 uppercase tracking-wider mb-1.5">What you did well</p>
                <p className="text-sm text-green-400/80 leading-relaxed">
                  {gradeResult.specificPraise}
                </p>
              </motion.div>
            )}

            {/* One thing to fix */}
            {gradeResult.oneThingToFix && (
              <motion.div
                className="glass-card p-4 border-l-4 border-amber-500/60"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-xs text-amber-400/60 uppercase tracking-wider mb-1.5">One thing to improve</p>
                <p className="text-sm text-amber-400/80 leading-relaxed">
                  {gradeResult.oneThingToFix}
                </p>
              </motion.div>
            )}

            {/* Continue button */}
            <motion.div
              className="flex justify-center pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => onComplete(getLetterGrade(gradeResult))}
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4.167 10h11.666M10 4.167L15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                Continue to Cultural Dive
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
