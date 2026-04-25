'use client'

import { useEffect, useCallback } from 'react'
import type { KanaCell } from '@/data/hiragana-grid'
import { StrokeAnimation } from '@/components/japanese/StrokeAnimation'

interface Props {
  char: KanaCell
  isDiscovered: boolean
  onClose: () => void
  onPractice?: () => void // kept for future use
}

export default function CharacterDetailPanel({
  char,
  isDiscovered,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPractice,
}: Props) {
  const playAudio = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const utter = new SpeechSynthesisUtterance(char.character)
    utter.lang = 'ja-JP'
    utter.rate = 0.7
    window.speechSynthesis.speak(utter)
  }, [char.character])

  // Auto-play when opened with a discovered character
  useEffect(() => {
    if (isDiscovered) {
      const timer = setTimeout(playAudio, 200)
      return () => clearTimeout(timer)
    }
  }, [isDiscovered, playAudio])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(26, 24, 20, 0.4)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] px-6 pt-6 pb-8 animate-[slide-up_0.3s_ease-out]"
        style={{ backgroundColor: '#FDFBF8' }}
      >
        {/* Close handle */}
        <div className="flex justify-center mb-4">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: '#E0DAD2' }}
          />
        </div>

        {isDiscovered ? (
          <div className="text-center">
            {/* Large character with stroke animation */}
            <StrokeAnimation
              character={char.character}
              size={180}
              autoPlay={true}
              loop={false}
              showGrid={true}
              strokeColor="#1A1814"
              speed={0.7}
              onComplete={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  const u = new SpeechSynthesisUtterance(char.character)
                  u.lang = 'ja-JP'
                  u.rate = 0.6
                  window.speechSynthesis.speak(u)
                }
              }}
            />

            {/* Romaji */}
            <div
              className="mt-1"
              style={{
                fontFamily: 'DM Mono',
                fontSize: '24px',
                color: '#1B4F8A',
              }}
            >
              {char.romaji}
            </div>

            {/* Group label */}
            <div
              className="mt-2"
              style={{
                fontFamily: 'DM Sans',
                fontSize: '12px',
                color: '#9E9892',
              }}
            >
              {char.group}
            </div>

            {/* Play button */}
            <button
              onClick={playAudio}
              className="mt-4 w-12 h-12 rounded-full flex items-center justify-center mx-auto cursor-pointer transition-colors"
              style={{
                backgroundColor: 'rgba(27, 79, 138, 0.08)',
                border: '1px solid rgba(27, 79, 138, 0.2)',
              }}
            >
              <span style={{ fontSize: '20px' }}>🔊</span>
            </button>
          </div>
        ) : (
          <div className="text-center">
            {/* Dark square with ghost character */}
            <div
              className="w-24 h-24 rounded-[12px] flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: '#DDD7CF',
                border: '1.5px solid #D4CFC8',
              }}
            >
              <span
                style={{
                  fontFamily: 'Noto Sans JP',
                  fontSize: '48px',
                  fontWeight: 300,
                  color: 'rgba(26,24,20,0.10)',
                }}
              >
                {char.character}
              </span>
            </div>

            <h3
              style={{
                fontFamily: 'Shippori Mincho',
                fontSize: '18px',
                fontWeight: 600,
                color: '#1A1814',
                marginBottom: '4px',
              }}
            >
              Not yet discovered
            </h3>
            <p
              style={{
                fontFamily: 'DM Sans',
                fontSize: '13px',
                color: '#9E9892',
              }}
            >
              This character will appear in your conversations.
              Keep practicing to discover it.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
