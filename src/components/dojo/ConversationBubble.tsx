'use client'

import { motion } from 'framer-motion'

interface ConversationBubbleProps {
  role: 'character' | 'user'
  avatar?: string
  name?: string
  text: string
  coachNote?: string
  isStreaming?: boolean
}

export default function ConversationBubble({
  role,
  avatar,
  name,
  text,
  coachNote,
  isStreaming = false,
}: ConversationBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 w-9 h-9 rounded-full bg-black/[0.05] flex items-center justify-center text-lg border border-black/10">
          {avatar || '🤖'}
        </div>
      )}

      {/* Bubble content */}
      <div className={`max-w-[80%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Name label */}
        {!isUser && name && (
          <p className="text-xs text-foreground/40 font-medium px-1">{name}</p>
        )}

        {/* Message bubble */}
        <div
          className={[
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-accent/15 border border-accent/30 text-foreground ml-auto'
              : 'glass-card text-foreground/90',
            isStreaming ? 'animate-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>

        {/* Coach note (only for character messages) */}
        {!isUser && coachNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="px-3 py-2 rounded-lg bg-black/[0.03] border border-black/[0.05] ml-1"
          >
            <p className="text-xs text-foreground/40 italic leading-relaxed">
              <span className="text-accent/60 not-italic mr-1">Coach:</span>
              {coachNote}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
