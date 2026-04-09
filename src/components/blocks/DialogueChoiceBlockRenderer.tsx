'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { DialogueChoiceBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  block: DialogueChoiceBlock
  onComplete: (xp: number) => void
}

interface VocabWord {
  word: string
  reading: string
  romaji: string
  meaning: string
  pos: string
}

// ── POS colors (muted stationery palette) ──────────────────────
const POS_COLORS: Record<string, { underline: string; bg: string; text: string; label: string }> = {
  noun:       { underline: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: '名詞' },
  verb:       { underline: '#8B3A3A', bg: '#F5EEEE', text: '#8B3A3A', label: '動詞' },
  adjective:  { underline: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: '形容詞' },
  adverb:     { underline: '#3D6B4F', bg: '#EFF5F0', text: '#3D6B4F', label: '副詞' },
  particle:   { underline: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: '助詞' },
  phrase:     { underline: '#8B5A6B', bg: '#F5EEF0', text: '#8B5A6B', label: '表現' },
  greeting:   { underline: '#3D6B5A', bg: '#EFF5F2', text: '#3D6B5A', label: '挨拶' },
  expression: { underline: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: '表現' },
}

// ── Furigana helpers ──────────────────────────────────────────
function stripFurigana(text: string): string {
  return text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
}

function renderWithFurigana(text: string, showFurigana: boolean) {
  if (!showFurigana) return <>{stripFurigana(text)}</>
  const parts: React.ReactNode[] = []
  const regex = /([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push(
      <ruby key={match.index}>
        {match[1]}<rp>(</rp><rt className="text-[10px]" style={{ color: '#9E9892' }}>{match[2]}</rt><rp>)</rp>
      </ruby>
    )
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return <>{parts}</>
}

// ── TTS ───────────────────────────────────────────────────────
function playAudio(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(stripFurigana(text))
    u.lang = 'ja-JP'
    u.rate = 0.85
    speechSynthesis.speak(u)
  }
}

// ── Vocab Popup ───────────────────────────────────────────────
function VocabPopup({ word, rect, onClose }: { word: VocabWord; rect: DOMRect; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const posStyle = POS_COLORS[word.pos] || POS_COLORS.noun

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const top = rect.bottom + 8
  const left = Math.max(8, Math.min(rect.left, (typeof window !== 'undefined' ? window.innerWidth : 400) - 268))

  return (
    <div ref={ref} className="fixed z-50 w-64 bg-[#FDFBF8] rounded-[8px] overflow-hidden border border-[#E0DAD2]" style={{ top, left, boxShadow: '0 1px 4px rgba(26,24,20,0.08)' }}>
      <div className="h-1 w-full" style={{ backgroundColor: posStyle.underline }} />
      <div className="p-3.5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-2xl font-normal" style={{ fontFamily: 'Noto Sans JP', color: '#1A1814' }}>{stripFurigana(word.word)}</p>
            <p className="text-xs mt-0.5" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>{word.reading}</p>
            <p className="text-[10px] font-mono" style={{ color: '#9E9892' }}>{word.romaji}</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: posStyle.bg, color: posStyle.text }}>
            {posStyle.label}
          </span>
        </div>
        <p className="text-sm font-semibold" style={{ color: '#1A1814' }}>{word.meaning}</p>
      </div>
    </div>
  )
}

// ── Dialogue text with clickable vocab words ──────────────────
function DialogueText({ text, vocab, showFurigana, onWordClick }: {
  text: string
  vocab?: VocabWord[]
  showFurigana: boolean
  onWordClick: (word: VocabWord, rect: DOMRect) => void
}) {
  if (!vocab || vocab.length === 0) {
    return <span style={{ fontFamily: 'Noto Sans JP' }}>{renderWithFurigana(text, showFurigana)}</span>
  }

  const plainText = stripFurigana(text)

  type Segment = { text: string; isVocab: false } | { text: string; isVocab: true; vocabData: VocabWord }
  const segments: Segment[] = []

  const vocabWithPos = vocab
    .map(v => ({ ...v, plain: stripFurigana(v.word), idx: plainText.indexOf(stripFurigana(v.word)) }))
    .filter(v => v.idx >= 0)
    .sort((a, b) => a.idx - b.idx || b.plain.length - a.plain.length)

  let cursor = 0
  for (const v of vocabWithPos) {
    if (v.idx < cursor) continue
    if (v.idx > cursor) segments.push({ text: plainText.slice(cursor, v.idx), isVocab: false })
    segments.push({ text: v.plain, isVocab: true, vocabData: v })
    cursor = v.idx + v.plain.length
  }
  if (cursor < plainText.length) segments.push({ text: plainText.slice(cursor), isVocab: false })

  return (
    <span style={{ fontFamily: 'Noto Sans JP' }}>
      {segments.map((seg, i) => {
        if (!seg.isVocab) {
          return <span key={i}>{showFurigana ? renderWithFurigana(findOriginal(text, seg.text), showFurigana) : seg.text}</span>
        }
        const posStyle = POS_COLORS[seg.vocabData.pos] || POS_COLORS.noun
        return (
          <span
            key={i}
            onClick={(e) => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); onWordClick(seg.vocabData, rect) }}
            className="cursor-pointer transition-colors rounded-sm px-[1px] hover:opacity-80"
            style={{ borderBottom: `2px solid ${posStyle.underline}`, paddingBottom: '1px' }}
          >
            {showFurigana ? renderWithFurigana(seg.vocabData.word, true) : seg.text}
          </span>
        )
      })}
    </span>
  )
}

function findOriginal(originalText: string, plainChunk: string): string {
  const regex = new RegExp(
    plainChunk.split('').map(c => /[一-龥々]/.test(c) ? c + '(?:\\([ぁ-んァ-ヶー]+\\))?' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')
  )
  const match = originalText.match(regex)
  return match ? match[0] : plainChunk
}

// ── Character Avatar ──────────────────────────────────────────
function CharAvatar({ character, size = 40 }: { character: { avatar?: string; emoji: string; color: string; name: string }; size?: number }) {
  if (character.avatar) {
    return (
      <div className="rounded-full overflow-hidden shrink-0 border border-[#E0DAD2]" style={{ width: size, height: size }}>
        <Image src={character.avatar} alt={character.name} width={size} height={size} className="w-full h-full object-cover" quality={90} />
      </div>
    )
  }
  return (
    <div className="rounded-full flex items-center justify-center text-xl shrink-0" style={{ width: size, height: size, backgroundColor: character.color + '1A', border: `1px solid ${character.color}44` }}>
      {character.emoji}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export function DialogueChoiceBlockRenderer({ block, onComplete }: Props) {
  const globalShowFurigana = useAppStore((s) => s.showFurigana)
  const globalShowTranslation = useAppStore((s) => s.showTranslation)

  const [showFurigana, setShowFurigana] = useState(true)
  const [showRomaji, setShowRomaji] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const [showCoachNotes, setShowCoachNotes] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [activeVocab, setActiveVocab] = useState<VocabWord | null>(null)
  const [vocabRect, setVocabRect] = useState<DOMRect | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({}) // index -> selected option text

  useEffect(() => {
    setShowFurigana(globalShowFurigana)
    setShowTranslation(globalShowTranslation)
  }, [globalShowFurigana, globalShowTranslation])

  const current = block.exchanges[currentIndex]
  const isCorrect = current?.options.find(o => o.id === selected)?.isCorrect

  const handleSelect = (optId: string, optText: string, correct: boolean) => {
    if (revealed) return
    setSelected(optId)
    setRevealed(true)
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optText }))
    if (correct) { setScore(s => s + 1); playAudio(current.line) }
  }

  const handleNext = () => {
    if (currentIndex < block.exchanges.length - 1) {
      setCurrentIndex(i => i + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setDone(true)
    }
  }

  if (done) return (
    <div className="text-center space-y-4 page-enter">
      <div className="text-5xl">{score === block.exchanges.length ? '⭐' : '👍'}</div>
      <p className="font-semibold text-2xl text-[#1B4F8A]">{score}/{block.exchanges.length} understood</p>
      <Button variant="primary" size="lg" fullWidth onClick={() => onComplete(block.xpReward)}>
        Continue +{block.xpReward} XP
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* ── Toggle pills ── */}
      <div className="flex items-center gap-1.5 justify-center">
        {[
          { key: 'furigana', label: 'ふりがな', active: showFurigana, toggle: () => setShowFurigana(p => !p) },
          { key: 'romaji', label: 'romaji', active: showRomaji, toggle: () => setShowRomaji(p => !p) },
          { key: 'coach', label: '💡', active: showCoachNotes, toggle: () => setShowCoachNotes(p => !p) },
        ].map(t => (
          <button
            key={t.key}
            onClick={t.toggle}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${t.active ? 'bg-[#EBF0F8] border-[#1B4F8A] text-[#1B4F8A]' : 'bg-transparent border-[#E0DAD2] text-[#9E9892]'}`}
            style={{ fontFamily: t.key === 'furigana' ? 'Noto Sans JP' : undefined }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Setting */}
      {currentIndex === 0 && current.setting && (
        <div className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[8px] p-3 text-center">
          <p className="text-xs font-semibold text-[#6B6560]">📍 {current.setting}</p>
        </div>
      )}

      {/* ── Chat thread — character left, user right ── */}
      <div className="space-y-3">
        {/* Previous exchanges as chat bubbles */}
        {block.exchanges.slice(0, currentIndex).map((ex, i) => (
          <div key={`prev-${i}`} className="space-y-2 opacity-50">
            {/* Character bubble — left */}
            <div className="flex items-end gap-2 max-w-[85%]">
              <CharAvatar character={ex.character} size={28} />
              <div className="bg-[#FDFBF8] px-3 py-2 border border-[#E0DAD2]" style={{ borderRadius: '2px 12px 12px 12px' }}>
                <p className="text-sm" style={{ fontFamily: 'Noto Sans JP' }}>{stripFurigana(ex.line)}</p>
              </div>
            </div>
            {/* User answer — right */}
            {userAnswers[i] && (
              <div className="flex justify-end">
                <div className="max-w-[75%] px-3 py-2 text-white text-sm font-semibold" style={{ backgroundColor: '#1B4F8A', borderRadius: '12px 2px 12px 12px' }}>
                  {userAnswers[i]}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Current character message — left, full detail */}
        <div className="flex items-end gap-2.5 max-w-[90%]">
          <CharAvatar character={current.character} size={36} />
          <div className="flex-1">
            <p className="text-[11px] font-semibold mb-1 ml-1 uppercase tracking-[0.08em]" style={{ color: '#9E9892' }}>
              {current.character.name}
            </p>
            <div className="bg-[#FDFBF8] border border-[#E0DAD2] p-4" style={{ borderRadius: '2px 12px 12px 12px' }}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-lg font-normal leading-[2]">
                    <DialogueText
                      text={current.line}
                      vocab={current.vocab}
                      showFurigana={showFurigana}
                      onWordClick={(w, r) => { setActiveVocab(activeVocab?.word === w.word ? null : w); setVocabRect(r) }}
                    />
                  </p>
                  {showRomaji && (
                    <p className="text-[11px] mt-1 font-mono" style={{ color: '#9E9892' }}>{current.lineRomaji}</p>
                  )}
                  {showTranslation && current.lineEN && (
                    <p className="text-xs mt-1 italic" style={{ color: '#9E9892' }}>{current.lineEN}</p>
                  )}
                </div>
                <button
                  onClick={() => playAudio(current.line)}
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#FDFBF8] text-[#9E9892] hover:bg-[#EBF0F8] hover:text-[#1B4F8A] border border-[#E0DAD2] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question — left aligned */}
      <p className="text-xs font-semibold" style={{ color: '#9E9892' }}>{current.question}</p>

      {/* Options — compact cards */}
      <div className="space-y-1.5">
        {current.options.map((opt, idx) => {
          const isSelected = selected === opt.id
          let cardStyle = 'bg-[#FDFBF8] border border-[#E0DAD2]'
          if (revealed && opt.isCorrect) cardStyle = 'bg-[#EFF5F0] border border-[#B8D4C0]'
          else if (revealed && isSelected && !opt.isCorrect) cardStyle = 'bg-[#F5EEEE] border border-[#D4BABA]'

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id, opt.text, opt.isCorrect)}
              disabled={revealed}
              className={`w-full text-left px-3.5 py-2.5 rounded-[8px] transition-all active:translate-y-px option-card-enter disabled:opacity-60 ${cardStyle} ${isSelected ? 'scale-[0.98]' : ''}`}
              style={{ animationDelay: `${idx * 120}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: revealed && opt.isCorrect ? '#3D6B4F' : revealed && isSelected ? '#8B3A3A' : '#B8CBE0' }} />
                <span className="text-sm font-semibold" style={{ color: revealed && opt.isCorrect ? '#3D6B4F' : revealed && isSelected && !opt.isCorrect ? '#8B3A3A' : '#1A1814' }}>
                  {opt.text}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Feedback + cultural hint */}
      {revealed && (
        <div className={`rounded-[8px] p-4 border page-enter ${isCorrect ? 'bg-[#EFF5F0] border-[#B8D4C0]' : 'bg-[#F5EEEE] border-[#D4BABA]'}`}>
          <p className={`font-semibold mb-1 ${isCorrect ? 'text-[#3D6B4F]' : 'text-[#8B3A3A]'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </p>
          {current.explanation && (
            <p className={`text-sm ${isCorrect ? 'text-[#3D6B4F]' : 'text-[#8B3A3A]'}`}>{current.explanation}</p>
          )}
          {isCorrect && showCoachNotes && current.culturalHint && (
            <div className="mt-3 px-3.5 py-2 bg-transparent border-l-[2px] border-[#1B4F8A]/30">
              <p className="text-[13px] leading-relaxed italic text-[#6B6560]">
                ↳ {renderWithFurigana(current.culturalHint, showFurigana)}
              </p>
            </div>
          )}
        </div>
      )}

      {revealed && (
        <Button variant={isCorrect ? 'correct' : 'primary'} size="lg" fullWidth onClick={handleNext}>
          {currentIndex < block.exchanges.length - 1 ? 'Next →' : `Finish +${block.xpReward} XP`}
        </Button>
      )}

      {/* Vocab popup */}
      {activeVocab && vocabRect && (
        <VocabPopup word={activeVocab} rect={vocabRect} onClose={() => { setActiveVocab(null); setVocabRect(null) }} />
      )}
    </div>
  )
}

export default DialogueChoiceBlockRenderer
