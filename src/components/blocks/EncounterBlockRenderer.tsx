'use client'

import { useState } from 'react'
import { SpeakerHigh } from '@phosphor-icons/react'
import { renderFurigana } from '@/components/japanese/FuriganaText'

interface EncounterWord {
  word: string
  reading: string
  romaji: string
  english: string
  partOfSpeech: string
  contextSentenceJP: string
  contextSentenceEN: string
}

interface Block {
  title?: string
  words: EncounterWord[]
}

interface Props {
  block: Block
  onComplete: (xp: number) => void
}

const POS_COLOR: Record<string, string> = {
  noun: '#1B4F8A',
  'proper noun': '#1B4F8A',
  verb: '#8B3A3A',
  adjective: '#6B5B8D',
  'i-adjective': '#6B5B8D',
  'na-adjective': '#6B5B8D',
  adverb: '#3D6B4F',
  expression: '#7A5C2E',
  phrase: '#8B5A6B',
  greeting: '#3D6B5A',
  particle: '#7A5C2E',
  pronoun: '#1B4F8A',
}

export default function EncounterBlockRenderer({ block, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const word = block.words?.[index]
  const total = block.words?.length || 0
  const isLast = index >= total - 1

  if (!word) {
    return null
  }

  const playAudio = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const stripped = word.word.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
    const u = new SpeechSynthesisUtterance(stripped)
    u.lang = 'ja-JP'
    u.rate = 0.7
    window.speechSynthesis.speak(u)
  }

  const posColor = POS_COLOR[word.partOfSpeech] || '#6B6560'

  return (
    <div className="space-y-5 py-2">
      <div>
        <h2 style={{ fontFamily: 'Shippori Mincho', fontSize: '22px', color: '#1A1814' }}>
          {block.title || 'Words from your conversation'}
        </h2>
        <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#9E9892', marginTop: '4px' }}>
          {index + 1} of {total}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {block.words.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? '20px' : '6px',
              height: '6px',
              backgroundColor: i < index ? '#3D6B4F' : i === index ? '#1B4F8A' : '#E0DAD2',
            }}
          />
        ))}
      </div>

      {/* Word card */}
      <div
        className="rounded-[16px] overflow-hidden"
        style={{
          backgroundColor: '#FDFBF8',
          border: '1.5px solid #E0DAD2',
          boxShadow: '0 2px 16px rgba(26,24,20,0.06)',
        }}
      >
        <div style={{ height: '3px', backgroundColor: posColor, opacity: 0.7 }} />

        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                style={{
                  fontFamily: 'Noto Sans JP',
                  fontSize: '40px',
                  color: '#1A1814',
                  fontWeight: 300,
                  lineHeight: 1.2,
                }}
              >
                {renderFurigana(word.word, '0.4em')}
              </p>
              <p
                style={{
                  fontFamily: 'DM Mono',
                  fontSize: '13px',
                  color: '#9E9892',
                  marginTop: '4px',
                }}
              >
                {word.romaji}
              </p>
            </div>
            <button
              onClick={playAudio}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-[#E0DAD2] hover:border-[#1B4F8A]/40 transition-colors shrink-0 text-[#1B4F8A]"
              aria-label="Play pronunciation"
            >
              <SpeakerHigh size={20} weight="regular" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <p style={{ fontFamily: 'Shippori Mincho', fontSize: '18px', color: '#1A1814', fontWeight: 600 }}>
              {word.english}
            </p>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: posColor + '15',
                color: posColor,
                fontFamily: 'DM Sans',
              }}
            >
              {word.partOfSpeech}
            </span>
          </div>
        </div>

        {/* Context sentence */}
        {word.contextSentenceJP && (
          <div
            className="px-6 py-4 border-t border-[#F5F0EB]"
            style={{ backgroundColor: '#FAFAF8' }}
          >
            <p
              style={{
                fontFamily: 'DM Sans',
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#C8C3BC',
                marginBottom: '8px',
              }}
            >
              FROM YOUR CONVERSATION
            </p>
            <p
              style={{
                fontFamily: 'Noto Sans JP',
                fontSize: '15px',
                color: '#1A1814',
                fontWeight: 300,
                lineHeight: 2,
              }}
            >
              {renderFurigana(word.contextSentenceJP)}
            </p>
            {word.contextSentenceEN && (
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: '12px',
                  color: '#9E9892',
                  marginTop: '4px',
                  fontStyle: 'italic',
                }}
              >
                {word.contextSentenceEN}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (isLast) onComplete(10)
          else setIndex((i) => i + 1)
        }}
        className="w-full py-4 rounded-[10px] text-sm font-medium text-white transition-all active:translate-y-px"
        style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans' }}
      >
        {isLast ? 'Got it — test me' : 'Next word →'}
      </button>
    </div>
  )
}
