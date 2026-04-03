'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import LoadingHaiku from './LoadingHaiku'
import { useStreamingFetch } from '@/lib/useStreamingFetch'
import { useAppStore } from '@/store/useAppStore'
import { getClipById } from '@/data/clips'
import { getLessonById } from '@/data/curriculum'
import { getCachedLessonContent, cacheLessonContent } from '@/lib/progress'

interface CulturalDivePhaseProps {
  lessonId: string
  clipId: string
  onComplete: () => void
}

export default function CulturalDivePhase({
  lessonId,
  clipId,
  onComplete,
}: CulturalDivePhaseProps) {
  const [stage, setStage] = useState<'loading' | 'reading'>('loading')
  const [paragraphs, setParagraphs] = useState<string[]>([])

  const { content, isLoading, fetchStream } = useStreamingFetch()
  const corridor = useAppStore((s) => s.corridor)
  const level = useAppStore((s) => s.level)

  const clip = getClipById(clipId)
  const lesson = getLessonById(lessonId)

  // Split streamed content into paragraphs
  useEffect(() => {
    if (!content) return

    const paras = content
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (paras.length > 0) {
      setParagraphs(paras)
      if (!isLoading) {
        setStage('reading')
        cacheLessonContent(lessonId, 'cultural-dive', paras)
      }
    }
  }, [content, isLoading, lessonId])

  // Fetch on mount
  useEffect(() => {
    const cached = getCachedLessonContent(lessonId, 'cultural-dive')
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setParagraphs(cached as string[])
      setStage('reading')
      return
    }

    fetchStream({
      action: 'cultural-dive',
      corridor,
      level,
      clipTitle: clip?.title || '',
      clipContext: `${clip?.transcript || ''}\n\n${clip?.translation || ''}`,
      culturalNotes: clip?.culturalNotes || '',
      culturalTheme: lesson?.culturalTheme || '',
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-accent uppercase tracking-[0.2em] mb-1">Phase 5</p>
        <h2 className="text-2xl font-display font-bold text-foreground">Cultural Dive</h2>
        <p className="text-sm text-foreground/40 mt-1">
          Language is culture. Understand the world behind the words.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {stage === 'loading' && paragraphs.length === 0 && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingHaiku />
          </motion.div>
        )}

        {/* Streaming / Reading */}
        {paragraphs.length > 0 && (
          <motion.div
            key="content"
            className="space-y-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="glass-card p-8 sm:p-10">
              {paragraphs.map((para, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className={i > 0 ? 'mt-6' : ''}
                >
                  {/* Subtle divider between paragraphs */}
                  {i > 0 && (
                    <div className="flex items-center justify-center mb-6">
                      <div className="h-px w-12 bg-black/[0.05]" />
                      <svg width="16" height="16" viewBox="0 0 16 16" className="mx-3 text-accent/30">
                        <path
                          d="M8 2 L14 8 L8 14 L2 8 Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                      </svg>
                      <div className="h-px w-12 bg-black/[0.05]" />
                    </div>
                  )}

                  <p className="text-foreground/70 text-base leading-[1.85] font-body">
                    {/* Drop cap for first paragraph */}
                    {i === 0 && para.length > 0 ? (
                      <>
                        <span className={`float-left text-5xl font-display font-bold leading-[0.85] mr-2 mt-1 ${
                          corridor === 'en-to-jp' ? 'text-accent-jp' : 'text-accent-en'
                        }`}>
                          {para[0]}
                        </span>
                        {para.slice(1)}
                      </>
                    ) : (
                      para
                    )}
                  </p>
                </motion.div>
              ))}

              {/* Streaming cursor */}
              {isLoading && (
                <motion.span
                  className="inline-block w-1.5 h-4 bg-accent/60 ml-1 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>

            {/* Theme badge */}
            {lesson?.culturalTheme && (
              <motion.div
                className="flex justify-center pt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-xs text-foreground/20 px-3 py-1 rounded-full border border-black/8">
                  {lesson.culturalTheme}
                </span>
              </motion.div>
            )}

            {/* Continue button */}
            {!isLoading && (
              <motion.div
                className="flex justify-center pt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
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
                  Continue to Vocab Lock-in
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
