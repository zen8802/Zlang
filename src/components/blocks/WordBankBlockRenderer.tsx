'use client'

import { useMemo, useState, useEffect } from 'react'
import type { WordBankBlock, WordBankSentence } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: WordBankBlock
  onComplete: (xp: number) => void
}

type FeedbackState = 'idle' | 'correct' | 'wrong'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function playTTS(text: string, rate = 0.8) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = rate
    speechSynthesis.speak(u)
  }
}

export default function WordBankBlockRenderer({ block, onComplete }: Props) {
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [assembled, setAssembled] = useState<string[]>([])
  const [usedTileIds, setUsedTileIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [done, setDone] = useState(false)

  const sentence: WordBankSentence = block.sentences[sentenceIndex]

  // Shuffle once per sentence, keyed on id
  const shuffledTiles = useMemo(
    () => shuffle(sentence.tiles),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sentence.id],
  )

  // Expected slot count = number of non-distractor tiles
  const expectedTiles = useMemo(
    () => sentence.tiles.filter(t => !t.isDistractor),
    [sentence.id], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const slotCount = expectedTiles.length

  // Auto-check when assembled reaches full length
  useEffect(() => {
    if (feedback !== 'idle') return
    if (assembled.length === 0) return
    if (assembled.length !== slotCount) return

    const joined = assembled.join('')
    if (joined === sentence.answer) {
      setFeedback('correct')
      setTimeout(() => playTTS(sentence.answer), 150)
      const t = setTimeout(() => {
        // keep the correct state visible; Continue button handles advance
      }, 1500)
      return () => clearTimeout(t)
    } else {
      setFeedback('wrong')
      const t = setTimeout(() => {
        setAssembled([])
        setUsedTileIds([])
        setFeedback('idle')
      }, 800)
      return () => clearTimeout(t)
    }
  }, [assembled, slotCount, sentence.answer, feedback])

  const handleTileTap = (tileId: string, text: string) => {
    if (feedback !== 'idle') return
    if (usedTileIds.includes(tileId)) return
    if (assembled.length >= slotCount) return
    setAssembled(prev => [...prev, text])
    setUsedTileIds(prev => [...prev, tileId])
  }

  const handleBackspace = () => {
    if (feedback !== 'idle') return
    if (assembled.length === 0) return
    setAssembled(prev => prev.slice(0, -1))
    setUsedTileIds(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    if (feedback !== 'idle') return
    setAssembled([])
    setUsedTileIds([])
  }

  const handleContinue = () => {
    if (sentenceIndex < block.sentences.length - 1) {
      setSentenceIndex(i => i + 1)
      setAssembled([])
      setUsedTileIds([])
      setFeedback('idle')
    } else {
      setDone(true)
    }
  }

  // ── DONE STATE ─────────────────────────────────────────
  if (done) {
    return (
      <div className="ink-in space-y-6 text-center">
        <div className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] p-8 space-y-6">
          <p
            className="text-2xl text-[#1A1814]"
            style={{ fontFamily: 'Shippori Mincho, serif', fontWeight: 600 }}
          >
            {block.title || 'Nice work'}
          </p>
          {block.targetPhrase && (
            <p
              className="text-[#1A1814]"
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontWeight: 400,
                fontSize: '56px',
                lineHeight: 1.1,
              }}
            >
              {block.targetPhrase}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => onComplete(block.xpReward)}
        >
          Continue +{block.xpReward} XP
        </Button>
      </div>
    )
  }

  // ── MAIN RENDER ────────────────────────────────────────
  const containerBg =
    feedback === 'correct' ? '#EFF5F0' : feedback === 'wrong' ? '#F5EEEE' : '#FDFBF8'
  const containerBorder =
    feedback === 'correct' ? '#B8D4C0' : feedback === 'wrong' ? '#D4BABA' : '#E0DAD2'

  return (
    <div className="space-y-5">
      {/* Progress dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {block.sentences.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === sentenceIndex ? 20 : 6,
                backgroundColor:
                  i < sentenceIndex
                    ? '#3D6B4F'
                    : i === sentenceIndex
                      ? '#1B4F8A'
                      : '#E0DAD2',
              }}
            />
          ))}
        </div>
        <span
          className="text-xs text-[#9E9892] font-semibold tracking-wider uppercase"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {sentenceIndex + 1} / {block.sentences.length}
        </span>
      </div>

      {block.instruction && (
        <p
          className="text-center text-xs text-[#9E9892] tracking-wider uppercase"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {block.instruction}
        </p>
      )}

      {/* Main card */}
      <div
        key={`sentence-${sentence.id}-${feedback}`}
        className={`ink-in rounded-[10px] border p-6 space-y-5 transition-colors ${
          feedback === 'wrong' ? 'shake' : ''
        }`}
        style={{ backgroundColor: containerBg, borderColor: containerBorder }}
      >
        {/* Prompt */}
        <p
          className="text-center text-[#1A1814] text-lg leading-snug"
          style={{ fontFamily: 'Shippori Mincho, serif', fontWeight: 600 }}
        >
          {sentence.prompt}
        </p>

        {/* Assembled area — slot row */}
        <div className="flex flex-wrap items-end justify-center gap-2 min-h-[64px]">
          {Array.from({ length: slotCount }).map((_, i) => {
            const val = assembled[i]
            return (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{ minWidth: 44, minHeight: 52 }}
              >
                {val ? (
                  <span
                    className="text-[#1A1814]"
                    style={{
                      fontFamily: 'Noto Sans JP, sans-serif',
                      fontWeight: 400,
                      fontSize: '32px',
                      lineHeight: 1,
                    }}
                  >
                    {val}
                  </span>
                ) : (
                  <span
                    className="inline-block"
                    style={{
                      width: 32,
                      height: 2,
                      backgroundColor: '#C8C3BC',
                      opacity: 0.5,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Feedback pill */}
        {feedback !== 'idle' && (
          <div className="flex justify-center">
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                width: 32,
                height: 32,
                backgroundColor: feedback === 'correct' ? '#B8D4C0' : '#D4BABA',
                color: feedback === 'correct' ? '#2E5C3A' : '#8B3A3A',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {feedback === 'correct' ? '✓' : '✗'}
            </span>
          </div>
        )}

        {/* Explanation on correct */}
        {feedback === 'correct' && sentence.explanation && (
          <p
            className="text-center text-xs text-[#6B6560] italic"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {sentence.explanation}
          </p>
        )}

        {/* Tile palette */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {shuffledTiles.map(tile => {
            const used = usedTileIds.includes(tile.id)
            return (
              <button
                key={tile.id}
                onClick={() => handleTileTap(tile.id, tile.text)}
                disabled={used || feedback !== 'idle'}
                className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] transition-all active:translate-y-px"
                style={{
                  padding: '12px 16px',
                  fontFamily: 'Noto Sans JP, sans-serif',
                  fontWeight: 400,
                  fontSize: '24px',
                  color: '#1A1814',
                  opacity: used ? 0.3 : 1,
                  cursor: used || feedback !== 'idle' ? 'default' : 'pointer',
                  pointerEvents: used ? 'none' : undefined,
                }}
              >
                {tile.text}
              </button>
            )
          })}
        </div>

        {/* Control row */}
        {feedback === 'idle' && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={handleBackspace}
              disabled={assembled.length === 0}
              className="text-xs font-medium px-3 py-1.5 rounded-[6px] border border-[#E0DAD2] bg-[#FDFBF8] text-[#1A1814] hover:bg-[#F5F0EB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              ← Backspace
            </button>
            <button
              onClick={handleClear}
              disabled={assembled.length === 0}
              className="text-xs font-medium px-3 py-1.5 rounded-[6px] text-[#9E9892] hover:text-[#1A1814] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Continue button (only on correct) */}
      {feedback === 'correct' && (
        <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
          Continue →
        </Button>
      )}
    </div>
  )
}
