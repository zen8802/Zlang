'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as wanakana from 'wanakana'
import { X } from '@phosphor-icons/react'

interface KanjiCandidate {
  text: string
  reading: string
}

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  defaultMode?: 'japanese' | 'english'
  onModeChange?: (mode: 'japanese' | 'english') => void
}

/**
 * Romaji → kana IME for intermediate+ users (level 3+).
 * - Japanese mode: wanakana binds to the textarea, romaji is converted to
 *   hiragana on the fly. After 2+ hiragana characters at the end of the
 *   buffer, kanji candidates are fetched from /api/japanese/convert and
 *   shown above the input. Tapping a candidate replaces the trailing
 *   hiragana run with the chosen kanji.
 * - English mode: plain text input, no conversion.
 */
export function JapaneseInput({
  onSend,
  disabled,
  defaultMode = 'japanese',
  onModeChange,
}: Props) {
  const [mode, setMode] = useState<'japanese' | 'english'>(defaultMode)
  const [value, setValue] = useState('')
  const [candidates, setCandidates] = useState<KanjiCandidate[]>([])
  const [showCandidates, setShowCandidates] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastFetchedRef = useRef<string>('')
  const fetchAbortRef = useRef<AbortController | null>(null)

  // Bind / unbind wanakana when mode flips.
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    if (mode !== 'japanese') return

    try {
      wanakana.bind(input, {
        IMEMode: 'toHiragana',
        useObsoleteKana: false,
        convertLongVowelMark: true,
      })
    } catch {
      // wanakana throws if already bound; safe to ignore
    }

    return () => {
      try {
        wanakana.unbind(input)
      } catch {}
    }
  }, [mode])

  const getLastHiraganaSegment = useCallback((text: string): string => {
    const match = text.match(/[ぁ-ん]+$/)
    return match ? match[0] : ''
  }, [])

  const fetchKanjiCandidates = useCallback(async (hiragana: string) => {
    if (!hiragana || hiragana.length < 2) return
    if (lastFetchedRef.current === hiragana) return
    lastFetchedRef.current = hiragana

    if (fetchAbortRef.current) fetchAbortRef.current.abort()
    const controller = new AbortController()
    fetchAbortRef.current = controller

    try {
      const res = await fetch(
        `/api/japanese/convert?reading=${encodeURIComponent(hiragana)}`,
        { signal: controller.signal },
      )
      const data = await res.json()
      if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
        setCandidates(data.candidates)
        setShowCandidates(true)
      }
    } catch {
      /* aborted or network error — silent */
    }
  }, [])

  // Watch the input value (which wanakana mutates) and re-fetch candidates
  // for the trailing hiragana run.
  useEffect(() => {
    if (mode !== 'japanese') {
      setCandidates([])
      setShowCandidates(false)
      return
    }
    if (!value.trim()) {
      setCandidates([])
      setShowCandidates(false)
      lastFetchedRef.current = ''
      return
    }
    const lastSegment = getLastHiraganaSegment(value)
    if (lastSegment.length >= 2) {
      // Debounce a bit so quick typing doesn't fire on every keystroke
      const t = setTimeout(() => fetchKanjiCandidates(lastSegment), 250)
      return () => clearTimeout(t)
    } else {
      setCandidates([])
      setShowCandidates(false)
    }
  }, [value, mode, getLastHiraganaSegment, fetchKanjiCandidates])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
    },
    [],
  )

  const applyCandidate = (candidate: KanjiCandidate) => {
    const lastSegment = getLastHiraganaSegment(value)
    if (!lastSegment) return
    const newValue = value.slice(0, value.length - lastSegment.length) + candidate.text
    setValue(newValue)
    setCandidates([])
    setShowCandidates(false)
    lastFetchedRef.current = ''
    inputRef.current?.focus()
  }

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    setCandidates([])
    setShowCandidates(false)
    lastFetchedRef.current = ''
  }, [value, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Space → first kanji candidate (only if visible)
    if (e.key === ' ' && showCandidates && candidates.length > 0) {
      e.preventDefault()
      applyCandidate(candidates[0])
      return
    }
    if (e.key === 'Escape') {
      setShowCandidates(false)
      return
    }
    // Enter sends — but if the candidate bar is open, first close it
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showCandidates) {
        setShowCandidates(false)
      } else {
        handleSend()
      }
    }
  }

  const switchMode = (newMode: 'japanese' | 'english') => {
    if (newMode === mode) return
    setMode(newMode)
    setValue('')
    setCandidates([])
    setShowCandidates(false)
    lastFetchedRef.current = ''
    onModeChange?.(newMode)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div
      className="bg-[#FDFBF8] border-t border-[#E0DAD2] shrink-0"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      {/* Kanji candidate bar */}
      {showCandidates && candidates.length > 0 && (
        <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-[#E0DAD2] bg-[#F5F0EB]">
          {candidates.map((candidate, i) => (
            <button
              key={`${candidate.text}-${i}`}
              onClick={() => applyCandidate(candidate)}
              className={`shrink-0 px-3 py-1.5 rounded-[6px] text-sm transition-all border ${
                i === 0
                  ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                  : 'bg-[#FDFBF8] text-[#1A1814] border-[#E0DAD2] hover:border-[#1B4F8A]'
              }`}
              style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
            >
              <span>{candidate.text}</span>
              {candidate.reading && i > 0 && candidate.reading !== candidate.text && (
                <span
                  className="text-[10px] text-[#9E9892] ml-1"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {candidate.reading}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setShowCandidates(false)}
            aria-label="Hide candidates"
            className="shrink-0 px-2 py-1.5 text-[#9E9892] hover:text-[#6B6560] transition-colors"
          >
            <X size={12} weight="bold" />
          </button>
        </div>
      )}

      {/* Mode toggle + input */}
      <div className="px-3 pt-2">
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => switchMode('japanese')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mode === 'japanese'
                ? 'bg-[#1B4F8A] text-white'
                : 'bg-[#F5F0EB] text-[#9E9892] hover:text-[#6B6560]'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>日</span>
            <span>Japanese</span>
          </button>
          <button
            onClick={() => switchMode('english')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mode === 'english'
                ? 'bg-[#1B4F8A] text-white'
                : 'bg-[#F5F0EB] text-[#9E9892] hover:text-[#6B6560]'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <span>A</span>
            <span>English</span>
          </button>
          {mode === 'japanese' && (
            <span
              className="ml-auto text-[10px] text-[#9E9892] self-center"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              type romaji → hiragana
            </span>
          )}
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'japanese' ? 'romaji → かな  (space for kanji)' : 'Type in English...'}
            rows={1}
            disabled={disabled}
            lang={mode === 'japanese' ? 'ja' : 'en'}
            className="flex-1 px-3 py-2.5 rounded-[8px] border-2 border-[#E0DAD2] bg-[#F5F0EB] outline-none focus:border-[#1B4F8A] transition-colors resize-none text-sm text-[#1A1814] placeholder-[#C8C3BC] disabled:opacity-50"
            style={{
              fontFamily:
                mode === 'japanese' ? 'Noto Sans JP, sans-serif' : 'DM Sans, sans-serif',
              lineHeight: 1.5,
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={`w-10 h-10 rounded-[8px] flex items-center justify-center text-white transition-all shrink-0 ${
              value.trim() && !disabled
                ? 'bg-[#1B4F8A] hover:bg-[#4A7AB5] active:translate-y-px'
                : 'bg-[#E0DAD2] cursor-not-allowed'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
          </button>
        </div>

        {/* Romaji preview while typing in Japanese mode */}
        {mode === 'japanese' && value && (
          <p
            className="text-[10px] text-[#9E9892] mt-1 ml-1"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {wanakana.toRomaji(value)}
          </p>
        )}
      </div>
    </div>
  )
}

export default JapaneseInput
