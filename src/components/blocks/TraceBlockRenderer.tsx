'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { TraceBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'
import { CharacterWriteCanvas } from './CharacterWriteCanvas'
import { getCharType } from './CharacterAnimator'
import { StrokeAnimation } from '@/components/japanese/StrokeAnimation'
import { useAppStore } from '@/store/useAppStore'

const BEGINNER_KANJI = ['一','二','三','四','五','日','月','山','川','木','火','水','人','口','大','小']

interface Props {
  block: TraceBlock
  onComplete: (xp: number) => void
  freewriteOnly?: boolean
}

type Phase = 'watch' | 'practice' | 'write' | 'correct' | 'done'

let HanziWriter: any = null

export function TraceBlockRenderer({ block, onComplete }: Props) {
  const [charIndex, setCharIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('watch')
  const [mistakes, setMistakes] = useState(0)
  const [correctStrokes, setCorrectStrokes] = useState(0)
  const [totalStrokes, setTotalStrokes] = useState(0)
  const [allDone, setAllDone] = useState(false)
  const [ready, setReady] = useState(false)

  const writerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const userProfile = useAppStore((s) => s.userProfile)
  const isAbsoluteBeginner = (userProfile?.experience ?? 1) <= 4

  const safeCharacters = useMemo(() => {
    return block.characters.map(char => {
      if (!isAbsoluteBeginner) return char
      const code = char.character.charCodeAt(0)
      const isHiragana = code >= 0x3041 && code <= 0x3096
      const isKatakana = code >= 0x30a0 && code <= 0x30ff
      const isBeginnerKanji = BEGINNER_KANJI.includes(char.character)
      if (isHiragana || isKatakana || isBeginnerKanji) return char
      // Complex kanji — substitute first character of the reading
      const fallback = (char.reading || char.character).slice(0, 1)
      return {
        ...char,
        character: fallback,
        memoryHook: `This is the hiragana for ${char.english}. The kanji comes later.`,
      }
    })
  }, [block.characters, isAbsoluteBeginner])

  const currentChar = safeCharacters[charIndex]
  const currentCharType = currentChar ? getCharType(currentChar.character) : 'kanji'
  const isKanji = currentCharType === 'kanji'

  const playAudio = useCallback((char: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(char)
      u.lang = 'ja-JP'
      u.rate = 0.7
      speechSynthesis.speak(u)
    }
  }, [])

  const initWriter = useCallback(() => {
    if (!HanziWriter || !containerRef.current) return
    // Only use hanzi-writer for kanji — kana is handled by CharacterAnimator
    if (getCharType(safeCharacters[charIndex].character) !== 'kanji') return

    writerRef.current = null
    containerRef.current.innerHTML = ''

    const char = safeCharacters[charIndex].character

    try {
      writerRef.current = HanziWriter.create(containerRef.current, char, {
        width: 280,
        height: 280,
        padding: 20,
        showOutline: true,
        showCharacter: false,
        strokeColor: '#1A1814',
        outlineColor: '#E0DAD2',
        highlightColor: '#1B4F8A',
        drawingColor: '#1B4F8A',
        drawingWidth: 5,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 400,
        charDataLoader: (c: string, onLoad: any) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(c)}.json`)
            .then(r => r.json())
            .then(onLoad)
            .catch(() => {
              console.error('Could not load character data for:', c)
              setReady(true)
            })
        },
        onLoadCharDataSuccess: () => {
          setReady(true)
          try {
            const strokes = writerRef.current?._character?._strokes
            if (strokes) setTotalStrokes(strokes.length)
          } catch { /* ignore */ }
          // Auto-animate
          writerRef.current?.animateCharacter({
            strokeAnimationSpeed: 0.8,
            delayBetweenStrokes: 500,
          })
          playAudio(char)
        },
      })
    } catch (e) {
      console.error('HanziWriter init error:', e)
      setReady(true)
    }
  }, [charIndex, safeCharacters, playAudio])

  // Load HanziWriter dynamically (kanji only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isKanji) return
    import('hanzi-writer').then(mod => {
      HanziWriter = mod.default || mod
      initWriter()
    }).catch(e => {
      console.error('Failed to load hanzi-writer:', e)
      setReady(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKanji])

  // Re-init on character change
  useEffect(() => {
    setPhase('watch')
    setCorrectStrokes(0)
    setMistakes(0)
    if (isKanji) {
      if (HanziWriter) {
        setReady(false)
        initWriter()
      }
    } else {
      // Kana: StrokeAnimation handles rendering; onComplete will set ready
      setReady(false)
      setTotalStrokes(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIndex, isKanji])

  const [kanaReplayKey, setKanaReplayKey] = useState(0)
  const watchAgain = () => {
    setPhase('watch')
    setCorrectStrokes(0)
    if (isKanji) {
      if (!writerRef.current) return
      writerRef.current.hideCharacter()
      writerRef.current.showOutline()
      writerRef.current.animateCharacter({
        strokeAnimationSpeed: 0.8,
        delayBetweenStrokes: 500,
      })
    } else {
      setKanaReplayKey(k => k + 1)
    }
  }

  const startPractice = () => {
    if (!writerRef.current) return
    setPhase('practice')
    setCorrectStrokes(0)
    setMistakes(0)

    writerRef.current.hideCharacter()
    writerRef.current.showOutline()

    writerRef.current.quiz({
      showHintAfterMisses: 2,
      leniency: 0.8,
      onMistake: (data: any) => {
        setMistakes(data.mistakesOnStroke || 0)
      },
      onCorrectStroke: (data: any) => {
        setCorrectStrokes((data.strokeNum || 0) + 1)
        setMistakes(0)
      },
      onComplete: () => {
        setPhase('correct')
        // DON'T call showCharacter() — keep the user's drawn strokes visible
        playAudio(currentChar.character)

        setTimeout(() => {
          if (charIndex < safeCharacters.length - 1) {
            setCharIndex(i => i + 1)
          } else {
            setAllDone(true)
          }
        }, 1500)
      },
    })
  }

  // ── DONE ──
  if (allDone) return (
    <div className="text-center space-y-5 page-enter">
      <div className="text-6xl">✍️</div>
      <p className="font-semibold text-2xl text-[#1B4F8A]">
        {safeCharacters.map(c => c.character).join('・')} practiced!
      </p>
      <Button variant="primary" size="lg" fullWidth onClick={() => onComplete(block.xpReward)}>
        Continue +{block.xpReward} XP
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-[#1B4F8A]">
          {phase === 'watch' ? 'Watch the stroke order' : phase === 'correct' ? '✓ Perfect!' : 'Now you try'}
        </h3>
        <span className="text-sm text-[#9E9892] font-semibold">
          {charIndex + 1} / {safeCharacters.length}
        </span>
      </div>

      {/* Phase indicator — hidden during write phase (CharacterWriteCanvas has its own UI) */}
      {phase !== 'write' && (<>
      {/* Phase indicator */}
      <div className={`rounded-[8px] px-4 py-2.5 border transition-all ${
        phase === 'watch' ? 'bg-[#EBF0F8] border-[#B8CBE0]' :
        phase === 'correct' ? 'bg-[#EFF5F0] border-[#B8D4C0]' :
        'bg-[#F5F0E8] border-[#D4C4A8]'
      }`}>
        <p className={`text-sm font-semibold ${
          phase === 'watch' ? 'text-[#1B4F8A]' : phase === 'correct' ? 'text-[#3D6B4F]' : 'text-[#7A5C2E]'
        }`}>
          {phase === 'watch' ? 'Watch carefully — then try it yourself'
            : phase === 'correct' ? 'You got it!'
            : `Draw each stroke in order${mistakes > 0 ? ` — ${mistakes} miss${mistakes > 1 ? 'es' : ''}, hint coming` : ''}`}
        </p>
      </div>

      {/* HanziWriter canvas */}
      <div className="flex justify-center">
        <div className="relative bg-[#FDFBF8] rounded-[8px] overflow-hidden border transition-all duration-300" style={{
          width: 280, height: 280,
          borderColor: phase === 'correct' ? '#B8D4C0' : phase === 'practice' ? '#1B4F8A' : '#E0DAD2',
        }}>
          {/* Grid lines */}
          <svg className="absolute inset-0 pointer-events-none" width={280} height={280}>
            <line x1={140} y1={4} x2={140} y2={276} stroke="#C8C3BC" strokeWidth={0.8} strokeDasharray="6,4" />
            <line x1={4} y1={140} x2={276} y2={140} stroke="#C8C3BC" strokeWidth={0.8} strokeDasharray="6,4" />
          </svg>

          {/* HanziWriter (kanji) or CharacterAnimator (kana) renders here */}
          {isKanji ? (
            <>
              <div ref={containerRef} className="absolute inset-0" />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#FDFBF8]/80">
                  <div className="text-4xl" style={{ fontFamily: 'Noto Sans JP' }}>{currentChar.character}</div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <StrokeAnimation
                key={`${currentChar.character}-${kanaReplayKey}`}
                character={currentChar.character}
                size={240}
                autoPlay={true}
                loop={false}
                showGrid={true}
                strokeColor="#1A1814"
                speed={0.6}
                delayBetweenStrokes={350}
                onComplete={() => {
                  setReady(true)
                }}
              />
            </div>
          )}

          {/* Correct overlay — subtle green fade with checkmark */}
          {phase === 'correct' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none ink-in" style={{ backgroundColor: 'rgba(61, 107, 79, 0.08)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#EFF5F0] border border-[#B8D4C0]">
                <span className="text-3xl text-[#3D6B4F] font-semibold">✓</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stroke progress */}
      {phase === 'practice' && totalStrokes > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#9E9892] font-semibold mb-1">
            <span>Strokes</span>
            <span>{correctStrokes} / {totalStrokes}</span>
          </div>
          <div className="w-full h-2 bg-[#F5F0E8] rounded-full overflow-hidden">
            <div className="h-full bg-[#1B4F8A] rounded-full transition-all duration-300" style={{ width: `${(correctStrokes / totalStrokes) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Character info */}
      <div className="flex items-center gap-4 bg-[#FDFBF8] border border-[#E0DAD2] rounded-[8px] p-4">
        <div className="text-center">
          <p className="text-4xl font-normal text-[#1A1814]" style={{ fontFamily: 'Noto Sans JP' }}>{currentChar.character}</p>
          <p className="text-xs font-mono text-[#1B4F8A] mt-0.5">{currentChar.romaji}</p>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#1A1814]">{currentChar.english}</p>
          {currentChar.memoryHook && (
            <p className="text-xs text-[#6B6560] italic mt-1">💡 {currentChar.memoryHook}</p>
          )}
        </div>
        <button onClick={() => playAudio(currentChar.character)} className="w-10 h-10 rounded-full bg-[#EBF0F8] flex items-center justify-center text-xl hover:bg-[#dbe6f5] transition-colors shrink-0">
          🔊
        </button>
      </div>

      </>)}

      {/* Action buttons */}
      {phase === 'watch' && ready && (
        <div className="space-y-2">
          <Button variant="primary" size="lg" fullWidth onClick={() => setPhase('write')}>
            I&apos;m ready to write →
          </Button>
          <div className="flex justify-center gap-4">
            <button onClick={watchAgain} className="text-sm text-[#1B4F8A] font-semibold py-2 hover:underline">
              ↺ Watch again
            </button>
            {isKanji && (
              <button onClick={startPractice} className="text-sm text-[#9E9892] font-semibold py-2 hover:underline">
                Practice strokes
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'practice' && (
        <div className="space-y-2">
          <p className="text-center text-xs text-[#9E9892]">Draw each stroke in order on the character above</p>
          <div className="flex justify-center gap-4">
            <button onClick={watchAgain} className="text-sm text-[#9E9892] font-semibold py-1.5 hover:text-[#1B4F8A] transition-colors">
              ← Watch again
            </button>
            <button onClick={() => setPhase('write')} className="text-sm text-[#1B4F8A] font-semibold py-1.5 hover:underline">
              Write from memory →
            </button>
          </div>
        </div>
      )}

      {/* Write from memory — CharacterWriteCanvas with Google Vision */}
      {phase === 'write' && (
        <CharacterWriteCanvas
          targetCharacter={currentChar.character}
          targetReading={currentChar.reading}
          targetRomaji={currentChar.romaji}
          targetEnglish={currentChar.english}
          memoryHook={currentChar.memoryHook}
          attemptNumber={0}
          onSuccess={() => {
            setPhase('correct')
            setTimeout(() => {
              if (charIndex < safeCharacters.length - 1) {
                setCharIndex(i => i + 1)
              } else {
                setAllDone(true)
              }
            }, 1500)
          }}
          onSkip={() => {
            if (charIndex < safeCharacters.length - 1) {
              setCharIndex(i => i + 1)
            } else {
              setAllDone(true)
            }
          }}
        />
      )}
    </div>
  )
}

export default TraceBlockRenderer
