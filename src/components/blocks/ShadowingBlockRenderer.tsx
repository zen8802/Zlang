'use client'

import { useState, useCallback } from 'react'
import type { ShadowingBlock } from '@/types/lesson-blocks'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  block: ShadowingBlock
  onComplete: (xp: number) => void
}

export default function ShadowingBlockRenderer({ block, onComplete }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [attempts, setAttempts] = useState(0)

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      setTranscript('Speech recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event: { results: { item: (index: number) => { item: (index: number) => { transcript: string } } }; length: number }) => {
      const result = event.results.item(0).item(0).transcript
      setTranscript(result)
      setAttempts((a) => a + 1)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
  }, [])

  return (
    <div className="page-enter flex flex-col items-center gap-6 py-4">
      {/* Target sentence */}
      <Card variant="elevated" className="w-full text-center">
        <p className="text-3xl font-normal leading-relaxed" style={{ fontFamily: 'var(--font-jp)' }}>
          {block.targetSentence}
        </p>
        {block.targetRomaji && (
          <p className="text-sm text-[#9E9892] mt-2" style={{ fontFamily: 'var(--font-ui)' }}>
            {block.targetRomaji}
          </p>
        )}
        {block.targetEnglish && (
          <p className="text-base text-[#6B6560] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
            {block.targetEnglish}
          </p>
        )}
      </Card>

      {/* Breakdown chunks */}
      {block.breakdown.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {block.breakdown.map((chunk, i) => (
            <div
              key={i}
              className="bg-[#EBF0F8] text-[#1B4F8A] px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ fontFamily: 'var(--font-jp)' }}
            >
              {chunk.japanese}
              <span className="text-[#9E9892] ml-1 text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
                {chunk.english}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={startListening}
        disabled={listening}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-200 cursor-pointer
          ${
            listening
              ? 'bg-[#8B3A3A]'
              : 'bg-[#1B4F8A] hover:brightness-110 active:translate-y-px'
          }
        `}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'var(--font-ui)' }}>
        {listening ? 'Listening...' : 'Tap the mic and speak'}
      </p>

      {/* Transcript */}
      {transcript && (
        <Card variant="flat" className="w-full page-enter">
          <p className="text-sm text-[#6B6560] font-semibold mb-1" style={{ fontFamily: 'var(--font-ui)' }}>
            You said:
          </p>
          <p className="text-lg text-[#1A1814]" style={{ fontFamily: 'var(--font-jp)' }}>
            {transcript}
          </p>
        </Card>
      )}

      {/* Continue (after at least 1 attempt) */}
      {attempts > 0 && (
        <Button onClick={() => onComplete(block.xpReward)} fullWidth>
          Continue
        </Button>
      )}
    </div>
  )
}
