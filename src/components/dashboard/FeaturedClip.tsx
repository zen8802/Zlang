'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useResolvedClip } from '@/lib/useResolvedClip'
import { useAppStore } from '@/store/useAppStore'

interface FeaturedClipProps {
  clipId: string
}

function VocabFlipCard({
  word,
  meaning,
  delay,
}: {
  word: string
  meaning: string
  delay: number
}) {
  const [flipped, setFlipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer"
      style={{ perspective: '500px' }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-24 w-full"
      >
        {/* Front */}
        <div
          className="absolute inset-0 glass-card flex items-center justify-center p-3 rounded-xl border border-black/10"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="font-jp text-lg font-medium text-foreground text-center">
            {word}
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 glass-card flex items-center justify-center p-3 rounded-xl border border-accent/20 bg-accent/5"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span className="text-sm text-accent text-center">{meaning}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function FeaturedClip({ clipId }: FeaturedClipProps) {
  const { corridor } = useAppStore()
  const { clip, videoId } = useResolvedClip(clipId)

  if (!clip) {
    return (
      <div className="glass-card p-6 text-center text-foreground/40">
        Clip not found
      </div>
    )
  }

  const glowColor =
    corridor === 'en-to-jp'
      ? 'rgba(255, 107, 53, 0.35)'
      : 'rgba(59, 130, 246, 0.35)'

  const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${clip.startSeconds}&end=${clip.endSeconds}&rel=0&modestbranding=1`

  // Show up to 3 vocab items
  const vocabCards = clip.vocab.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* YouTube embed with glowing border */}
      <div
        className="youtube-container rounded-xl"
        style={{
          boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
        }}
      >
        <iframe
          src={embedUrl}
          title={clip.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-xl"
        />
      </div>

      {/* Vocab flip cards */}
      {vocabCards.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {vocabCards.map((v, i) => (
            <VocabFlipCard
              key={v.id}
              word={v.word}
              meaning={v.meaning}
              delay={0.3 + i * 0.1}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
