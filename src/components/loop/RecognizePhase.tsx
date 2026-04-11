'use client'

import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
  onComplete: () => void
}

function renderWithFurigana(text: string): string {
  return (text || '').replace(
    /([\u4e00-\u9fa5\u3005]+)\(([\u3041-\u3093\u30a1-\u30f6\u30fc]+)\)/g,
    '<ruby>$1<rt>$2</rt></ruby>',
  )
}

function stripFurigana(text: string): string {
  return (text || '').replace(
    /([\u4e00-\u9fa5\u3005]+)\(([\u3041-\u3093\u30a1-\u30f6\u30fc]+)\)/g,
    '$1',
  )
}

export default function RecognizePhase({ session, messages, onComplete }: Props) {
  // Identify character message indices
  const characterIndices = useMemo(
    () =>
      messages
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.role === 'character' || m.role === 'assistant')
        .map(({ i }) => i),
    [messages],
  )

  // Track reveal state per character-message index
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  // Track "understood" (waited 3+ seconds) per character-message index
  const [understood, setUnderstood] = useState<Record<number, boolean>>({})
  // Mounted-at timestamps for each character message
  const mountedAtRef = useRef<Record<number, number>>({})
  const [mode, setMode] = useState<'review' | 'done'>('review')

  // Lazily record mount time for character messages
  characterIndices.forEach((idx) => {
    if (mountedAtRef.current[idx] === undefined) {
      mountedAtRef.current[idx] = Date.now()
    }
  })

  const revealedCount = characterIndices.filter((i) => revealed[i]).length
  const totalCharacter = characterIndices.length
  const allRevealed = totalCharacter > 0 && revealedCount === totalCharacter
  const understoodCount = characterIndices.filter((i) => understood[i]).length

  const handleReveal = (idx: number) => {
    if (revealed[idx]) return
    const mountedAt = mountedAtRef.current[idx] || Date.now()
    const waited = Date.now() - mountedAt
    setRevealed((prev) => ({ ...prev, [idx]: true }))
    if (waited >= 3000) {
      setUnderstood((prev) => ({ ...prev, [idx]: true }))
    }
  }

  const avatar = session?.characterAvatar
  const characterColor = session?.characterColor || '#1B4F8A'
  const characterInitial = (session?.characterName || '?').charAt(0).toUpperCase()

  if (mode === 'done') {
    return (
      <div
        className="h-full flex items-center justify-center px-6"
        style={{ backgroundColor: '#F5F0EB' }}
      >
        <div
          className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[16px] px-8 py-10 max-w-sm w-full text-center"
          style={{ boxShadow: '0 4px 24px rgba(26,24,20,0.06)' }}
        >
          <p
            className="text-[10px] tracking-[0.25em] uppercase text-[#9E9892] mb-6"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Recognition score
          </p>
          <div
            className="flex items-baseline justify-center gap-2 mb-3"
            style={{ fontFamily: 'Shippori Mincho, serif' }}
          >
            <span className="text-[72px] leading-none text-[#1A1814]">{understoodCount}</span>
            <span className="text-[36px] text-[#C8C3BC]">/</span>
            <span className="text-[48px] leading-none text-[#9E9892]">{totalCharacter}</span>
          </div>
          <p
            className="text-sm text-[#6B6560] mb-1"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            understood without help
          </p>
          <p
            className="text-[11px] text-[#9E9892] mb-8 italic"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            This number will grow
          </p>
          <button
            onClick={onComplete}
            className="w-full bg-[#1B4F8A] hover:bg-[#4A7AB5] text-white font-semibold py-3 rounded-[10px] transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Header card */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[12px] px-4 py-4">
          <h2
            className="text-[20px] leading-snug text-[#1A1814] mb-1"
            style={{ fontFamily: 'Shippori Mincho, serif' }}
          >
            How much do you recognize?
          </h2>
          <p
            className="text-xs text-[#6B6560]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Tap each line to reveal the translation. Take your time.
          </p>
        </div>
      </div>

      {/* Scrollable message list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Hidden-translations pill */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDFBF8] border border-[#E0DAD2]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7A5C2E]" />
            <span
              className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Translations hidden — tap to reveal
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {messages.map((m, idx) => {
            const isCharacter = m.role === 'character' || m.role === 'assistant'
            if (isCharacter) {
              const isRevealed = !!revealed[idx]
              const englishText = m.english || m.contentOriginalEN || ''
              return (
                <div key={idx} className="flex items-start gap-2">
                  <div className="shrink-0">
                    {avatar ? (
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden border border-[#E0DAD2]"
                        style={{ backgroundColor: characterColor }}
                      >
                        <Image
                          src={avatar}
                          alt={session?.characterName || ''}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{
                          backgroundColor: characterColor,
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {characterInitial}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 max-w-[85%] space-y-1.5">
                    <div
                      className="bg-[#FDFBF8] border border-[#E0DAD2] px-4 py-3"
                      style={{ borderRadius: '2px 10px 10px 10px' }}
                    >
                      <p
                        className="text-[15px] leading-[2] whitespace-pre-wrap text-[#1A1814]"
                        style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                        dangerouslySetInnerHTML={{
                          __html: renderWithFurigana(m.content || ''),
                        }}
                      />
                    </div>

                    {!isRevealed ? (
                      <button
                        onClick={() => handleReveal(idx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDFBF8] border border-[#E0DAD2] hover:border-[#1B4F8A] hover:bg-[#EBF0F8] transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A]" />
                        <span
                          className="text-[11px] text-[#6B6560] font-medium"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          Tap to reveal translation
                        </span>
                      </button>
                    ) : (
                      <p
                        className="text-xs italic text-[#9E9892] px-1"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {englishText || stripFurigana(m.content || '')}
                      </p>
                    )}
                  </div>
                </div>
              )
            }

            // user message
            return (
              <div key={idx} className="flex justify-end">
                <div
                  className="bg-[#1B4F8A] text-white px-4 py-3 max-w-[85%]"
                  style={{ borderRadius: '10px 2px 10px 10px' }}
                >
                  <p
                    className="text-[15px] leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                    dangerouslySetInnerHTML={{
                      __html: renderWithFurigana(m.content || ''),
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="shrink-0 bg-[#FDFBF8] border-t border-[#E0DAD2] px-4 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {allRevealed ? (
          <button
            onClick={() => setMode('done')}
            className="w-full bg-[#1B4F8A] hover:bg-[#4A7AB5] text-white font-semibold py-3 rounded-[10px] transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            See how I did →
          </button>
        ) : (
          <div className="text-center">
            <p
              className="text-[11px] tracking-widest uppercase text-[#9E9892] font-medium"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {revealedCount} / {totalCharacter} revealed
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
