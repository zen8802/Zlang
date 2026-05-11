'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { getLevelKanjiSet } from '@/data/kanji-levels'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LessonBlock = any

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  initialTab?: 'conversation' | 'lesson'
  onBack: () => void
}

// ─── Furigana + kanji-level helpers (mirrors AttemptPhase) ──────────────────

function stripFurigana(text: string): string {
  return text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
}

function enforceLevelKanji(text: string, kanjiLevel: number): string {
  if (!text) return text
  const allowed = getLevelKanjiSet(kanjiLevel)
  return text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, (match, block: string, reading: string) => {
    for (const ch of block) {
      if (!allowed.has(ch)) return reading
    }
    return match
  })
}

function renderWithFurigana(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rp>(</rp>
        <rt className="text-[10px]" style={{ color: '#9E9892' }}>{match[2]}</rt>
        <rp>)</rp>
      </ruby>,
    )
    last = regex.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length > 0 ? <>{parts}</> : text
}

// ─── Parse character response — stripped down to what review needs ─────────

function parseCharacterContent(raw: string, kanjiLevel: number) {
  const firstSep = raw.search(/---\s*(?:VOCAB|ROMAJI|EN|COACH|OPTIONS|JP_OF_YOURS|HINTS)\s*---/)
  let body = firstSep >= 0 ? raw.slice(0, firstSep).trim() : raw.trim()
  body = enforceLevelKanji(body, kanjiLevel)

  let romaji = ''
  let english = ''
  const remaining = firstSep >= 0 ? raw.slice(firstSep) : ''
  const r = remaining.match(/---\s*ROMAJI\s*---\s*([\s\S]*?)(?=---\s*(?:EN|COACH|OPTIONS|JP_OF_YOURS|HINTS)\s*---|$)/)
  if (r) romaji = r[1].trim()
  const e = remaining.match(/---\s*EN\s*---\s*([\s\S]*?)(?=---\s*(?:COACH|OPTIONS|JP_OF_YOURS|HINTS)\s*---|$)/)
  if (e) english = e[1].trim()

  return { body, romaji, english }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function SessionReviewView({ session, initialTab = 'conversation', onBack }: Props) {
  const [tab, setTab] = useState<'conversation' | 'lesson'>(initialTab)

  const kanjiLevel: number = session?.kanjiLevel ?? 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = useMemo(
    () => (Array.isArray(session?.attemptMessages) ? session.attemptMessages : []),
    [session?.attemptMessages],
  )

  const lessonBlocks: LessonBlock[] = useMemo(
    () => (Array.isArray(session?.lessonBlocks) ? session.lessonBlocks : []),
    [session?.lessonBlocks],
  )

  const [blockIndex, setBlockIndex] = useState(0)

  const hasConversation = messages.length > 0
  const hasLesson = lessonBlocks.length > 0

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Top bar */}
      <div className="shrink-0 bg-[#FDFBF8] border-b border-[#E0DAD2] px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="text-sm text-[#9E9892] hover:text-[#6B6560] transition-colors"
            style={{ fontFamily: 'DM Sans' }}
          >
            ← Summary
          </button>
          <p className="text-sm font-semibold truncate max-w-[60%]" style={{ color: '#1A1814', fontFamily: 'Shippori Mincho' }}>
            {session?.scenarioTitle || 'Review'}
          </p>
          <div style={{ width: '60px' }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-[10px]" style={{ backgroundColor: '#F5F0EB' }}>
          <button
            onClick={() => setTab('conversation')}
            disabled={!hasConversation}
            className="flex-1 py-2 rounded-[8px] text-xs font-medium transition-colors disabled:opacity-40"
            style={{
              fontFamily: 'DM Sans',
              backgroundColor: tab === 'conversation' ? '#FDFBF8' : 'transparent',
              color: tab === 'conversation' ? '#1B4F8A' : '#9E9892',
              boxShadow: tab === 'conversation' ? '0 1px 3px rgba(26,24,20,0.06)' : 'none',
            }}
          >
            Conversation
          </button>
          <button
            onClick={() => setTab('lesson')}
            disabled={!hasLesson}
            className="flex-1 py-2 rounded-[8px] text-xs font-medium transition-colors disabled:opacity-40"
            style={{
              fontFamily: 'DM Sans',
              backgroundColor: tab === 'lesson' ? '#FDFBF8' : 'transparent',
              color: tab === 'lesson' ? '#1B4F8A' : '#9E9892',
              boxShadow: tab === 'lesson' ? '0 1px 3px rgba(26,24,20,0.06)' : 'none',
            }}
          >
            Lesson
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'conversation' && (
          <ConversationReview
            messages={messages}
            kanjiLevel={kanjiLevel}
            session={session}
          />
        )}

        {tab === 'lesson' && hasLesson && (
          <LessonReview
            blocks={lessonBlocks}
            blockIndex={blockIndex}
            onNext={() => setBlockIndex((i) => Math.min(i + 1, lessonBlocks.length - 1))}
            onPrev={() => setBlockIndex((i) => Math.max(i - 1, 0))}
          />
        )}

        {tab === 'lesson' && !hasLesson && (
          <div className="text-center py-16 px-6 text-sm" style={{ color: '#9E9892', fontFamily: 'DM Sans' }}>
            No lesson was generated for this conversation.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Conversation review: read-only message bubbles ────────────────────────

function ConversationReview({
  messages,
  kanjiLevel,
  session,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
  kanjiLevel: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
}) {
  return (
    <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
      {messages.length === 0 ? (
        <div className="text-center py-16 text-sm" style={{ color: '#9E9892', fontFamily: 'DM Sans' }}>
          No conversation recorded.
        </div>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages.map((msg: any, i: number) => {
          const role: 'user' | 'assistant' = msg.role === 'assistant' ? 'assistant' : 'user'
          if (role === 'assistant') {
            const { body, romaji, english } = parseCharacterContent(msg.content || '', kanjiLevel)
            return (
              <div key={i} className="flex items-end gap-2 max-w-[85%]">
                <div className="w-9 h-9 rounded-full shrink-0 mb-1 overflow-hidden border-2 border-white shadow-sm">
                  {session?.characterAvatar ? (
                    <Image
                      src={session.characterAvatar}
                      alt=""
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                      quality={90}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: session?.characterColor || '#1B4F8A' }}
                    >
                      {session?.characterName?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div
                  className="bg-[#FDFBF8] px-4 py-3 border border-[#E0DAD2]"
                  style={{ borderRadius: '2px 12px 12px 12px' }}
                >
                  <p
                    className="text-[15px] leading-[2] whitespace-pre-wrap"
                    style={{ fontFamily: 'Noto Sans JP' }}
                  >
                    {renderWithFurigana(body)}
                  </p>
                  {romaji && (
                    <p
                      className="text-[11px] mt-1 leading-relaxed"
                      style={{ fontFamily: 'DM Mono, monospace', color: '#B0B0B0' }}
                    >
                      {romaji}
                    </p>
                  )}
                  {english && (
                    <p className="text-xs mt-1 italic leading-relaxed" style={{ color: '#9E9892' }}>
                      {english}
                    </p>
                  )}
                </div>
              </div>
            )
          }
          // User message
          const userText = stripFurigana(msg.content || '')
          return (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[85%] px-4 py-3 text-white"
                style={{ backgroundColor: '#1B4F8A', borderRadius: '12px 2px 12px 12px' }}
              >
                <p
                  className="text-[15px] leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: 'Noto Sans JP' }}
                >
                  {renderWithFurigana(msg.content || '')}
                </p>
                {/* Stripped form for accessibility fallback (not rendered) */}
                <span className="sr-only">{userText}</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Lesson review: stepper through blocks, completion is a no-op ──────────

function LessonReview({
  blocks,
  blockIndex,
  onNext,
  onPrev,
}: {
  blocks: LessonBlock[]
  blockIndex: number
  onNext: () => void
  onPrev: () => void
}) {
  const block = blocks[blockIndex]
  const total = blocks.length
  const atFirst = blockIndex === 0
  const atLast = blockIndex >= total - 1

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Block stepper */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          disabled={atFirst}
          className="text-xs font-medium px-3 py-1.5 rounded-[8px] border transition-colors disabled:opacity-40"
          style={{
            fontFamily: 'DM Sans',
            borderColor: '#E0DAD2',
            color: '#6B6560',
            backgroundColor: '#FDFBF8',
          }}
        >
          ← Prev
        </button>
        <p
          className="text-[10px] tracking-widest uppercase"
          style={{ fontFamily: 'DM Sans', color: '#9E9892' }}
        >
          Block {blockIndex + 1} of {total}
        </p>
        <button
          onClick={onNext}
          disabled={atLast}
          className="text-xs font-medium px-3 py-1.5 rounded-[8px] transition-colors disabled:opacity-40"
          style={{
            fontFamily: 'DM Sans',
            backgroundColor: atLast ? '#FDFBF8' : '#1B4F8A',
            color: atLast ? '#9E9892' : 'white',
            border: '1px solid',
            borderColor: atLast ? '#E0DAD2' : '#1B4F8A',
          }}
        >
          Next →
        </button>
      </div>

      {/* Block — onComplete becomes a no-op so reviewers don't accidentally
          re-trigger lesson completion. They can use Next to advance. */}
      <BlockRenderer block={block} onComplete={() => { /* review-only */ }} />
    </div>
  )
}
