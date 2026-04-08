'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { TraceBlock } from '@/types/lesson-blocks'
import Button from '@/components/ui/Button'

// ── Stroke data ─────────────────────────────────────────────────────────
// Each character maps to { strokes: { path, num }[], description: string[] }
// Paths are within a 0–100 viewBox.

interface StrokeEntry {
  path: string
  num: number
}

interface CharStrokeData {
  strokes: StrokeEntry[]
  description: string[]
}

const STROKE_DATA: Record<string, CharStrokeData> = {
  '一': {
    strokes: [{ path: 'M 10,50 L 90,50', num: 1 }],
    description: ['Draw a horizontal line from left to right.'],
  },
  '二': {
    strokes: [
      { path: 'M 20,35 L 80,35', num: 1 },
      { path: 'M 10,65 L 90,65', num: 2 },
    ],
    description: [
      'Short horizontal line at top.',
      'Longer horizontal line at bottom.',
    ],
  },
  '三': {
    strokes: [
      { path: 'M 25,25 L 75,25', num: 1 },
      { path: 'M 20,50 L 80,50', num: 2 },
      { path: 'M 10,75 L 90,75', num: 3 },
    ],
    description: [
      'Short top horizontal.',
      'Medium middle horizontal.',
      'Longest bottom horizontal.',
    ],
  },
  '人': {
    strokes: [
      { path: 'M 50,15 L 25,85', num: 1 },
      { path: 'M 50,15 L 75,85', num: 2 },
    ],
    description: [
      'Left diagonal stroke downward.',
      'Right diagonal stroke downward.',
    ],
  },
  '日': {
    strokes: [
      { path: 'M 30,15 L 30,85', num: 1 },
      { path: 'M 30,15 L 70,15', num: 2 },
      { path: 'M 70,15 L 70,85', num: 3 },
      { path: 'M 30,50 L 70,50', num: 4 },
    ],
    description: [
      'Left vertical downward.',
      'Top horizontal to right.',
      'Right vertical downward.',
      'Middle horizontal bar.',
    ],
  },
  '本': {
    strokes: [
      { path: 'M 20,30 L 80,30', num: 1 },
      { path: 'M 50,10 L 50,90', num: 2 },
      { path: 'M 50,55 L 20,80', num: 3 },
      { path: 'M 50,55 L 80,80', num: 4 },
      { path: 'M 30,55 L 70,55', num: 5 },
    ],
    description: [
      'Horizontal stroke through upper part.',
      'Vertical stroke through center.',
      'Left downward diagonal.',
      'Right downward diagonal.',
      'Short horizontal at crossing point.',
    ],
  },
  '水': {
    strokes: [
      { path: 'M 50,10 L 50,90', num: 1 },
      { path: 'M 50,35 Q 30,50 15,75', num: 2 },
      { path: 'M 30,30 L 50,50', num: 3 },
      { path: 'M 50,50 L 85,75', num: 4 },
    ],
    description: [
      'Central vertical stroke.',
      'Left curving splash.',
      'Short left-to-center stroke.',
      'Right outward splash.',
    ],
  },
  '女': {
    strokes: [
      { path: 'M 65,20 Q 40,45 20,75', num: 1 },
      { path: 'M 20,45 L 80,45', num: 2 },
      { path: 'M 50,45 Q 55,70 75,85', num: 3 },
    ],
    description: [
      'Sweeping curve from upper right to lower left.',
      'Horizontal crossing stroke.',
      'Right leg extending down and out.',
    ],
  },
  '男': {
    strokes: [
      { path: 'M 20,10 L 20,45', num: 1 },
      { path: 'M 20,10 L 80,10', num: 2 },
      { path: 'M 80,10 L 80,45', num: 3 },
      { path: 'M 20,28 L 80,28', num: 4 },
      { path: 'M 20,45 L 80,45', num: 5 },
      { path: 'M 50,45 L 50,90', num: 6 },
      { path: 'M 50,60 Q 30,75 15,90', num: 7 },
    ],
    description: [
      'Left side of 田 down.',
      'Top of 田 across.',
      'Right side of 田 down.',
      'Middle horizontal of 田.',
      'Bottom of 田 across.',
      'Vertical of 力 down.',
      'Curved left stroke of 力.',
    ],
  },
  '山': {
    strokes: [
      { path: 'M 50,10 L 50,85', num: 1 },
      { path: 'M 20,35 L 20,85', num: 2 },
      { path: 'M 80,35 L 80,85', num: 3 },
    ],
    description: [
      'Tall center vertical peak.',
      'Left vertical side.',
      'Right vertical side.',
    ],
  },
  '川': {
    strokes: [
      { path: 'M 25,15 Q 22,50 25,90', num: 1 },
      { path: 'M 50,20 L 50,90', num: 2 },
      { path: 'M 75,15 Q 78,50 75,90', num: 3 },
    ],
    description: [
      'Left flowing stroke.',
      'Center vertical.',
      'Right flowing stroke.',
    ],
  },
  '火': {
    strokes: [
      { path: 'M 50,10 L 50,55', num: 1 },
      { path: 'M 25,30 L 15,65', num: 2 },
      { path: 'M 75,30 L 85,65', num: 3 },
      { path: 'M 50,55 Q 30,75 15,90', num: 4 },
      { path: 'M 50,55 Q 70,75 85,90', num: 5 },
    ],
    description: [
      'Center vertical dot-stroke.',
      'Left spark dot.',
      'Right spark dot.',
      'Left spreading leg.',
      'Right spreading leg.',
    ],
  },
  '土': {
    strokes: [
      { path: 'M 20,40 L 80,40', num: 1 },
      { path: 'M 50,10 L 50,85', num: 2 },
      { path: 'M 15,85 L 85,85', num: 3 },
    ],
    description: [
      'Middle horizontal bar.',
      'Vertical through center.',
      'Bottom wide horizontal.',
    ],
  },
  '木': {
    strokes: [
      { path: 'M 15,35 L 85,35', num: 1 },
      { path: 'M 50,10 L 50,90', num: 2 },
      { path: 'M 50,50 L 20,85', num: 3 },
      { path: 'M 50,50 L 80,85', num: 4 },
    ],
    description: [
      'Horizontal branch.',
      'Vertical trunk.',
      'Left root diagonal.',
      'Right root diagonal.',
    ],
  },
}

// Fallback for unknown characters
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFallbackData(char: string): CharStrokeData {
  return {
    strokes: [
      { path: 'M 10,50 L 90,50', num: 1 },
      { path: 'M 50,10 L 50,90', num: 2 },
    ],
    description: [
      'Horizontal guide stroke.',
      'Vertical guide stroke.',
    ],
  }
}

function getStrokeData(char: string): CharStrokeData {
  return STROKE_DATA[char] ?? getFallbackData(char)
}

// ── Props ───────────────────────────────────────────────────────────────

interface Props {
  block: TraceBlock
  onComplete: (xp: number) => void
  freewriteOnly?: boolean
}

type Mode = 'guided' | 'freewrite'

export function TraceBlockRenderer({ block, onComplete, freewriteOnly = false }: Props) {
  const characters = block.characters
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(freewriteOnly ? 'freewrite' : 'guided')
  const [currentStroke, setCurrentStroke] = useState(0)
  const [completedStrokes, setCompletedStrokes] = useState<number[]>([])
  const [done, setDone] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const pointsRef = useRef<{ x: number; y: number }[]>([])

  const char = characters[currentIndex]
  const strokeData = getStrokeData(char.character)
  const totalStrokes = strokeData.strokes.length

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = 0.7
    window.speechSynthesis.speak(u)
  }, [])

  // Speak on character load
  useEffect(() => {
    speak(char.character)
  }, [currentIndex, speak, char.character])

  // Clear canvas when mode/character changes
  useEffect(() => {
    clearCanvas()
    setCompletedStrokes([])
    setCurrentStroke(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, mode])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // ── Drawing logic ───────────────────────────

  const getPos = (e: any) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return {
        x: e.changedTouches[0].clientX - rect.left,
        y: e.changedTouches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: any) => {
    e.preventDefault()
    isDrawingRef.current = true
    pointsRef.current = [getPos(e)]
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: any) => {
    e.preventDefault()
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    pointsRef.current.push(pos)

    // Smooth quadratic bezier drawing
    const pts = pointsRef.current
    if (pts.length < 3) {
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#1B4F8A'
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1B4F8A'
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)

    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2
      const midY = (pts[i].y + pts[i + 1].y) / 2
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
    }

    const last = pts[pts.length - 1]
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
  }

  const stopDrawing = (e: any) => {
    e.preventDefault()
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    pointsRef.current = []

    if (mode === 'guided') {
      // Advance to next stroke
      const nextCompleted = [...completedStrokes, currentStroke]
      setCompletedStrokes(nextCompleted)
      clearCanvas()

      if (currentStroke + 1 < totalStrokes) {
        setCurrentStroke(currentStroke + 1)
      } else {
        // All strokes done — transition to freewrite
        setTimeout(() => {
          setMode('freewrite')
        }, 400)
      }
    }
  }

  // ── Navigation ──────────────────────────────

  const handleNext = () => {
    if (currentIndex + 1 < characters.length) {
      setCurrentIndex(currentIndex + 1)
      setMode(freewriteOnly ? 'freewrite' : 'guided')
    } else {
      setDone(true)
    }
  }

  const switchToFreewrite = () => {
    setMode('freewrite')
    setCompletedStrokes([])
    setCurrentStroke(0)
  }

  const switchToGuided = () => {
    setMode('guided')
    setCompletedStrokes([])
    setCurrentStroke(0)
  }

  // ── Done screen ─────────────────────────────

  if (done) {
    return (
      <div className="page-enter flex flex-col items-center gap-6 py-8">
        <div className="text-5xl bounce-in">&#9997;&#65039;</div>
        <h2
          className="text-2xl font-extrabold text-[#1A1A2E]"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          All Characters Traced!
        </h2>
        <p className="text-[#6B7280]" style={{ fontFamily: 'var(--font-ui)' }}>
          {characters.length} character{characters.length > 1 ? 's' : ''} practiced
        </p>
        <Button onClick={() => onComplete(block.xpReward)} fullWidth>
          Continue
        </Button>
      </div>
    )
  }

  // ── Parse path start point for numbered markers ──
  const parseStart = (path: string) => {
    const m = path.match(/M\s+([\d.]+)[,\s]+([\d.]+)/)
    if (!m) return { x: 50, y: 50 }
    return { x: parseFloat(m[1]), y: parseFloat(m[2]) }
  }

  // ── Render ──────────────────────────────────

  return (
    <div className="page-enter flex flex-col gap-4 py-4">
      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {characters.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentIndex
                ? 'bg-[#58CC02]'
                : i === currentIndex
                ? 'bg-[#1B4F8A] scale-125'
                : 'bg-[#B8CBE0]'
            }`}
          />
        ))}
      </div>

      {/* Title */}
      <h3
        className="text-lg font-extrabold text-[#1A1A2E] text-center"
        style={{ fontFamily: 'var(--font-ui)' }}
      >
        {block.title}
      </h3>

      {/* Info line */}
      <div className="flex justify-center items-center gap-3">
        <span
          className="text-sm text-[#6B7280]"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {char.reading} &middot; {char.romaji} &middot; {char.english}
        </span>
        <button
          type="button"
          onClick={() => speak(char.character)}
          className="text-lg cursor-pointer hover:opacity-70 transition-opacity"
        >
          &#128266;
        </button>
      </div>

      {/* Mode badge */}
      <div className="flex justify-center">
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{
            fontFamily: 'var(--font-ui)',
            backgroundColor: mode === 'guided' ? '#FF6B3522' : '#58CC0222',
            color: mode === 'guided' ? '#FF6B35' : '#58CC02',
          }}
        >
          {mode === 'guided'
            ? `Stroke ${currentStroke + 1} of ${totalStrokes}`
            : 'Free Practice'}
        </span>
      </div>

      {/* Stroke instruction (guided mode) */}
      {mode === 'guided' && strokeData.description[currentStroke] && (
        <p
          className="text-center text-sm text-[#1B4F8A] font-semibold"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {strokeData.description[currentStroke]}
        </p>
      )}

      {/* Canvas area */}
      <div className="flex justify-center">
        <div
          className="relative overflow-hidden"
          style={{
            width: 256,
            height: 256,
            borderRadius: 20,
            boxShadow: '0 6px 0 #B8CBE0',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Grid background for freewrite */}
          {mode === 'freewrite' && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width="256"
              height="256"
              viewBox="0 0 256 256"
            >
              {/* Outer solid border */}
              <rect
                x="4"
                y="4"
                width="248"
                height="248"
                fill="none"
                stroke="#B8CBE0"
                strokeWidth="2"
              />
              {/* Dotted cross center lines */}
              <line
                x1="128"
                y1="4"
                x2="128"
                y2="252"
                stroke="#B8CBE0"
                strokeWidth="1"
                strokeDasharray="6,4"
              />
              <line
                x1="4"
                y1="128"
                x2="252"
                y2="128"
                stroke="#B8CBE0"
                strokeWidth="1"
                strokeDasharray="6,4"
              />
              {/* Faint quarter guides */}
              <line
                x1="64"
                y1="4"
                x2="64"
                y2="252"
                stroke="#B8CBE022"
                strokeWidth="1"
              />
              <line
                x1="192"
                y1="4"
                x2="192"
                y2="252"
                stroke="#B8CBE022"
                strokeWidth="1"
              />
              <line
                x1="4"
                y1="64"
                x2="252"
                y2="64"
                stroke="#B8CBE022"
                strokeWidth="1"
              />
              <line
                x1="4"
                y1="192"
                x2="252"
                y2="192"
                stroke="#B8CBE022"
                strokeWidth="1"
              />
            </svg>
          )}

          {/* Ghost character (guided mode only) */}
          {mode === 'guided' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span
                className="text-[120px] leading-none text-[#E8E8E8]"
                style={{ fontFamily: 'var(--font-jp)' }}
              >
                {char.character}
              </span>
            </div>
          )}

          {/* SVG stroke overlay (guided mode) */}
          {mode === 'guided' && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width="256"
              height="256"
              viewBox="0 0 100 100"
            >
              {/* Completed strokes — blue, 40% opacity */}
              {completedStrokes.map((si) => (
                <path
                  key={`done-${si}`}
                  d={strokeData.strokes[si].path}
                  fill="none"
                  stroke="#1B4F8A"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              ))}

              {/* Current stroke — orange dashed */}
              {currentStroke < totalStrokes && (
                <path
                  d={strokeData.strokes[currentStroke].path}
                  fill="none"
                  stroke="#FF6B35"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="5,4"
                  opacity="0.8"
                />
              )}

              {/* Numbered start points */}
              {strokeData.strokes.map((s, si) => {
                const start = parseStart(s.path)
                const isDone = completedStrokes.includes(si)
                const isCurrent = si === currentStroke
                if (!isDone && !isCurrent) return null
                return (
                  <g key={`num-${si}`}>
                    <circle
                      cx={start.x}
                      cy={start.y}
                      r="5"
                      fill={isCurrent ? '#FF6B35' : '#1B4F8A'}
                      opacity={isCurrent ? 1 : 0.4}
                    />
                    <text
                      x={start.x}
                      y={start.y + 1.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="5"
                      fontWeight="bold"
                    >
                      {s.num}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}

          {/* Canvas drawing surface */}
          <canvas
            ref={canvasRef}
            width={256}
            height={256}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* Memory hook */}
      {char.memoryHook && (
        <div className="bg-[#EBF0F8] rounded-[16px] p-4 text-center">
          <p
            className="text-xs font-bold text-[#1B4F8A] mb-1"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Memory Hook
          </p>
          <p
            className="text-sm text-[#1A1A2E]"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {char.memoryHook}
          </p>
        </div>
      )}

      {/* Mode controls */}
      <div className="flex flex-col items-center gap-2">
        {mode === 'guided' && (
          <button
            type="button"
            onClick={switchToFreewrite}
            className="text-sm text-[#1B4F8A] font-semibold cursor-pointer hover:underline"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Skip to free practice &rarr;
          </button>
        )}

        {mode === 'freewrite' && (
          <>
            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => clearCanvas()}
              >
                Clear
              </Button>
              <Button size="sm" fullWidth onClick={handleNext}>
                {currentIndex + 1 < characters.length ? 'Done — Next' : 'Done — Finish'}
              </Button>
            </div>
            {!freewriteOnly && (
              <button
                type="button"
                onClick={switchToGuided}
                className="text-sm text-[#6B7280] font-semibold cursor-pointer hover:underline"
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                &larr; Review stroke order again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TraceBlockRenderer
