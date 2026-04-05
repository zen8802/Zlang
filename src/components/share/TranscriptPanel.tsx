'use client'

import { useState, useRef } from 'react'
import KeywordPopup from './KeywordPopup'
import VocabDeck from './VocabDeck'
import CulturalCard from './CulturalCard'
import ShadowingCard from './ShadowingCard'

type Tab = 'transcript' | 'vocab' | 'culture' | 'shadow'

const TABS: Array<{ key: Tab; jp: string; label: string }> = [
  { key: 'transcript', jp: '文', label: 'Read' },
  { key: 'vocab', jp: '語', label: 'Vocab' },
  { key: 'culture', jp: '化', label: 'Culture' },
  { key: 'shadow', jp: '影', label: 'Shadow' },
]

export default function TranscriptPanel({ lesson }: { lesson: Record<string, unknown> }) {
  const [tab, setTab] = useState<Tab>('transcript')
  const [showEnglish, setShowEnglish] = useState(false)
  const [activeKeyword, setActiveKeyword] = useState<Record<string, unknown> | null>(null)
  const [popupAnchor, setPopupAnchor] = useState<DOMRect | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sentences = (lesson.sentences || []) as Array<Record<string, unknown>>
  const vocabList = (lesson.lessonVocab || []) as Array<Record<string, unknown>>
  const summary = typeof lesson.videoSummary === 'string' ? lesson.videoSummary : ''

  return (
    <div className="flex flex-col h-full">
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 bg-gray-200 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
        <h2 className="font-display font-bold text-sm text-foreground truncate max-w-[200px]">
          {summary.length > 40 ? summary.slice(0, 40) + '...' : summary}
        </h2>
        <button
          onClick={() => setShowEnglish((p) => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all duration-200 ${
            showEnglish ? 'bg-[#1B4F8A] text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {showEnglish ? '🇬🇧 EN' : '🇯🇵 JP'}
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-2">
        {tab === 'transcript' && (
          <div className="space-y-6 py-2">
            {sentences.map((sentence, idx) => (
              <SentenceRow
                key={idx}
                sentence={sentence}
                showEnglish={showEnglish}
                activeKeyword={activeKeyword}
                onKeywordClick={(kw: Record<string, unknown>, rect: DOMRect) => {
                  setActiveKeyword(activeKeyword?.word === kw.word ? null : kw)
                  setPopupAnchor(rect)
                }}
              />
            ))}
            <div className="h-4" />
          </div>
        )}

        {tab === 'vocab' && <VocabDeck vocab={vocabList} />}
        {tab === 'culture' && (
          <CulturalCard
            deepDive={lesson.culturalDeepDive as Record<string, unknown> | null}
            whyFunny={typeof lesson.whyIsFunny === 'string' ? lesson.whyIsFunny : null}
          />
        )}
        {tab === 'shadow' && <ShadowingCard shadowing={lesson.shadowing as Record<string, unknown> | null} />}
      </div>

      {/* Tab bar — pinned bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white grid grid-cols-4 safe-bottom">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-3 flex flex-col items-center gap-0.5 transition-all ${
              tab === t.key ? 'text-[#1B4F8A]' : 'text-gray-300'
            }`}
          >
            <span className={`text-lg font-bold font-jp transition-transform ${tab === t.key ? 'scale-110' : 'scale-100'}`}>
              {t.jp}
            </span>
            <span className="text-[10px] font-body">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Keyword popup */}
      {activeKeyword && popupAnchor && (
        <KeywordPopup keyword={activeKeyword} anchor={popupAnchor} onClose={() => setActiveKeyword(null)} />
      )}
    </div>
  )
}

// --- Sentence Row ---

function SentenceRow({ sentence, showEnglish, activeKeyword, onKeywordClick }: {
  sentence: Record<string, unknown>
  showEnglish: boolean
  activeKeyword: Record<string, unknown> | null
  onKeywordClick: (kw: Record<string, unknown>, rect: DOMRect) => void
}) {
  const emotionColors: Record<string, string> = {
    funny: '#FFB347', emotional: '#FF6B9D', casual: '#98D8C8',
    formal: '#7B9EA8', tense: '#E8736C', heartwarming: '#FFD1DC',
  }
  const emotion = sentence.emotionTag as string | undefined
  const accent = emotion ? emotionColors[emotion] || '#E5E7EB' : '#E5E7EB'
  const grammarNote = sentence.grammarNote as Record<string, unknown> | null

  return (
    <div>
      <JapaneseWords
        sentence={sentence}
        activeKeyword={activeKeyword}
        onKeywordClick={onKeywordClick}
      />

      <div className={`overflow-hidden transition-all duration-300 ease-out ${showEnglish ? 'max-h-16 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-gray-400 italic font-body leading-snug">{sentence.english as string}</p>
      </div>

      {grammarNote && (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="h-0.5 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
          <span className="text-xs font-mono text-gray-300">{grammarNote.pattern as string}</span>
          <span className="text-xs text-gray-300 font-body truncate">{grammarNote.explanation as string}</span>
        </div>
      )}
    </div>
  )
}

// --- Japanese Words with Furigana ---

function JapaneseWords({ sentence, activeKeyword, onKeywordClick }: {
  sentence: Record<string, unknown>
  activeKeyword: Record<string, unknown> | null
  onKeywordClick: (kw: Record<string, unknown>, rect: DOMRect) => void
}) {
  const japanese = sentence.japanese as string || ''
  const keywords = (sentence.keywords || []) as Array<Record<string, unknown>>

  let parts: Array<{ text: string; kw?: Record<string, unknown> }> = [{ text: japanese }]

  keywords.forEach((kw) => {
    const word = kw.word as string
    parts = parts.flatMap((part) => {
      if (part.kw) return [part]
      const chunks = part.text.split(word)
      if (chunks.length === 1) return [part]
      return chunks.flatMap((chunk, i) => {
        const result: Array<{ text: string; kw?: Record<string, unknown> }> = []
        if (chunk) result.push({ text: chunk })
        if (i < chunks.length - 1) result.push({ text: word, kw })
        return result
      })
    })
  })

  return (
    <div className="flex flex-wrap items-end gap-x-1 gap-y-3">
      {parts.map((part, i) => {
        const isKw = !!part.kw
        const isActive = activeKeyword?.word === part.text
        const reading = part.kw?.reading as string | undefined

        return (
          <span key={i} className="inline-flex flex-col items-center">
            {isKw && reading && (
              <span className="text-center font-jp" style={{ fontSize: 'clamp(8px, 2vw, 11px)', color: '#1B4F8A', marginBottom: '2px', letterSpacing: '0.05em' }}>
                {reading}
              </span>
            )}
            <span
              onClick={isKw ? (e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect()
                onKeywordClick(part.kw!, rect)
              } : undefined}
              className={`font-bold leading-none transition-all ${isKw ? `border-b-2 border-dotted border-[#1B4F8A] cursor-pointer ${isActive ? 'bg-[#1B4F8A]/10 rounded-sm' : ''}` : ''}`}
              style={{ fontFamily: 'Noto Sans JP', fontSize: 'clamp(18px, 5vw, 24px)', color: isActive ? '#1B4F8A' : '#0A0A0F' }}
            >
              {part.text}
            </span>
            {isKw && typeof part.kw?.romaji === 'string' && (
              <span className="font-mono" style={{ fontSize: 'clamp(7px, 1.8vw, 10px)', color: '#8A8A8A', marginTop: '1px' }}>
                {part.kw.romaji as string}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
