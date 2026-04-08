'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from 'react'
import type { TraceBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

interface Props {
  block: TraceBlock
  onComplete: (xp: number) => void
  freewriteOnly?: boolean
}

type Phase = 'watch' | 'practice' | 'correct' | 'done'

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
  const currentChar = block.characters[charIndex]

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

    writerRef.current = null
    containerRef.current.innerHTML = ''

    const char = block.characters[charIndex].character

    try {
      writerRef.current = HanziWriter.create(containerRef.current, char, {
        width: 280,
        height: 280,
        padding: 20,
        showOutline: true,
        showCharacter: false,
        strokeColor: '#1A1A2E',
        outlineColor: '#E5E7EB',
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
  }, [charIndex, block.characters, playAudio])

  // Load HanziWriter dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return
    import('hanzi-writer').then(mod => {
      HanziWriter = mod.default || mod
      initWriter()
    }).catch(e => {
      console.error('Failed to load hanzi-writer:', e)
      setReady(true)
    })
  }, [])

  // Re-init on character change
  useEffect(() => {
    if (HanziWriter) {
      setReady(false)
      setPhase('watch')
      setCorrectStrokes(0)
      setMistakes(0)
      initWriter()
    }
  }, [charIndex, initWriter])

  const watchAgain = () => {
    if (!writerRef.current) return
    setPhase('watch')
    setCorrectStrokes(0)
    writerRef.current.hideCharacter()
    writerRef.current.showOutline()
    writerRef.current.animateCharacter({
      strokeAnimationSpeed: 0.8,
      delayBetweenStrokes: 500,
    })
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
        writerRef.current?.showCharacter()
        playAudio(currentChar.character)

        setTimeout(() => {
          if (charIndex < block.characters.length - 1) {
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
      <p className="font-black text-2xl text-[#1B4F8A]" style={{ fontFamily: 'Nunito' }}>
        {block.characters.map(c => c.character).join('・')} practiced!
      </p>
      <Button variant="primary" size="lg" fullWidth onClick={() => onComplete(block.xpReward)}>
        Continue +{block.xpReward} XP ⚡
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg text-[#1B4F8A]" style={{ fontFamily: 'Nunito' }}>
          {phase === 'watch' ? 'Watch the stroke order' : phase === 'correct' ? '✓ Perfect!' : 'Now you try'}
        </h3>
        <span className="text-sm text-gray-400 font-bold" style={{ fontFamily: 'Nunito' }}>
          {charIndex + 1} / {block.characters.length}
        </span>
      </div>

      {/* Phase indicator */}
      <div className={`rounded-[14px] px-4 py-2.5 border transition-all ${
        phase === 'watch' ? 'bg-[#EBF0F8] border-[#B8CBE0]' :
        phase === 'correct' ? 'bg-[#E5F9D0] border-[#89E219]' :
        'bg-[#FFF3CC] border-[#FFB800]'
      }`}>
        <p className={`text-sm font-bold ${
          phase === 'watch' ? 'text-[#1B4F8A]' : phase === 'correct' ? 'text-[#2D8800]' : 'text-[#CC7700]'
        }`} style={{ fontFamily: 'Nunito' }}>
          {phase === 'watch' ? '👀 Watch carefully — then try it yourself'
            : phase === 'correct' ? '🎉 You got it!'
            : `✏️ Draw each stroke in order${mistakes > 0 ? ` — ${mistakes} miss${mistakes > 1 ? 'es' : ''}, hint coming` : ''}`}
        </p>
      </div>

      {/* HanziWriter canvas */}
      <div className="flex justify-center">
        <div className="relative bg-white rounded-[24px] overflow-hidden shadow-[0_6px_0_rgba(0,0,0,0.06)] border-2 transition-all duration-300" style={{
          width: 280, height: 280,
          borderColor: phase === 'correct' ? '#58CC02' : phase === 'practice' ? '#1B4F8A' : '#E5E7EB',
        }}>
          {/* Grid lines */}
          <svg className="absolute inset-0 pointer-events-none" width={280} height={280}>
            <line x1={140} y1={4} x2={140} y2={276} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="6,4" />
            <line x1={4} y1={140} x2={276} y2={140} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="6,4" />
          </svg>

          {/* HanziWriter renders here */}
          <div ref={containerRef} className="absolute inset-0" />

          {/* Loading */}
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-4xl animate-pulse" style={{ fontFamily: 'Noto Sans JP' }}>{currentChar.character}</div>
            </div>
          )}

          {/* Correct overlay */}
          {phase === 'correct' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-5xl bounce-in">✓</div>
            </div>
          )}
        </div>
      </div>

      {/* Stroke progress */}
      {phase === 'practice' && totalStrokes > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 font-bold mb-1" style={{ fontFamily: 'Nunito' }}>
            <span>Strokes</span>
            <span>{correctStrokes} / {totalStrokes}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1B4F8A] rounded-full transition-all duration-300" style={{ width: `${(correctStrokes / totalStrokes) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Character info */}
      <div className="flex items-center gap-4 bg-[#EBF0F8] rounded-[16px] p-4">
        <div className="text-center">
          <p className="text-4xl font-black text-[#1A1A2E]" style={{ fontFamily: 'Noto Sans JP' }}>{currentChar.character}</p>
          <p className="text-xs font-mono text-[#1B4F8A] mt-0.5">{currentChar.romaji}</p>
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800" style={{ fontFamily: 'Nunito' }}>{currentChar.english}</p>
          {currentChar.memoryHook && (
            <p className="text-xs text-gray-500 italic mt-1" style={{ fontFamily: 'Nunito' }}>💡 {currentChar.memoryHook}</p>
          )}
        </div>
        <button onClick={() => playAudio(currentChar.character)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm hover:bg-[#dbe6f5] transition-colors shrink-0">
          🔊
        </button>
      </div>

      {/* Action buttons */}
      {phase === 'watch' && ready && (
        <div className="space-y-2">
          <Button variant="primary" size="lg" fullWidth onClick={startPractice}>
            I&apos;m ready to try →
          </Button>
          <button onClick={watchAgain} className="w-full text-center text-sm text-[#1B4F8A] font-bold py-2 hover:underline" style={{ fontFamily: 'Nunito' }}>
            ↺ Watch again
          </button>
        </div>
      )}

      {phase === 'practice' && (
        <div className="space-y-2">
          <p className="text-center text-xs text-gray-400" style={{ fontFamily: 'Nunito' }}>Draw directly on the character above</p>
          <button onClick={watchAgain} className="w-full text-center text-sm text-gray-400 font-bold py-1.5 hover:text-[#1B4F8A] transition-colors" style={{ fontFamily: 'Nunito' }}>
            ← Watch stroke order again
          </button>
        </div>
      )}
    </div>
  )
}

export default TraceBlockRenderer
