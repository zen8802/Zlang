'use client'

import { useState } from 'react'
import KeywordPopup from './KeywordPopup'
import ShadowingCard from './ShadowingCard'
import CulturalCard from './CulturalCard'
import VocabDeck from './VocabDeck'

interface Props {
  lesson: Record<string, unknown>
}

export default function TranscriptLesson({ lesson }: Props) {
  const [showEnglish, setShowEnglish] = useState(false)
  const [activeKeyword, setActiveKeyword] = useState<Record<string, unknown> | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState<'transcript' | 'vocab' | 'culture' | 'shadow'>('transcript')

  const sentences = (lesson.sentences || []) as Array<Record<string, unknown>>
  const lessonVocab = (lesson.lessonVocab || []) as Array<Record<string, unknown>>

  const handleKeywordClick = (keyword: Record<string, unknown>, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setPopupPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8,
    })
    setActiveKeyword(activeKeyword?.word === keyword.word ? null : keyword)
  }

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex gap-1 bg-black/[0.04] p-1 rounded-xl">
        {[
          { key: 'transcript', label: '文 Transcript' },
          { key: 'vocab', label: '語 Vocab' },
          { key: 'culture', label: '化 Culture' },
          { key: 'shadow', label: '影 Shadow' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-accent shadow-sm'
                : 'text-foreground/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'transcript' && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-foreground">Transcript</h2>
            <button
              onClick={() => setShowEnglish((p) => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                showEnglish ? 'bg-accent text-white' : 'bg-black/[0.04] text-foreground/50'
              }`}
            >
              {showEnglish ? 'English ON' : 'Japanese only'}
            </button>
          </div>

          <div className="space-y-6">
            {sentences.map((sentence, idx) => (
              <SentenceBlock
                key={(sentence.id as string) || idx}
                sentence={sentence}
                showEnglish={showEnglish}
                activeKeyword={activeKeyword}
                onKeywordClick={handleKeywordClick}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vocab' && <VocabDeck vocab={lessonVocab} />}
      {activeTab === 'culture' && (
        <CulturalCard
          deepDive={lesson.culturalDeepDive as Record<string, unknown>}
          whyFunny={lesson.whyIsFunny as string | null}
        />
      )}
      {activeTab === 'shadow' && <ShadowingCard shadowing={lesson.shadowing as Record<string, unknown>} />}

      {activeKeyword && (
        <KeywordPopup keyword={activeKeyword} position={popupPosition} onClose={() => setActiveKeyword(null)} />
      )}
    </div>
  )
}

function SentenceBlock({ sentence, showEnglish, activeKeyword, onKeywordClick }: {
  sentence: Record<string, unknown>
  showEnglish: boolean
  activeKeyword: Record<string, unknown> | null
  onKeywordClick: (kw: Record<string, unknown>, e: React.MouseEvent) => void
}) {
  const emotionColors: Record<string, string> = {
    funny: '#FFB347', emotional: '#FF6B9D', casual: '#98D8C8',
    formal: '#7B9EA8', tense: '#E8736C', heartwarming: '#FFD1DC',
  }
  const emotion = sentence.emotionTag as string
  const borderColor = emotionColors[emotion] || '#E5E7EB'
  const keywords = (sentence.keywords || []) as Array<Record<string, unknown>>
  const grammarNote = sentence.grammarNote as Record<string, unknown> | null

  return (
    <div className="relative pl-3" style={{ borderLeft: `3px solid ${borderColor}` }}>
      {emotion && <span className="text-xs text-foreground/30 mb-1 block capitalize">{emotion}</span>}

      <JapaneseSentence
        japanese={sentence.japanese as string}
        keywords={keywords}
        activeKeyword={activeKeyword}
        onKeywordClick={onKeywordClick}
      />

      <p className="text-xs text-foreground/30 mt-1 font-mono">{sentence.romanji as string}</p>

      <div className={`overflow-hidden transition-all duration-300 ${showEnglish ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-foreground/50 italic">{sentence.english as string}</p>
      </div>

      {grammarNote && (
        <div className="mt-2 p-2 bg-accent/5 rounded-lg">
          <span className="text-xs font-mono text-accent font-bold">{grammarNote.pattern as string}</span>
          <span className="text-xs text-foreground/50 ml-2">{grammarNote.explanation as string}</span>
        </div>
      )}
    </div>
  )
}

function JapaneseSentence({ japanese, keywords, activeKeyword, onKeywordClick }: {
  japanese: string
  keywords: Array<Record<string, unknown>>
  activeKeyword: Record<string, unknown> | null
  onKeywordClick: (kw: Record<string, unknown>, e: React.MouseEvent) => void
}) {
  let parts: Array<{ text: string; keyword?: Record<string, unknown> }> = [{ text: japanese }]

  keywords.forEach((kw) => {
    const word = kw.word as string
    parts = parts.flatMap((part) => {
      if (part.keyword) return [part]
      const split = part.text.split(word)
      if (split.length === 1) return [part]
      return split.flatMap((s, i) => {
        const result: typeof parts = []
        if (s) result.push({ text: s })
        if (i < split.length - 1) result.push({ text: word, keyword: kw })
        return result
      })
    })
  })

  return (
    <p className="text-xl leading-relaxed font-jp">
      {parts.map((part, i) =>
        part.keyword ? (
          <span
            key={i}
            onClick={(e) => onKeywordClick(part.keyword!, e)}
            className={`underline decoration-dotted decoration-accent cursor-pointer transition-colors hover:bg-accent/10 rounded px-0.5 ${
              activeKeyword?.word === (part.keyword!.word as string) ? 'bg-accent/15' : ''
            }`}
          >
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  )
}
