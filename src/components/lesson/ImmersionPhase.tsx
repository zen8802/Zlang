'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import ClipPlayer from './ClipPlayer'
import LoadingHaiku from './LoadingHaiku'
import { useStreamingFetch } from '@/lib/useStreamingFetch'
import { useAppStore } from '@/store/useAppStore'
import { getClipById } from '@/data/clips'

interface ImmersionPhaseProps {
  lessonId: string
  clipId: string
  onComplete: () => void
}

export default function ImmersionPhase({
  clipId,
  onComplete,
}: ImmersionPhaseProps) {
  const [stage, setStage] = useState<'watching' | 'loading' | 'questions' | 'answering'>('watching')
  const [answers, setAnswers] = useState<[string, string]>(['', ''])

  const { content, isLoading, fetchStream } = useStreamingFetch()
  const { corridor, level, interests, goal } = useAppStore((s) => ({
    corridor: s.corridor,
    level: s.level,
    interests: s.interests,
    goal: s.goal,
  }))

  const clip = getClipById(clipId)

  const handleClipComplete = useCallback(async () => {
    setStage('loading')

    await fetchStream({
      action: 'comprehension',
      corridor,
      level,
      interests,
      goal,
      clipTitle: clip?.title || '',
      transcript: clip?.transcript || '',
      translation: clip?.translation || '',
    })

    setStage('questions')
  }, [fetchStream, corridor, level, interests, goal, clip])

  // Parse questions from streamed content
  const questions = content
    .split('\n')
    .filter((line) => line.trim().startsWith('Question'))
    .map((line) => line.replace(/^Question\s*\d+:\s*/i, '').trim())

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-accent uppercase tracking-[0.2em] mb-1">Phase 1</p>
        <h2 className="text-2xl font-display font-bold text-white">Immersion</h2>
        <p className="text-sm text-white/40 mt-1">
          Watch without subtitles. Let the sounds wash over you.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Stage: Watching the clip */}
        {stage === 'watching' && (
          <motion.div
            key="watching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <ClipPlayer
              clipId={clipId}
              phase="immersion"
              onComplete={handleClipComplete}
            />
          </motion.div>
        )}

        {/* Stage: Loading haiku while fetching questions */}
        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingHaiku />
          </motion.div>
        )}

        {/* Stage: Comprehension questions */}
        {(stage === 'questions' || stage === 'answering') && (
          <motion.div
            key="questions"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-white mb-1">
                What did you pick up?
              </h3>
              <p className="text-sm text-white/40 mb-6">
                Don&apos;t worry about being right -- this is just to activate your brain.
              </p>

              {/* Streaming content display if questions haven't fully loaded */}
              {questions.length < 2 && content && (
                <motion.div
                  className="text-white/60 text-sm whitespace-pre-wrap mb-4 font-body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {content}
                  {isLoading && (
                    <motion.span
                      className="inline-block w-1.5 h-4 bg-accent/60 ml-1 align-middle"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              )}

              {/* Parsed questions with input fields */}
              {questions.length >= 2 && (
                <div className="space-y-5">
                  {questions.slice(0, 2).map((q, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        <span className="text-accent mr-2">{i + 1}.</span>
                        {q}
                      </label>
                      <input
                        type="text"
                        value={answers[i]}
                        onChange={(e) => {
                          const newAnswers = [...answers] as [string, string]
                          newAnswers[i] = e.target.value
                          setAnswers(newAnswers)
                          if (stage !== 'answering') setStage('answering')
                        }}
                        placeholder="Type your answer..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Continue button */}
            {questions.length >= 2 && (
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onComplete}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4.167 10h11.666M10 4.167L15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                >
                  Continue to Decode
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
