'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { getClipById } from '@/data/clips'
import { useAppStore } from '@/store/useAppStore'

interface ClipPlayerProps {
  clipId: string
  phase: 'immersion' | 'decode'
  onComplete: () => void
  showSubtitles?: boolean
}

export default function ClipPlayer({
  clipId,
  phase,
  onComplete,
  showSubtitles = false,
}: ClipPlayerProps) {
  const clip = getClipById(clipId)
  const corridor = useAppStore((s) => s.corridor)

  const [countdown, setCountdown] = useState<number | null>(null)
  const [hasWatched, setHasWatched] = useState(false)

  const duration = clip ? clip.endSeconds - clip.startSeconds : 0
  const glowColor = corridor === 'en-to-jp' ? 'rgba(255, 107, 53, 0.4)' : 'rgba(59, 130, 246, 0.4)'

  // Start countdown when in immersion mode
  useEffect(() => {
    if (phase !== 'immersion' || !clip || hasWatched) return

    setCountdown(duration)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, clip, duration, hasWatched])

  const handleWatched = useCallback(() => {
    setHasWatched(true)
    onComplete()
  }, [onComplete])

  if (!clip) {
    return (
      <div className="text-center py-12 text-foreground/50">
        Clip not found
      </div>
    )
  }

  // Build YouTube embed URL with start/end parameters
  const embedUrl = `https://www.youtube.com/embed/${clip.youtubeId}?start=${Math.floor(clip.startSeconds)}&end=${Math.ceil(clip.endSeconds)}&rel=0&modestbranding=1&playsinline=1`

  return (
    <div className="space-y-4">
      {/* Video container with glowing border */}
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor.replace('0.4', '0.15')}`,
        }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Glowing border ring */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            border: `1px solid ${glowColor.replace('0.4', '0.6')}`,
          }}
        />

        {/* YouTube iframe */}
        <div className="youtube-container">
          <iframe
            src={embedUrl}
            title={clip.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-2xl"
          />
        </div>

        {/* Immersion countdown overlay */}
        {phase === 'immersion' && countdown !== null && countdown > 0 && (
          <motion.div
            className="absolute top-4 right-4 z-20 glass-card px-4 py-2 flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-foreground/70 tabular-nums font-mono">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Subtitle / transcript overlay for decode mode */}
      {(showSubtitles || phase === 'decode') && (
        <motion.div
          className="glass-card p-5 space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1.5">Transcript</p>
            <p className={`text-lg font-jp leading-relaxed ${
              corridor === 'en-to-jp' ? 'text-accent-jp' : 'text-accent-en'
            }`}>
              {clip.transcript}
            </p>
          </div>
          <div className="border-t border-black/8 pt-3">
            <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1.5">Translation</p>
            <p className="text-base text-foreground/70 leading-relaxed">
              {clip.translation}
            </p>
          </div>
        </motion.div>
      )}

      {/* Action button */}
      {!hasWatched && (
        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: phase === 'immersion' ? 5 : 1 }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handleWatched}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            {phase === 'immersion' ? "I've watched the clip" : "I understand, continue"}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
