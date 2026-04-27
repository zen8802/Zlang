'use client'

import { useState, useRef, useEffect } from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DialogueTranslateBlock = any
import Button from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'

interface TranslatedResponse {
  japanese: string
  reading: string
  romaji: string
  breakdown: {
    chunk: string
    reading: string
    romaji?: string
    meaning: string
    note?: string
  }[]
  naturalness: string
  alternativePhrase?: string
  alternativePhraseEN?: string
}

interface CompletedExchange {
  characterLine: string
  characterLineEN: string
  userEN: string
  userJP: string
  userRomaji: string
}

interface Props {
  block: DialogueTranslateBlock
  onComplete: (xp: number) => void
}

export function DialogueTranslateBlockRenderer({ block, onComplete }: Props) {
  const userProfile = useAppStore((s) => s.userProfile)
  const [exchangeIndex, setExchangeIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState<TranslatedResponse | null>(null)
  const [useAlternative, setUseAlternative] = useState(false)
  const [completedExchanges, setCompletedExchanges] = useState<CompletedExchange[]>([])
  const [done, setDone] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const current = block.exchanges[exchangeIndex]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [translated, exchangeIndex])

  const playAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ja-JP'
      u.rate = 0.8
      speechSynthesis.speak(u)
    }
  }

  const handleTranslate = async () => {
    if (!userInput.trim() || translating) return
    setTranslating(true)
    setShowBreakdown(true)
    setUseAlternative(false)

    try {
      const res = await fetch('/api/lessons/translate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEnglish: userInput,
          characterLine: current.characterLine,
          characterLineEN: current.characterLineEN,
          setting: block.setting,
          characterName: block.character.name,
          previousExchanges: completedExchanges,
          userProfile,
        }),
      })
      const data = await res.json()
      if (data.translation) {
        setTranslated(data.translation)
        setTimeout(() => playAudio(data.translation.japanese), 400)
      }
    } catch (err) {
      console.error(err)
    }
    setTranslating(false)
  }

  const handleContinue = () => {
    if (!translated) return

    const sentJapanese =
      useAlternative && translated.alternativePhrase
        ? translated.alternativePhrase
        : translated.japanese
    // Romaji is only available for the primary translation. Falling back to ''
    // for the alternative is fine — it's only used in the conversation replay.
    const sentRomaji = useAlternative ? '' : translated.romaji

    const newCompleted: CompletedExchange = {
      characterLine: current.characterLine,
      characterLineEN: current.characterLineEN,
      userEN: userInput,
      userJP: sentJapanese,
      userRomaji: sentRomaji,
    }

    setCompletedExchanges(prev => [...prev, newCompleted])

    if (exchangeIndex < block.exchanges.length - 1) {
      setExchangeIndex(i => i + 1)
      setUserInput('')
      setTranslated(null)
      setUseAlternative(false)
    } else {
      setDone(true)
    }
  }

  // ── DONE STATE ────────────────────────────────────────

  if (done) {
    return (
      <div className="space-y-5 page-enter">
        <div className="text-center">
          <p
            className="text-2xl text-[#1A1814]"
            style={{ fontFamily: 'Shippori Mincho, serif' }}
          >
            会話完了
          </p>
          <p
            className="text-xs text-[#9E9892] mt-1 tracking-widest uppercase"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Conversation complete
          </p>
        </div>

        <div className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] p-4">
          <p
            className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-4"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Your conversation
          </p>
          <div className="space-y-3">
            {completedExchanges.map((ex, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                    style={{
                      backgroundColor: block.character.color + '20',
                      border: `1.5px solid ${block.character.color}40`,
                    }}
                  >
                    {block.character.emoji}
                  </div>
                  <div
                    className="bg-[#F5F0EB] px-3 py-2 max-w-[85%]"
                    style={{ borderRadius: '2px 8px 8px 8px' }}
                  >
                    <p
                      className="text-sm text-[#1A1814]"
                      style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                    >
                      {ex.characterLine}
                    </p>
                    <p
                      className="text-xs text-[#9E9892] italic mt-0.5"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {ex.characterLineEN}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div
                    className="bg-[#1B4F8A] px-3 py-2 max-w-[85%]"
                    style={{ borderRadius: '8px 2px 8px 8px' }}
                  >
                    <p
                      className="text-white text-sm"
                      style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                    >
                      {ex.userJP}
                    </p>
                    <p
                      className="text-white/50 text-[11px] font-medium mt-0.5"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {ex.userRomaji}
                    </p>
                    <p
                      className="text-white/40 text-xs italic mt-0.5"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      &ldquo;{ex.userEN}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

  // ── MAIN RENDER ───────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Setting pill */}
      <div className="text-center">
        <span
          className="text-xs bg-[#FDFBF8] border border-[#E0DAD2] text-[#9E9892] px-3 py-1 rounded-full font-medium"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          📍 {block.setting}
        </span>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {block.exchanges.map((_: unknown, i: number) => (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor:
                i < exchangeIndex
                  ? '#3D6B4F'
                  : i === exchangeIndex
                    ? '#1B4F8A'
                    : '#E0DAD2',
            }}
          />
        ))}
      </div>

      {/* Previous exchanges — collapsed, greyed */}
      {completedExchanges.length > 0 && (
        <div className="space-y-2 opacity-40 pointer-events-none">
          {completedExchanges.map((ex, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ backgroundColor: block.character.color + '20' }}
                >
                  {block.character.emoji}
                </div>
                <div
                  className="bg-[#F5F0EB] border border-[#E0DAD2] px-3 py-1.5"
                  style={{ borderRadius: '2px 8px 8px 8px' }}
                >
                  <p
                    className="text-xs text-[#1A1814]"
                    style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                  >
                    {ex.characterLine}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <div
                  className="bg-[#1B4F8A]/80 px-3 py-1.5 max-w-[80%]"
                  style={{ borderRadius: '8px 2px 8px 8px' }}
                >
                  <p
                    className="text-white/90 text-xs"
                    style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                  >
                    {ex.userJP}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current character line */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 mt-1 border"
          style={{
            backgroundColor: block.character.color + '15',
            borderColor: block.character.color + '30',
          }}
        >
          {block.character.emoji}
        </div>
        <div className="flex-1">
          <p
            className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-1.5"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {block.character.name}
          </p>
          <div
            className="bg-[#FDFBF8] border border-[#E0DAD2] px-4 py-3"
            style={{ borderRadius: '2px 10px 10px 10px' }}
          >
            <p
              className="text-lg text-[#1A1814] leading-relaxed"
              style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
            >
              {current.characterLine}
            </p>
            <p
              className="text-sm text-[#9E9892] italic mt-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {current.characterLineEN}
            </p>
            <button
              onClick={() => playAudio(current.characterLine)}
              className="text-[#1B4F8A]/50 text-xs mt-2 hover:text-[#1B4F8A] transition-colors flex items-center gap-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              🔊 Listen
            </button>
          </div>
        </div>
      </div>

      {/* Translation result */}
      {translated && (
        <div className="space-y-3 ink-in">
          <div className="flex justify-end">
            <div
              className="bg-[#1B4F8A] px-4 py-3 max-w-[85%]"
              style={{ borderRadius: '10px 2px 10px 10px' }}
            >
              <p
                className="text-white text-lg leading-relaxed"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                {useAlternative && translated.alternativePhrase
                  ? translated.alternativePhrase
                  : translated.japanese}
              </p>
              {!useAlternative && (
                <p
                  className="text-white/50 text-xs mt-1 font-medium"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {translated.romaji}
                </p>
              )}
              {useAlternative && translated.alternativePhraseEN && (
                <p
                  className="text-white/60 text-xs italic mt-1"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {translated.alternativePhraseEN}
                </p>
              )}
              <button
                onClick={() =>
                  playAudio(
                    useAlternative && translated.alternativePhrase
                      ? translated.alternativePhrase
                      : translated.japanese,
                  )
                }
                className="text-white/40 text-xs mt-1 hover:text-white/70 transition-colors flex items-center gap-1"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                🔊 Hear your response
              </button>
            </div>
          </div>

          <div className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] overflow-hidden">
            <button
              onClick={() => setShowBreakdown(b => !b)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F5F0EB] transition-colors"
            >
              <p
                className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Breaking it down
              </p>
              <span className="text-[#C8C3BC] text-xs">
                {showBreakdown ? '▲' : '▼'}
              </span>
            </button>

            {showBreakdown && (
              <div className="px-4 pb-4 space-y-3 border-t border-[#E0DAD2] pt-3">
                <div className="space-y-2">
                  {translated.breakdown.map((chunk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-2 border-b border-[#F5F0EB] last:border-0 last:pb-0"
                    >
                      <div className="shrink-0 min-w-[80px]">
                        <p
                          className="text-base text-[#1A1814] font-medium"
                          style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                        >
                          {chunk.chunk}
                        </p>
                        <p
                          className="text-[11px] text-[#9E9892]"
                          style={{ fontFamily: 'DM Mono, monospace' }}
                        >
                          {chunk.romaji || chunk.reading}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-sm text-[#1A1814]"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          {chunk.meaning}
                        </p>
                        {chunk.note && (
                          <p
                            className="text-xs text-[#7A5C2E] mt-0.5 italic"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            {chunk.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mascot naturalness note */}
                <div className="flex items-start gap-2.5">
                  <div
                    className="flex-1 rounded-[10px_10px_10px_2px] px-3.5 py-2.5 border"
                    style={{ backgroundColor: '#FDFBF8', borderColor: '#E0DAD2' }}
                  >
                    <p
                      className="text-xs text-[#1A1814] leading-relaxed"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {translated.naturalness}
                    </p>
                  </div>
                  <div
                    className="w-14 h-14 shrink-0 rounded-full border-2 border-white overflow-hidden flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(26,24,20,0.08)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/mascot/talking-1.png"
                      alt=""
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>

                {translated.alternativePhrase && (
                  <div className="bg-[#F5F0E8] rounded-[8px] px-3 py-2 border border-[#D4C4A8]">
                    <p
                      className="text-[10px] text-[#7A5C2E] font-medium tracking-wide uppercase mb-1"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      You could also say
                    </p>
                    <p
                      className="text-sm text-[#1A1814]"
                      style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                    >
                      {translated.alternativePhrase}
                    </p>
                    {translated.alternativePhraseEN && (
                      <p
                        className="text-xs text-[#9E9892] italic mt-0.5"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {translated.alternativePhraseEN}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setUseAlternative((v) => !v)
                        if (translated.alternativePhrase) {
                          setTimeout(
                            () =>
                              playAudio(
                                useAlternative
                                  ? translated.japanese
                                  : (translated.alternativePhrase as string),
                              ),
                            150,
                          )
                        }
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[6px] border transition-colors"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        backgroundColor: useAlternative ? '#7A5C2E' : '#FDFBF8',
                        color: useAlternative ? '#FFFFFF' : '#7A5C2E',
                        borderColor: '#D4C4A8',
                      }}
                    >
                      {useAlternative ? '✓ Using this version' : 'Try this instead →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
            {exchangeIndex < block.exchanges.length - 1
              ? 'Continue conversation →'
              : `Finish +${block.xpReward} XP`}
          </Button>
        </div>
      )}

      {/* Input — only show when not yet translated */}
      {!translated && (
        <div className="space-y-3">
          <p
            className="text-xs text-[#9E9892] text-center"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {current.promptHint}
          </p>

          <div className="bg-[#FDFBF8] rounded-[10px] border-2 border-[#E0DAD2] focus-within:border-[#1B4F8A] transition-colors overflow-hidden">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleTranslate()
                }
              }}
              placeholder="Type what you want to say in English..."
              rows={2}
              className="w-full px-4 pt-3 pb-1 text-sm text-[#1A1814] resize-none bg-transparent outline-none placeholder-[#C8C3BC]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />
            <div className="flex items-center justify-end px-4 pb-3">
              <button
                onClick={handleTranslate}
                disabled={!userInput.trim() || translating}
                className={`text-xs font-medium px-3 py-1.5 rounded-[6px] transition-all ${
                  userInput.trim() && !translating
                    ? 'bg-[#1B4F8A] text-white hover:bg-[#4A7AB5]'
                    : 'bg-[#E0DAD2] text-[#C8C3BC] cursor-not-allowed'
                }`}
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {translating ? 'Translating...' : 'Translate →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

export default DialogueTranslateBlockRenderer
