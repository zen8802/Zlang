'use client'

import { useState, useRef, useEffect } from 'react'
import { SpeakerHigh, Microphone, Stop } from '@phosphor-icons/react'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'

interface Props {
  kanji: KyouikuKanji
  onComplete: () => void
}

type SpeakState =
  | 'listen'
  | 'ready'
  | 'recording'
  | 'checking'
  | 'correct'
  | 'incorrect'

// Convert katakana → hiragana for matching purposes
function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  )
}

export function SpeakPhase({ kanji, onComplete }: Props) {
  const [state, setState] = useState<SpeakState>('listen')
  const [attempts, setAttempts] = useState(0)
  const [transcript, setTranscript] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const targetReading =
    kanji.kunReading[0]?.replace(/[-.]/g, '') ||
    kanji.onReading[0] ||
    ''

  // Cleanup any active recognition on unmount
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort?.()
      } catch {
        /* noop */
      }
    }
  }, [])

  const playPronunciation = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(kanji.character)
    u.lang = 'ja-JP'
    u.rate = 0.7
    u.pitch = 1.0
    window.speechSynthesis.speak(u)
    if (state === 'listen') setState('ready')
  }

  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition: any =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))

    if (!SpeechRecognition) {
      // Speech recognition not supported — manual pass.
      setState('correct')
      setTimeout(() => onComplete(), 1200)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 5
    recognitionRef.current = recognition

    recognition.onstart = () => setState('recording')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      setState('checking')
      setAttempts((a) => a + 1)

      const alts = event.results[0]
      const transcripts: string[] = []
      for (let i = 0; i < alts.length; i++) {
        transcripts.push(alts[i].transcript.trim())
      }
      setTranscript(transcripts[0] || '')

      // Flexible matching — accept the character itself or any reading
      const isCorrect = transcripts.some((raw) => {
        const t = raw.replace(/\s/g, '')
        const tHira = toHiragana(t)
        if (t === kanji.character) return true
        if (t.includes(kanji.character)) return true
        const allReadings = [
          ...kanji.kunReading.map((r) => r.replace(/[-.]/g, '')),
          ...kanji.onReading.map((r) => r.replace(/[-.]/g, '')),
        ]
        return allReadings.some((r) => {
          if (!r) return false
          const rHira = toHiragana(r)
          return tHira === rHira || tHira.includes(rHira) || rHira.includes(tHira)
        })
      })

      if (isCorrect) {
        setState('correct')
        setTimeout(() => onComplete(), 1500)
      } else {
        setState('incorrect')
      }
    }

    recognition.onerror = () => {
      setState('ready')
    }

    recognition.onend = () => {
      setState((prev) => (prev === 'recording' ? 'ready' : prev))
    }

    try {
      recognition.start()
    } catch {
      setState('ready')
    }
  }

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col items-center px-6 py-8 space-y-8">
      {/* Instructions */}
      <div className="text-center space-y-1">
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '20px', color: '#1A1814' }}>
          {state === 'listen' ? 'Listen first' : 'Now say it'}
        </p>
        <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans' }}>
          {state === 'listen'
            ? 'Tap the character to hear the pronunciation'
            : state === 'recording'
              ? 'Listening...'
              : state === 'correct'
                ? '✓ Correct pronunciation'
                : state === 'incorrect'
                  ? `Heard: ${transcript || '?'} — try again`
                  : 'Tap the mic when ready'}
        </p>
      </div>

      {/* Tap to play */}
      <button
        onClick={playPronunciation}
        className="relative flex items-center justify-center rounded-[20px] transition-all active:scale-95"
        style={{
          width: 160,
          height: 160,
          backgroundColor: state === 'correct' ? '#FEF3C7' : 'white',
          border: state === 'correct' ? '2px solid #C9920A' : '1.5px solid #E0DAD2',
          boxShadow:
            state === 'correct'
              ? '0 0 24px rgba(201,146,10,0.2)'
              : '0 2px 16px rgba(26,24,20,0.06)',
          transition: 'all 0.4s ease',
        }}
      >
        <p
          style={{
            fontFamily: 'Noto Sans JP',
            fontSize: '72px',
            fontWeight: 300,
            color: state === 'correct' ? '#C9920A' : '#1A1814',
            lineHeight: 1,
            transition: 'color 0.4s ease',
          }}
        >
          {kanji.character}
        </p>

        <div
          className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[#6B6560]"
          style={{ backgroundColor: '#F5F0EB' }}
        >
          <SpeakerHigh size={12} weight="regular" />
        </div>
      </button>

      {/* Reading display */}
      <div className="text-center space-y-1">
        <p
          style={{
            fontFamily: 'Noto Sans JP',
            fontSize: '20px',
            color: '#6B6560',
            fontWeight: 300,
          }}
        >
          {targetReading}
        </p>
        {kanji.onReading[0] && (
          <p style={{ fontFamily: 'DM Mono', fontSize: '13px', color: '#C8C3BC' }}>
            音: {kanji.onReading.join(' · ')}
          </p>
        )}
      </div>

      {/* Mic */}
      {state !== 'listen' && state !== 'correct' && (
        <div className="flex flex-col items-center gap-3">
          <button
            onMouseDown={state === 'ready' || state === 'incorrect' ? startRecording : stopRecording}
            onMouseUp={state === 'recording' ? stopRecording : undefined}
            onTouchStart={state === 'ready' || state === 'incorrect' ? startRecording : stopRecording}
            onTouchEnd={state === 'recording' ? stopRecording : undefined}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all ${
              state === 'recording' ? 'scale-110' : 'hover:scale-105 active:scale-95'
            }`}
            style={{
              backgroundColor: state === 'recording' ? '#8B3A3A' : '#1B4F8A',
              boxShadow:
                state === 'recording'
                  ? '0 0 0 8px rgba(139,58,58,0.15), 0 0 0 16px rgba(139,58,58,0.08)'
                  : '0 4px 16px rgba(27,79,138,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {state === 'recording'
              ? <Stop size={28} weight="fill" />
              : <Microphone size={28} weight="regular" />}
          </button>

          <p className="text-xs text-[#9E9892]" style={{ fontFamily: 'DM Sans' }}>
            {state === 'recording' ? 'Release to check' : 'Hold to speak'}
          </p>
        </div>
      )}

      {/* Skip option after repeated failures */}
      {attempts >= 3 && state === 'incorrect' && (
        <button
          onClick={onComplete}
          className="text-xs text-[#9E9892] hover:text-[#6B6560] transition-colors"
          style={{ fontFamily: 'DM Sans' }}
        >
          Continue anyway →
        </button>
      )}
    </div>
  )
}
