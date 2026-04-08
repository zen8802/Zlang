'use client'

import type { CultureNoteBlock } from '@/types/lesson-blocks'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface Props {
  block: CultureNoteBlock
  onComplete: (xp: number) => void
}

export default function CultureNoteBlockRenderer({ block, onComplete }: Props) {
  return (
    <div className="page-enter flex flex-col gap-5 py-4">
      <Card variant="elevated">
        {/* Emoji + Headline */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{block.emoji}</span>
          <h2 className="text-xl font-extrabold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-ui)' }}>
            {block.headline}
          </h2>
        </div>

        {/* Body */}
        <p className="text-base text-[#1A1A2E] leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>
          {block.body}
        </p>

        {/* Not in any textbook */}
        {block.neverInTextbook && (
          <div className="bg-[#EBF0F8] rounded-[16px] p-4 mt-4">
            <p className="text-sm font-bold text-[#1B4F8A] mb-1" style={{ fontFamily: 'var(--font-ui)' }}>
              Not in any textbook:
            </p>
            <p className="text-sm text-[#1B4F8A]" style={{ fontFamily: 'var(--font-ui)' }}>
              {block.neverInTextbook}
            </p>
          </div>
        )}

        {/* Related words */}
        {block.relatedWords.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-[#6B7280] font-semibold mb-2" style={{ fontFamily: 'var(--font-ui)' }}>
              Related Words
            </p>
            <div className="flex flex-wrap gap-2">
              {block.relatedWords.map((word, i) => {
                if (typeof word === 'string') {
                  return <Badge key={i} color="blue" size="sm">{word}</Badge>
                }
                return (
                  <div key={i} className="bg-[#EBF0F8] border border-[#B8CBE0] rounded-[10px] px-3 py-1.5 text-center">
                    <p className="text-sm font-bold text-[#1B4F8A]" style={{ fontFamily: 'Noto Sans JP' }}>{word.word}</p>
                    <p className="text-[10px] text-gray-400">{word.reading} — {word.meaning}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      <Button onClick={() => onComplete(block.xpReward)} fullWidth>
        Continue
      </Button>
    </div>
  )
}
