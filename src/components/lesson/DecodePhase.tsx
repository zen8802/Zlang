'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ClipPlayer from './ClipPlayer'
import LoadingHaiku from './LoadingHaiku'
import { useStreamingFetch } from '@/lib/useStreamingFetch'
import { useAppStore } from '@/store/useAppStore'
import { getClipById } from '@/data/clips'
import { getLessonById } from '@/data/curriculum'
import { getCachedLessonContent, cacheLessonContent } from '@/lib/progress'

interface DecodeElement {
  line: string
  literalTranslation: string
  naturalTranslation: string
  grammarExplanation: string
  culturalContext: string
  level: string
}

interface DecodeData {
  elements: DecodeElement[]
  summary: string
}

interface DecodePhaseProps {
  lessonId: string
  clipId: string
  onComplete: () => void
}

export default function DecodePhase({
  lessonId,
  clipId,
  onComplete,
}: DecodePhaseProps) {
  const [stage, setStage] = useState<'watching' | 'loading' | 'decoded'>('watching')
  const [decodeData, setDecodeData] = useState<DecodeData | null>(null)

  const { content, isLoading, fetchStream } = useStreamingFetch()
  const corridor = useAppStore((s) => s.corridor)
  const level = useAppStore((s) => s.level)

  const clip = getClipById(clipId)
  const lesson = getLessonById(lessonId)

  // Try to parse decode data from streamed JSON content
  useEffect(() => {
    if (!content || isLoading) return

    try {
      // Clean up the content - strip markdown fences if present
      let cleaned = content.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
      cleaned = cleaned.trim()

      const parsed = JSON.parse(cleaned) as DecodeData
      if (parsed.elements && parsed.elements.length > 0) {
        setDecodeData(parsed)
        cacheLessonContent(lessonId, 'decode', parsed)
        setStage('decoded')
      }
    } catch {
      // JSON might not be complete yet, or there's a parsing error
      // If loading is finished and we can't parse, show raw content
      if (!isLoading && content.length > 50) {
        setStage('decoded')
      }
    }
  }, [content, isLoading, lessonId])

  const handleClipComplete = useCallback(async () => {
    // Check cache first
    const cached = getCachedLessonContent(lessonId, 'decode') as DecodeData | null
    if (cached && cached.elements) {
      setDecodeData(cached)
      setStage('decoded')
      return
    }

    setStage('loading')

    await fetchStream({
      action: 'decode',
      corridor,
      level,
      clipTitle: clip?.title || '',
      transcript: clip?.transcript || '',
      translation: clip?.translation || '',
      grammarPoints: lesson?.grammarFocus || [],
    })
  }, [fetchStream, corridor, level, clip, lesson, lessonId])

  const levelBadgeColor = (lvl: string) => {
    const lower = lvl.toLowerCase()
    if (lower.includes('n5') || lower.includes('a1')) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (lower.includes('n4') || lower.includes('a2')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    if (lower.includes('n3') || lower.includes('b1')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (lower.includes('n2') || lower.includes('b2')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    if (lower.includes('n1') || lower.includes('c')) return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-black/[0.05] text-foreground/60 border-black/20'
  }

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-accent uppercase tracking-[0.2em] mb-1">Phase 2</p>
        <h2 className="text-2xl font-display font-bold text-foreground">Decode</h2>
        <p className="text-sm text-foreground/40 mt-1">
          Now let&apos;s break down what you heard, piece by piece.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Stage: Watch with subtitles */}
        {stage === 'watching' && (
          <motion.div
            key="watching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <ClipPlayer
              clipId={clipId}
              phase="decode"
              onComplete={handleClipComplete}
              showSubtitles
            />
          </motion.div>
        )}

        {/* Stage: Loading */}
        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingHaiku />

            {/* Show streaming content below the haiku */}
            {content && (
              <motion.div
                className="glass-card p-4 mt-4 max-h-32 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
              >
                <p className="text-xs text-foreground/30 font-mono truncate">{content.slice(0, 200)}...</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Stage: Decoded content */}
        {stage === 'decoded' && (
          <motion.div
            key="decoded"
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Summary */}
            {decodeData?.summary && (
              <motion.div
                className="glass-card p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {decodeData.summary}
                </p>
              </motion.div>
            )}

            {/* Linguistic element cards */}
            {decodeData?.elements?.map((element, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <Card
                  glow={corridor === 'en-to-jp' ? 'jp' : 'en'}
                  padding="lg"
                  header={
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/40 uppercase tracking-wider">
                        Element {i + 1}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border ${levelBadgeColor(element.level)}`}
                      >
                        {element.level}
                      </span>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {/* Original line */}
                    <p className={`text-2xl font-jp font-bold leading-relaxed ${
                      corridor === 'en-to-jp' ? 'text-accent-jp' : 'text-accent-en'
                    }`}>
                      {element.line}
                    </p>

                    {/* Translations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-black/[0.03] rounded-xl p-3">
                        <p className="text-[10px] text-foreground/30 uppercase tracking-wider mb-1">Literal</p>
                        <p className="text-sm text-foreground/70">{element.literalTranslation}</p>
                      </div>
                      <div className="bg-black/[0.03] rounded-xl p-3">
                        <p className="text-[10px] text-foreground/30 uppercase tracking-wider mb-1">Natural</p>
                        <p className="text-sm text-foreground/70">{element.naturalTranslation}</p>
                      </div>
                    </div>

                    {/* Grammar explanation */}
                    <div className="border-t border-black/8 pt-3">
                      <p className="text-[10px] text-accent/60 uppercase tracking-wider mb-1.5">Grammar</p>
                      <p className="text-sm text-foreground/60 leading-relaxed">
                        {element.grammarExplanation}
                      </p>
                    </div>

                    {/* Cultural context */}
                    <div className="border-t border-black/8 pt-3">
                      <p className="text-[10px] text-accent-jp/60 uppercase tracking-wider mb-1.5">Cultural Context</p>
                      <p className="text-sm text-foreground/50 leading-relaxed italic">
                        {element.culturalContext}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Fallback: show raw content if JSON parsing failed */}
            {!decodeData && content && (
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-foreground/70 text-sm whitespace-pre-wrap leading-relaxed">
                  {content}
                </div>
              </motion.div>
            )}

            {/* Continue button */}
            <motion.div
              className="flex justify-center pt-2"
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
                Continue to Shadowing
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
