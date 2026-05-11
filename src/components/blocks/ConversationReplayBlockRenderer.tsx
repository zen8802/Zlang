'use client'

import { useState } from 'react'
import { renderFurigana } from '@/components/japanese/FuriganaText'

interface Block {
  title?: string
  characterName?: string
  characterLine: string
  characterLineEN?: string
  userResponseJP: string
  userResponseEN?: string
  blankWord: string
  blankWordEN?: string
  options: string[]
}

interface Props {
  block: Block
  onComplete: (xp: number) => void
}

function stripFuri(s: string): string {
  return (s || '').replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
}

export default function ConversationReplayBlockRenderer({ block, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [shuffled] = useState(() => [...(block.options || [])].sort(() => Math.random() - 0.5))

  const handleSelect = (option: string) => {
    if (revealed) return
    setSelected(option)
    setRevealed(true)
  }

  const isCorrect = selected !== null && stripFuri(selected) === stripFuri(block.blankWord)

  // Render the response, swapping ___ for the selected option (or a placeholder)
  const renderResponse = () => {
    const parts = (block.userResponseJP || '').split('___')
    if (parts.length === 1) return renderFurigana(block.userResponseJP || '')

    const blankContent = selected ? renderFurigana(selected, '0.4em') : '？'

    return (
      <>
        {renderFurigana(parts[0])}
        <span
          className="inline-block mx-1 px-2 py-0.5 rounded-[4px] font-medium transition-all align-middle"
          style={{
            fontFamily: 'Noto Sans JP',
            backgroundColor: revealed
              ? isCorrect
                ? '#EFF5F0'
                : '#F5EEEE'
              : selected
                ? '#EBF0F8'
                : '#F5F0EB',
            color: revealed
              ? isCorrect
                ? '#3D6B4F'
                : '#8B3A3A'
              : selected
                ? '#1B4F8A'
                : '#C8C3BC',
            border: `1.5px solid ${
              revealed
                ? isCorrect
                  ? '#3D6B4F'
                  : '#8B3A3A'
                : selected
                  ? '#1B4F8A'
                  : '#D4CFC8'
            }`,
            minWidth: '48px',
            textAlign: 'center',
          }}
        >
          {blankContent}
        </span>
        {renderFurigana(parts.slice(1).join('___'))}
      </>
    )
  }

  return (
    <div className="space-y-5 py-2">
      <div>
        <h2 style={{ fontFamily: 'Shippori Mincho', fontSize: '22px', color: '#1A1814' }}>
          {block.title || 'Remember this moment?'}
        </h2>
        <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: '#9E9892', marginTop: '4px' }}>
          Fill in the missing word
        </p>
      </div>

      {/* The exchange */}
      <div className="rounded-[16px] overflow-hidden" style={{ border: '1.5px solid #E0DAD2' }}>
        {/* Character's line */}
        <div className="px-5 py-4" style={{ backgroundColor: '#F5F0EB' }}>
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '10px',
              color: '#9E9892',
              letterSpacing: '0.1em',
              marginBottom: '6px',
            }}
          >
            {(block.characterName || 'CHARACTER').toUpperCase()}
          </p>
          <p
            style={{
              fontFamily: 'Noto Sans JP',
              fontSize: '15px',
              color: '#1A1814',
              fontWeight: 300,
              lineHeight: 1.9,
            }}
          >
            {renderFurigana(block.characterLine)}
          </p>
          {block.characterLineEN && (
            <p
              style={{
                fontFamily: 'DM Sans',
                fontSize: '12px',
                color: '#9E9892',
                marginTop: '3px',
                fontStyle: 'italic',
              }}
            >
              {block.characterLineEN}
            </p>
          )}
        </div>

        {/* User's response with blank */}
        <div className="px-5 py-4" style={{ backgroundColor: '#FDFBF8' }}>
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '10px',
              color: '#9E9892',
              letterSpacing: '0.1em',
              marginBottom: '6px',
            }}
          >
            YOU
          </p>
          <p
            style={{
              fontFamily: 'Noto Sans JP',
              fontSize: '15px',
              color: '#1A1814',
              fontWeight: 300,
              lineHeight: 1.9,
            }}
          >
            {renderResponse()}
          </p>
          {block.userResponseEN && (
            <p
              style={{
                fontFamily: 'DM Sans',
                fontSize: '12px',
                color: '#9E9892',
                marginTop: '3px',
                fontStyle: 'italic',
              }}
            >
              {block.userResponseEN}
            </p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-2 justify-center">
        {shuffled.map((option, i) => {
          const isThis = option === selected
          const isRight = stripFuri(option) === stripFuri(block.blankWord)

          let bg = '#FDFBF8'
          let border = '#E0DAD2'
          let color = '#1A1814'

          if (revealed) {
            if (isRight) {
              bg = '#EFF5F0'
              border = '#3D6B4F'
              color = '#3D6B4F'
            } else if (isThis) {
              bg = '#F5EEEE'
              border = '#8B3A3A'
              color = '#8B3A3A'
            } else {
              color = '#C8C3BC'
            }
          } else if (isThis) {
            bg = '#EBF0F8'
            border = '#1B4F8A'
            color = '#1B4F8A'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={revealed}
              className="px-5 py-3 rounded-[10px] text-sm font-medium border-2 transition-all disabled:cursor-default active:translate-y-px"
              style={{ fontFamily: 'Noto Sans JP', backgroundColor: bg, borderColor: border, color }}
            >
              {renderFurigana(option, '0.4em')}
            </button>
          )
        })}
      </div>

      {revealed && (
        <button
          onClick={() => onComplete(isCorrect ? 20 : 10)}
          className="w-full py-4 rounded-[10px] text-white text-sm font-medium transition-all active:translate-y-px"
          style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans' }}
        >
          Complete lesson →
        </button>
      )}
    </div>
  )
}
