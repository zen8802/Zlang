'use client'

import { useState, useEffect } from 'react'

interface PhrasebookEntry {
  id: string
  save_type: string
  japanese: string
  reading: string
  romaji: string
  english: string
  part_of_speech?: string
  english_alts?: string[]
  example_jp?: string
  example_romaji?: string
  example_en?: string
  jlpt_level?: string
  source_scenario_title?: string
  source_character_name?: string
  user_note?: string
  created_at: string
}

const POS_THEME: Record<string, { accent: string; bg: string; text: string; label: string; jp: string }> = {
  noun:         { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'noun',        jp: '名詞' },
  'proper noun':{ accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'proper noun', jp: '固有名詞' },
  verb:         { accent: '#8B3A3A', bg: '#F5EEEE', text: '#8B3A3A', label: 'verb',        jp: '動詞' },
  'i-adjective':{ accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective',   jp: '形容詞' },
  'na-adjective':{ accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective',  jp: '形容詞' },
  adjective:    { accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective',   jp: '形容詞' },
  adverb:       { accent: '#3D6B4F', bg: '#EFF5F0', text: '#3D6B4F', label: 'adverb',      jp: '副詞' },
  expression:   { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'expression',  jp: '表現' },
  phrase:       { accent: '#8B5A6B', bg: '#F5EEF0', text: '#8B5A6B', label: 'phrase',       jp: '表現' },
  greeting:     { accent: '#3D6B5A', bg: '#EFF5F2', text: '#3D6B5A', label: 'greeting',     jp: '挨拶' },
  particle:     { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'particle',     jp: '助詞' },
  pronoun:      { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'pronoun',      jp: '代名詞' },
  counter:      { accent: '#6366F1', bg: '#EEF2FF', text: '#4F46E5', label: 'counter',      jp: '助数詞' },
  // Japanese POS values (from older saves)
  '名詞':       { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'noun',        jp: '名詞' },
  '動詞':       { accent: '#8B3A3A', bg: '#F5EEEE', text: '#8B3A3A', label: 'verb',        jp: '動詞' },
  '形容詞':     { accent: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: 'adjective',   jp: '形容詞' },
  '副詞':       { accent: '#3D6B4F', bg: '#EFF5F0', text: '#3D6B4F', label: 'adverb',      jp: '副詞' },
  '助詞':       { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'particle',    jp: '助詞' },
  '代名詞':     { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'pronoun',     jp: '代名詞' },
  '表現':       { accent: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: 'expression',  jp: '表現' },
  '挨拶':       { accent: '#3D6B5A', bg: '#EFF5F2', text: '#3D6B5A', label: 'greeting',    jp: '挨拶' },
  '助数詞':     { accent: '#6366F1', bg: '#EEF2FF', text: '#4F46E5', label: 'counter',     jp: '助数詞' },
  '固有名詞':   { accent: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: 'proper noun', jp: '固有名詞' },
}

const DEFAULT_THEME = { accent: '#9E9892', bg: '#F5F0EB', text: '#6B6560', label: 'word', jp: '言葉' }

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(entries: PhrasebookEntry[]) {
  const groups: { label: string; entries: PhrasebookEntry[] }[] = []
  let currentLabel = ''
  let currentGroup: PhrasebookEntry[] = []

  for (const entry of entries) {
    const label = formatDate(entry.created_at)
    if (label !== currentLabel) {
      if (currentGroup.length > 0) groups.push({ label: currentLabel, entries: currentGroup })
      currentLabel = label
      currentGroup = [entry]
    } else {
      currentGroup.push(entry)
    }
  }
  if (currentGroup.length > 0) groups.push({ label: currentLabel, entries: currentGroup })
  return groups
}

/**
 * Render Japanese text with proper ruby furigana.
 * Handles patterns like 何(なに) → <ruby>何<rt>なに</rt></ruby>
 */
function renderJapanese(text: string, reading?: string) {
  // Check for inline furigana pattern: kanji(reading)
  const furiganaRegex = /([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g
  if (furiganaRegex.test(text)) {
    furiganaRegex.lastIndex = 0
    const parts: React.ReactNode[] = []
    let last = 0
    let match: RegExpExecArray | null
    while ((match = furiganaRegex.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index))
      parts.push(
        <ruby key={match.index}>
          {match[1]}
          <rp>(</rp>
          <rt style={{ fontSize: '0.55em', fontWeight: 400, color: '#9E9892', letterSpacing: '0.05em' }}>{match[2]}</rt>
          <rp>)</rp>
        </ruby>,
      )
      last = furiganaRegex.lastIndex
    }
    if (last < text.length) parts.push(text.slice(last))
    return <>{parts}</>
  }

  // Check if text has kanji and we have a reading — show reading as furigana
  const hasKanji = /[一-龥々]/.test(text)
  if (hasKanji && reading && reading !== text) {
    return (
      <ruby>
        {text}
        <rp>(</rp>
        <rt style={{ fontSize: '0.55em', fontWeight: 400, color: '#9E9892', letterSpacing: '0.05em' }}>{reading}</rt>
        <rp>)</rp>
      </ruby>
    )
  }

  return text
}

function WordCard({ entry, isExpanded, onToggle, onDelete }: {
  entry: PhrasebookEntry
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const theme = POS_THEME[entry.part_of_speech || ''] || DEFAULT_THEME

  return (
    <div
      className="rounded-[14px] overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: '#FDFBF8',
        border: `1.5px solid ${isExpanded ? theme.accent + '30' : '#E0DAD2'}`,
        boxShadow: isExpanded
          ? `0 4px 20px ${theme.accent}10, 0 1px 3px rgba(26,24,20,0.04)`
          : '0 1px 3px rgba(26,24,20,0.04)',
      }}
    >
      {/* Color accent strip */}
      <div style={{ height: '3px', backgroundColor: theme.accent, opacity: 0.7 }} />

      {/* Main card face */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: word + meaning */}
          <div className="flex-1 min-w-0">
            {/* Japanese word with furigana */}
            <p style={{
              fontFamily: 'Noto Sans JP',
              fontSize: '26px',
              fontWeight: 300,
              color: '#1A1814',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}>
              {renderJapanese(entry.japanese, entry.reading)}
            </p>

            {/* Romaji */}
            {entry.romaji && (
              <p style={{
                fontFamily: 'DM Mono',
                fontSize: '11px',
                color: '#C8C3BC',
                marginTop: '2px',
                letterSpacing: '0.03em',
              }}>
                {entry.romaji}
              </p>
            )}

            {/* English meaning */}
            {entry.english && (
              <p style={{
                fontFamily: 'DM Sans',
                fontSize: '14px',
                color: '#6B6560',
                marginTop: '6px',
                lineHeight: 1.4,
              }}>
                {entry.english}
              </p>
            )}
          </div>

          {/* Right: POS pill */}
          <div className="shrink-0 flex flex-col items-end gap-1.5 pt-1">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide"
              style={{
                backgroundColor: theme.bg,
                color: theme.text,
                fontFamily: 'DM Sans',
              }}
            >
              {theme.jp} · {theme.label}
            </span>
            {entry.jlpt_level && entry.jlpt_level !== 'none' && (
              <span
                className="text-[9px] font-medium tracking-wider"
                style={{ color: '#C8C3BC', fontFamily: 'DM Mono' }}
              >
                {entry.jlpt_level}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${theme.accent}15` }}>
          {/* Alt meanings */}
          {entry.english_alts && entry.english_alts.length > 0 && (
            <div className="px-5 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: theme.accent, fontFamily: 'DM Sans' }}>
                  Also means
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.accent + '15' }} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.english_alts.map((alt, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[11px]"
                    style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: 'DM Sans' }}
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Example sentence with proper furigana */}
          {entry.example_jp && (
            <div className="px-5 py-3" style={{ backgroundColor: '#FAFAF8', borderTop: `1px solid ${theme.accent}10` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: theme.accent, fontFamily: 'DM Sans' }}>
                  Example
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.accent + '15' }} />
              </div>
              <p style={{ fontFamily: 'Noto Sans JP', fontSize: '15px', color: '#1A1814', fontWeight: 300, lineHeight: 2 }}>
                {renderJapanese(entry.example_jp)}
              </p>
              {entry.example_romaji && (
                <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#B0B0B0', marginTop: '2px' }}>
                  {entry.example_romaji}
                </p>
              )}
              {entry.example_en && (
                <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#9E9892', marginTop: '4px', fontStyle: 'italic' }}>
                  {entry.example_en}
                </p>
              )}
            </div>
          )}

          {/* Footer: source + actions */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: `1px solid ${theme.accent}10` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {entry.source_scenario_title && (
                <p className="text-[10px] truncate" style={{ color: '#C8C3BC', fontFamily: 'DM Sans' }}>
                  {entry.source_scenario_title}
                  {entry.source_character_name && ` · ${entry.source_character_name}`}
                </p>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="text-[10px] font-medium px-2 py-1 rounded-md transition-colors hover:bg-[#F5EEEE] hover:text-[#8B3A3A]"
              style={{ color: '#C8C3BC', fontFamily: 'DM Sans' }}
            >
              remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PhrasebookView() {
  const [entries, setEntries] = useState<PhrasebookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/phrasebook')
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    if (expandedId === id) setExpandedId(null)
    await fetch(`/api/phrasebook/${id}`, { method: 'DELETE' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 px-8">
        <div
          className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#EBF0F8' }}
        >
          <span className="text-2xl">📓</span>
        </div>
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '20px', color: '#1A1814', letterSpacing: '-0.01em' }}>
          Your phrasebook is empty
        </p>
        <p className="text-[13px] mt-2 leading-relaxed max-w-[240px] mx-auto" style={{ fontFamily: 'DM Sans', color: '#9E9892' }}>
          Tap any underlined word during a conversation to see its definition and save it here.
        </p>
      </div>
    )
  }

  const groups = groupByDate(entries)

  return (
    <div className="space-y-8 pb-4">
      {/* Word count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-medium" style={{ fontFamily: 'DM Mono', color: '#C8C3BC' }}>
          {entries.length} {entries.length === 1 ? 'word' : 'words'} saved
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.label}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <p
              className="text-[10px] font-semibold tracking-[0.16em] uppercase shrink-0"
              style={{ fontFamily: 'DM Sans', color: '#9E9892' }}
            >
              {group.label}
            </p>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E0DAD2' }} />
            <p className="text-[10px] shrink-0" style={{ fontFamily: 'DM Mono', color: '#C8C3BC' }}>
              {group.entries.length}
            </p>
          </div>

          <div className="space-y-3">
            {group.entries.map((entry) => (
              <WordCard
                key={entry.id}
                entry={entry}
                isExpanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
