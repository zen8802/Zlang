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
  example_en?: string
  jlpt_level?: string
  source_scenario_title?: string
  source_character_name?: string
  user_note?: string
  created_at: string
}

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  noun: { bg: '#EBF0F8', text: '#1B4F8A' },
  'proper noun': { bg: '#EBF0F8', text: '#1B4F8A' },
  verb: { bg: '#EFF5F0', text: '#3D6B4F' },
  'i-adjective': { bg: '#FEF3C7', text: '#92400E' },
  'na-adjective': { bg: '#FEF3C7', text: '#92400E' },
  adverb: { bg: '#F5F0EB', text: '#6B6560' },
  expression: { bg: '#F0EEFF', text: '#5B21B6' },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(entries: PhrasebookEntry[]) {
  const groups: { label: string; entries: PhrasebookEntry[] }[] = []
  let currentLabel = ''
  let currentGroup: PhrasebookEntry[] = []

  for (const entry of entries) {
    const label = formatDate(entry.created_at)
    if (label !== currentLabel) {
      if (currentGroup.length > 0) {
        groups.push({ label: currentLabel, entries: currentGroup })
      }
      currentLabel = label
      currentGroup = [entry]
    } else {
      currentGroup.push(entry)
    }
  }
  if (currentGroup.length > 0) {
    groups.push({ label: currentLabel, entries: currentGroup })
  }
  return groups
}

export default function PhrasebookView() {
  const [entries, setEntries] = useState<PhrasebookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/phrasebook')
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    if (expandedId === id) setExpandedId(null)
    await fetch(`/api/phrasebook/${id}`, { method: 'DELETE' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 px-6 space-y-3">
        <p className="text-4xl">📓</p>
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '20px', color: '#1A1814' }}>
          Your phrasebook is empty
        </p>
        <p
          className="text-sm text-[#9E9892] leading-relaxed"
          style={{ fontFamily: 'DM Sans' }}
        >
          Tap any underlined word in a conversation to see its definition and save it here.
        </p>
      </div>
    )
  }

  const groups = groupByDate(entries)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p
            className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-2 px-1"
            style={{ fontFamily: 'DM Sans' }}
          >
            {group.label}
          </p>

          <div className="space-y-2">
            {group.entries.map((entry) => {
              const isExpanded = expandedId === entry.id
              const posStyle = POS_COLORS[entry.part_of_speech || ''] || {
                bg: '#F5F0EB',
                text: '#9E9892',
              }

              return (
                <div
                  key={entry.id}
                  className="rounded-[12px] border overflow-hidden transition-all"
                  style={{
                    backgroundColor: '#FDFBF8',
                    borderColor: isExpanded ? '#1B4F8A30' : '#E0DAD2',
                    boxShadow: isExpanded ? '0 2px 12px rgba(27,79,138,0.06)' : 'none',
                  }}
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p
                          style={{
                            fontFamily: 'Noto Sans JP',
                            fontSize: '20px',
                            color: '#1A1814',
                            fontWeight: 300,
                            lineHeight: 1.2,
                          }}
                        >
                          {entry.japanese}
                        </p>
                        {entry.romaji && (
                          <p style={{ fontFamily: 'DM Mono', fontSize: '12px', color: '#9E9892' }}>
                            {entry.romaji}
                          </p>
                        )}
                      </div>
                      {entry.english && (
                        <p
                          style={{
                            fontFamily: 'DM Sans',
                            fontSize: '13px',
                            color: '#6B6560',
                            marginTop: '2px',
                          }}
                        >
                          {entry.english}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {entry.part_of_speech && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: posStyle.bg,
                            color: posStyle.text,
                            fontFamily: 'DM Sans',
                          }}
                        >
                          {entry.part_of_speech}
                        </span>
                      )}
                      <span
                        className="text-[#C8C3BC] text-xs"
                        style={{
                          display: 'inline-block',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: '#F5F0EB' }}>
                      {entry.reading && entry.reading !== entry.japanese && (
                        <div className="px-4 py-2.5">
                          <p
                            className="text-[10px] tracking-widest uppercase text-[#C8C3BC] font-medium mb-1"
                            style={{ fontFamily: 'DM Sans' }}
                          >
                            Reading
                          </p>
                          <p
                            style={{
                              fontFamily: 'Noto Sans JP',
                              fontSize: '15px',
                              color: '#6B6560',
                              fontWeight: 300,
                            }}
                          >
                            {entry.reading}
                          </p>
                        </div>
                      )}

                      {entry.english_alts && entry.english_alts.length > 0 && (
                        <div
                          className="px-4 py-2.5 border-t"
                          style={{ borderColor: '#F5F0EB' }}
                        >
                          <p
                            className="text-[10px] tracking-widest uppercase text-[#C8C3BC] font-medium mb-1"
                            style={{ fontFamily: 'DM Sans' }}
                          >
                            Also means
                          </p>
                          <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: '#9E9892' }}>
                            {entry.english_alts.join(' · ')}
                          </p>
                        </div>
                      )}

                      {entry.example_jp && (
                        <div
                          className="px-4 py-3 border-t"
                          style={{ borderColor: '#F5F0EB', backgroundColor: '#FAFAF8' }}
                        >
                          <p
                            className="text-[10px] tracking-widest uppercase text-[#C8C3BC] font-medium mb-2"
                            style={{ fontFamily: 'DM Sans' }}
                          >
                            Example
                          </p>
                          <p
                            style={{
                              fontFamily: 'Noto Sans JP',
                              fontSize: '14px',
                              color: '#1A1814',
                              fontWeight: 300,
                              lineHeight: 1.8,
                            }}
                          >
                            {entry.example_jp}
                          </p>
                          {entry.example_en && (
                            <p
                              style={{
                                fontFamily: 'DM Sans',
                                fontSize: '12px',
                                color: '#6B6560',
                                marginTop: '4px',
                                fontStyle: 'italic',
                              }}
                            >
                              {entry.example_en}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Source + delete */}
                      <div
                        className="px-4 py-3 border-t flex items-start justify-between gap-3"
                        style={{ borderColor: '#F5F0EB' }}
                      >
                        <div className="space-y-1">
                          {entry.source_scenario_title && (
                            <p
                              className="text-[10px] text-[#C8C3BC]"
                              style={{ fontFamily: 'DM Sans' }}
                            >
                              from {entry.source_scenario_title}
                              {entry.source_character_name &&
                                ` · ${entry.source_character_name}`}
                            </p>
                          )}
                          {entry.jlpt_level && entry.jlpt_level !== 'none' && (
                            <p
                              className="text-[10px] text-[#C8C3BC]"
                              style={{ fontFamily: 'DM Sans' }}
                            >
                              {entry.jlpt_level}
                            </p>
                          )}
                          {entry.user_note && (
                            <p
                              className="text-xs text-[#6B6560] italic mt-1"
                              style={{ fontFamily: 'DM Sans' }}
                            >
                              {entry.user_note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-[10px] text-[#C8C3BC] hover:text-[#8B3A3A] transition-colors shrink-0"
                          style={{ fontFamily: 'DM Sans' }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
