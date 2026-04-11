'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo } from 'react'
import type { HiraganaIntroBlock } from '@/types/lesson-blocks'
import { CharacterAnimator } from './CharacterAnimator'

interface Props {
  block: HiraganaIntroBlock
  onComplete: (xp: number) => void
}

type Phase = 'recognize' | 'watch' | 'quiz'

const HIRAGANA_POOL = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'.split('')

function playTTS(text: string, rate = 0.7) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = rate
    speechSynthesis.speak(u)
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function HiraganaIntroBlockRenderer({ block, onComplete }: Props) {
  const [charIndex, setCharIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('recognize')
  const [allDone, setAllDone] = useState(false)
  const [, setWriterReady] = useState(false)
  const [wrongPick, setWrongPick] = useState<string | null>(null)
  const [correctPick, setCorrectPick] = useState<string | null>(null)
  const [watchReplayKey, setWatchReplayKey] = useState(0)

  const currentChar = block.characters[charIndex]

  // Reseed distractors per character
  const quizOptions = useMemo(() => {
    const pool = HIRAGANA_POOL.filter(c => c !== currentChar.character)
    const distractors = shuffle(pool).slice(0, 3)
    return shuffle([currentChar.character, ...distractors])
  }, [currentChar.character])

  // Phase 1: auto-play TTS once on mount per character
  useEffect(() => {
    if (phase === 'recognize') {
      const t = setTimeout(() => playTTS(currentChar.character), 300)
      return () => clearTimeout(t)
    }
  }, [phase, currentChar.character])

  // Reset ready flag when entering watch phase for a new character
  useEffect(() => {
    if (phase === 'watch') setWriterReady(false)
  }, [phase, currentChar.character])

  const replayWriter = () => {
    setWriterReady(false)
    setWatchReplayKey(k => k + 1)
  }

  const handlePick = (option: string) => {
    if (correctPick) return
    if (option === currentChar.character) {
      setCorrectPick(option)
      playTTS(option)
      setTimeout(() => {
        setCorrectPick(null)
        setWrongPick(null)
        if (charIndex < block.characters.length - 1) {
          setCharIndex(i => i + 1)
          setPhase('recognize')
        } else {
          setAllDone(true)
        }
      }, 600)
    } else {
      setWrongPick(option)
      setTimeout(() => setWrongPick(null), 500)
    }
  }

  // ── DONE ──
  if (allDone) {
    return (
      <div className="ink-in space-y-6 text-center">
        <div className="bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] p-8 space-y-6">
          <p
            className="text-sm text-[#1A1814] leading-relaxed"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            You can now recognize these characters anywhere in Japanese
          </p>
          <p
            className="text-6xl text-[#1A1814]"
            style={{ fontFamily: 'Noto Sans JP, sans-serif', fontWeight: 400 }}
          >
            {block.characters.map(c => c.character).join(' ')}
          </p>
        </div>
        <button
          onClick={() => onComplete(block.xpReward)}
          className="bg-[#1B4F8A] text-white rounded-[8px] py-3 px-6 hover:bg-[#4A7AB5] active:translate-y-px w-full font-semibold"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Continue +{block.xpReward} XP
        </button>
      </div>
    )
  }

  const phases: Phase[] = ['recognize', 'watch', 'quiz']

  return (
    <div className="space-y-4">
      {/* Title */}
      {block.title && (
        <h3
          className="text-xl text-[#1A1814] text-center"
          style={{ fontFamily: 'Shippori Mincho, serif' }}
        >
          {block.title}
        </h3>
      )}

      {/* Phase progress dots + char index */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {phases.map((p) => {
            const activeIdx = phases.indexOf(phase)
            const pIdx = phases.indexOf(p)
            return (
              <div
                key={p}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: pIdx === activeIdx ? 20 : 6,
                  backgroundColor:
                    pIdx < activeIdx ? '#3D6B4F' : pIdx === activeIdx ? '#1B4F8A' : '#E0DAD2',
                }}
              />
            )
          })}
        </div>
        <span
          className="text-xs text-[#9E9892] font-semibold tracking-wider uppercase"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {charIndex + 1} / {block.characters.length}
        </span>
      </div>

      {/* PHASE 1: RECOGNIZE */}
      {phase === 'recognize' && (
        <div key={`recognize-${charIndex}`} className="ink-in bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] p-6 space-y-5">
          <div className="text-center space-y-2">
            <p
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontWeight: 300,
                fontSize: '120px',
                color: '#1A1814',
                lineHeight: 1,
              }}
            >
              {currentChar.character}
            </p>
            <p
              style={{
                fontFamily: 'DM Mono, monospace',
                color: '#9E9892',
                fontSize: '16px',
              }}
            >
              {currentChar.romaji}
            </p>
          </div>

          <p
            className="text-center text-[#1A1814]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            This is {currentChar.character} — pronounced &lsquo;{currentChar.romaji}&rsquo;
          </p>

          <div className="bg-[#F5F0EB] rounded-[8px] px-4 py-3">
            <p
              className="text-xs text-[#6B6560] italic text-center"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              💡 {currentChar.mnemonic}
            </p>
          </div>

          <p
            className="text-center text-xs text-[#9E9892]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Appeared in: <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>{currentChar.appearedIn}</span>
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => playTTS(currentChar.character)}
              className="text-sm text-[#1B4F8A] font-semibold py-2 hover:underline"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              🔊 Listen again
            </button>
          </div>

          <button
            onClick={() => setPhase('watch')}
            className="w-full bg-[#1B4F8A] text-white rounded-[8px] py-3 px-6 hover:bg-[#4A7AB5] active:translate-y-px font-semibold"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Watch how to write →
          </button>
        </div>
      )}

      {/* PHASE 2: WATCH */}
      {phase === 'watch' && (
        <div key={`watch-${charIndex}`} className="ink-in bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] p-6 space-y-5">
          <p
            className="text-center text-sm text-[#1A1814]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Watch how <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>{currentChar.character}</span> is written
          </p>

          <div className="flex justify-center">
            <div
              className="relative bg-[#FDFBF8] rounded-[8px] overflow-hidden border border-[#E0DAD2]"
              style={{ width: 280, height: 280 }}
            >
              <svg className="absolute inset-0 pointer-events-none" width={280} height={280}>
                <line x1={140} y1={4} x2={140} y2={276} stroke="#C8C3BC" strokeWidth={0.8} strokeDasharray="6,4" />
                <line x1={4} y1={140} x2={276} y2={140} stroke="#C8C3BC" strokeWidth={0.8} strokeDasharray="6,4" />
              </svg>
              <div className="absolute inset-0">
                <CharacterAnimator
                  key={`${currentChar.character}-${watchReplayKey}`}
                  character={currentChar.character}
                  width={280}
                  height={280}
                  strokeColor="#1B4F8A"
                  autoAnimate={phase === 'watch'}
                  onAnimationComplete={() => setWriterReady(true)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={replayWriter}
              className="text-sm text-[#1B4F8A] font-semibold py-2 hover:underline"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              ↺ Replay
            </button>
          </div>

          <button
            onClick={() => setPhase('quiz')}
            className="w-full bg-[#1B4F8A] text-white rounded-[8px] py-3 px-6 hover:bg-[#4A7AB5] active:translate-y-px font-semibold"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            I&apos;m ready to try →
          </button>
        </div>
      )}

      {/* PHASE 3: QUIZ */}
      {phase === 'quiz' && (
        <div key={`quiz-${charIndex}`} className="ink-in bg-[#FDFBF8] border border-[#E0DAD2] rounded-[10px] p-6 space-y-5">
          <p
            className="text-center text-[#1A1814]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Which one makes the sound &lsquo;
            <span style={{ fontFamily: 'DM Mono, monospace' }}>{currentChar.romaji}</span>
            &rsquo;?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {quizOptions.map((option) => {
              const isWrong = wrongPick === option
              const isCorrect = correctPick === option
              return (
                <button
                  key={option}
                  onClick={() => handlePick(option)}
                  disabled={!!correctPick}
                  className={`aspect-square rounded-[10px] border-2 flex items-center justify-center transition-all ${
                    isWrong ? 'shake' : ''
                  }`}
                  style={{
                    backgroundColor: isCorrect
                      ? '#EFF5F0'
                      : isWrong
                        ? '#F5EEEE'
                        : '#FDFBF8',
                    borderColor: isCorrect
                      ? '#B8D4C0'
                      : isWrong
                        ? '#8B3A3A'
                        : '#E0DAD2',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Noto Sans JP, sans-serif',
                      fontWeight: 400,
                      fontSize: '64px',
                      color: '#1A1814',
                      lineHeight: 1,
                    }}
                  >
                    {option}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
