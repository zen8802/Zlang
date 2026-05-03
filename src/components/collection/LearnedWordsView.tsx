'use client'

import { useState, useEffect, useMemo } from 'react'

interface LearnedWord {
  id: string
  japanese: string
  reading: string
  romaji: string
  english: string
  part_of_speech?: string
  example_jp?: string
  example_romaji?: string
  example_en?: string
  jlpt_level?: string
  source_scenario_title?: string
  learned_at: string
}

type SortMode = 'recent' | 'noun' | 'verb' | 'adjective' | 'adverb' | 'expression' | 'all'

const POS_THEME: Record<string, { accent: string; bg: string; text: string; label: string; jp: string }> = {
  noun:         { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'noun',       jp: '名詞' },
  'proper noun':{ accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'noun',       jp: '名詞' },
  verb:         { accent: '#8B3A3A', bg: '#F5EEEE', text: '#8B3A3A', label: 'verb',       jp: '動詞' },
  'i-adjective':{ accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective',  jp: '形容詞' },
  'na-adjective':{ accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective', jp: '形容詞' },
  adjective:    { accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective',  jp: '形容詞' },
  adverb:       { accent: '#3D6B4F', bg: '#EFF5F0', text: '#3D6B4F', label: 'adverb',     jp: '副詞' },
  expression:   { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'expression', jp: '表現' },
  phrase:       { accent: '#8B5A6B', bg: '#F5EEF0', text: '#8B5A6B', label: 'phrase',      jp: '表現' },
  greeting:     { accent: '#3D6B5A', bg: '#EFF5F2', text: '#3D6B5A', label: 'greeting',    jp: '挨拶' },
  particle:     { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'particle',    jp: '助詞' },
  pronoun:      { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'pronoun',     jp: '代名詞' },
  counter:      { accent: '#6366F1', bg: '#EEF2FF', text: '#4F46E5', label: 'counter',     jp: '助数詞' },
}

const DEFAULT_THEME = { accent: '#9E9892', bg: '#F5F0EB', text: '#6B6560', label: 'word', jp: '言葉' }

const FILTER_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'all', label: 'All' },
  { key: 'noun', label: 'Nouns' },
  { key: 'verb', label: 'Verbs' },
  { key: 'adjective', label: 'Adj.' },
  { key: 'adverb', label: 'Adv.' },
  { key: 'expression', label: 'Expr.' },
]

function renderJapanese(text: string) {
  const regex = /([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g
  if (!regex.test(text)) return text
  regex.lastIndex = 0

  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rp>(</rp>
        <rt style={{ fontSize: '0.55em', fontWeight: 400, color: '#9E9892', letterSpacing: '0.05em' }}>{match[2]}</rt>
        <rp>)</rp>
      </ruby>,
    )
    last = regex.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function WordCard({ word, isExpanded, onToggle }: {
  word: LearnedWord
  isExpanded: boolean
  onToggle: () => void
}) {
  const theme = POS_THEME[word.part_of_speech || ''] || DEFAULT_THEME

  return (
    <div
      className="rounded-[12px] overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: '#FDFBF8',
        border: `1.5px solid ${isExpanded ? theme.accent + '30' : '#E0DAD2'}`,
        boxShadow: isExpanded
          ? `0 4px 16px ${theme.accent}10`
          : '0 1px 3px rgba(26,24,20,0.04)',
      }}
    >
      <div style={{ height: '2.5px', backgroundColor: theme.accent, opacity: 0.6 }} />

      <button onClick={onToggle} className="w-full text-left px-3.5 py-3">
        {/* Word */}
        <p style={{
          fontFamily: 'Noto Sans JP',
          fontSize: '20px',
          fontWeight: 300,
          color: '#1A1814',
          lineHeight: 1.4,
        }}>
          {renderJapanese(word.japanese)}
        </p>

        {/* Romaji */}
        {word.romaji && (
          <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: '#C8C3BC', marginTop: '1px' }}>
            {word.romaji}
          </p>
        )}

        {/* English */}
        {word.english && (
          <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#6B6560', marginTop: '4px', lineHeight: 1.3 }}>
            {word.english}
          </p>
        )}

        {/* POS pill */}
        <div className="flex items-center justify-between mt-2.5">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
            style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: 'DM Sans' }}
          >
            {theme.jp} · {theme.label}
          </span>
          <span className="text-[9px]" style={{ color: '#C8C3BC', fontFamily: 'DM Sans' }}>
            {timeAgo(word.learned_at)}
          </span>
        </div>
      </button>

      {/* Expanded: example sentence */}
      {isExpanded && word.example_jp && (
        <div className="px-3.5 py-3" style={{ backgroundColor: '#FAFAF8', borderTop: `1px solid ${theme.accent}10` }}>
          <span className="text-[8px] font-semibold tracking-widest uppercase block mb-1.5" style={{ color: theme.accent, fontFamily: 'DM Sans' }}>
            Example
          </span>
          <p style={{ fontFamily: 'Noto Sans JP', fontSize: '14px', color: '#1A1814', fontWeight: 300, lineHeight: 2 }}>
            {renderJapanese(word.example_jp)}
          </p>
          {word.example_romaji && (
            <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: '#B0B0B0', marginTop: '2px' }}>
              {word.example_romaji}
            </p>
          )}
          {word.example_en && (
            <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: '#9E9892', marginTop: '3px', fontStyle: 'italic' }}>
              {word.example_en}
            </p>
          )}
        </div>
      )}

      {/* Expanded: source */}
      {isExpanded && word.source_scenario_title && (
        <div className="px-3.5 py-2" style={{ borderTop: `1px solid ${theme.accent}10` }}>
          <p className="text-[9px]" style={{ color: '#C8C3BC', fontFamily: 'DM Sans' }}>
            from {word.source_scenario_title}
          </p>
        </div>
      )}
    </div>
  )
}

export default function LearnedWordsView() {
  const [words, setWords] = useState<LearnedWord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SortMode>('recent')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/learned-words')
      .then((r) => r.json())
      .then((d) => { setWords(d.words || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'recent' || filter === 'all') return words

    const posMatch: Record<string, string[]> = {
      noun: ['noun', 'proper noun', 'pronoun', '名詞', '代名詞', '固有名詞'],
      verb: ['verb', '動詞'],
      adjective: ['adjective', 'i-adjective', 'na-adjective', '形容詞'],
      adverb: ['adverb', '副詞'],
      expression: ['expression', 'phrase', 'greeting', '表現', '挨拶'],
    }

    const matches = posMatch[filter] || []
    return words.filter((w) => matches.includes(w.part_of_speech || ''))
  }, [words, filter])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-20 px-8">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EFF5F0' }}>
          <span className="text-2xl">📖</span>
        </div>
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '20px', color: '#1A1814' }}>
          No words learned yet
        </p>
        <p className="text-[13px] mt-2 leading-relaxed max-w-[260px] mx-auto" style={{ fontFamily: 'DM Sans', color: '#9E9892' }}>
          Complete a conversation and its lesson to start building your learned words library.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-medium" style={{ fontFamily: 'DM Mono', color: '#C8C3BC' }}>
          {words.length} {words.length === 1 ? 'word' : 'words'} learned
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 px-1 -mx-1">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
              style={{
                fontFamily: 'DM Sans',
                backgroundColor: active ? '#1A1814' : '#F5F0EB',
                color: active ? '#FDFBF8' : '#9E9892',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Word grid — 2 columns */}
      {filtered.length === 0 ? (
        <p className="text-center py-8 text-[13px]" style={{ fontFamily: 'DM Sans', color: '#9E9892' }}>
          No {filter} words yet
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              isExpanded={expandedId === word.id}
              onToggle={() => setExpandedId(expandedId === word.id ? null : word.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
