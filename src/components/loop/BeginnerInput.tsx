'use client'
import { useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  onSend: (englishText: string, japaneseTranslation: string) => void
  disabled: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastCharacterMessage?: { content: string; english?: string }
  /** Tappable English starter chips, parsed from the character's ---HINTS--- section */
  hints?: string[]
}

export function BeginnerInput({ onSend, disabled, session, lastCharacterMessage, hints = [] }: Props) {
  const userProfile = useAppStore((s) => s.userProfile)
  const [value, setValue] = useState('')
  const [translating, setTranslating] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    if (!value.trim() || disabled || translating) return
    setTranslating(true)
    try {
      const res = await fetch('/api/lessons/translate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEnglish: value,
          characterLine: lastCharacterMessage?.content || '',
          characterLineEN: lastCharacterMessage?.english || '',
          setting: session?.setting || '',
          characterName: session?.characterName || '',
          previousExchanges: [],
          userProfile,
        }),
      })
      const data = await res.json()
      const japanese = data?.translation?.japanese || value
      onSend(value, japanese)
      setValue('')
      inputRef.current?.focus()
    } catch {
      // Fail-soft: send the English so the conversation doesn't dead-end
      onSend(value, value)
      setValue('')
    }
    setTranslating(false)
  }

  const insertHint = (hint: string) => {
    const phrase = hint.replace(/\s*\(.*\)\s*$/, '').trim()
    setValue((prev) => {
      if (!prev.trim()) return phrase
      return /\s$/.test(prev) ? prev + phrase : prev + ' ' + phrase
    })
    inputRef.current?.focus()
  }

  return (
    <div
      className="bg-[#FDFBF8] border-t border-[#E0DAD2] px-4 py-3 shrink-0"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#3D6B4F]" />
        <p
          className="text-[10px] text-[#9E9892] tracking-widest uppercase font-medium"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Type in English — we&apos;ll translate
        </p>
      </div>

      {/* Suggestion chips — show when the character emitted ---HINTS--- */}
      {hints.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {hints.map((hint, i) => {
            const main = hint.replace(/\s*\(.*\)\s*$/, '').trim()
            const note = (hint.match(/\(([^)]*)\)\s*$/) || [])[1]
            return (
              <button
                key={i}
                onClick={() => insertHint(hint)}
                disabled={disabled || translating}
                className="group inline-flex items-baseline gap-1 px-2.5 py-1 rounded-full bg-[#FDFBF8] border border-[#E0DAD2] hover:border-[#1B4F8A] hover:bg-[#EBF0F8] transition-colors disabled:opacity-50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <span className="text-[11px] text-[#1A1814] group-hover:text-[#1B4F8A]">
                  {main}
                </span>
                {note && (
                  <span className="text-[10px] text-[#9E9892]">{note}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="What do you want to say?"
          rows={1}
          disabled={disabled || translating}
          className="flex-1 px-4 py-3 rounded-[8px] border-2 border-[#E0DAD2] bg-[#F5F0EB] text-sm text-[#1A1814] resize-none outline-none focus:border-[#1B4F8A] transition-colors placeholder-[#C8C3BC] disabled:opacity-50"
          style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: '1.4' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled || translating}
          className={`w-11 h-11 rounded-[8px] flex items-center justify-center text-white shrink-0 transition-all ${value.trim() && !translating && !disabled ? 'bg-[#1B4F8A] hover:bg-[#4A7AB5] active:translate-y-px' : 'bg-[#E0DAD2] cursor-not-allowed'}`}
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {translating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
          )}
        </button>
      </div>
    </div>
  )
}
