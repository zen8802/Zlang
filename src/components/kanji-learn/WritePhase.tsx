'use client'

import { useState, useRef, useEffect } from 'react'
import type { KyouikuKanji } from '@/data/kyouiku-kanji'

interface Props {
  kanji: KyouikuKanji
  onComplete: () => void
}

const SIZE = 280

type Result = 'idle' | 'correct' | 'incorrect'

export function WritePhase({ kanji, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<Result>('idle')
  const [attempts, setAttempts] = useState(0)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.strokeStyle = '#1A1814'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scale = SIZE / rect.width

    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0]
      return { x: (t.clientX - rect.left) * scale, y: (t.clientY - rect.top) * scale }
    }
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPos(e)
    lastPos.current = pos
    setIsDrawing(true)
    setHasStrokes(true)
    if (result !== 'idle') setResult('idle')

    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#1A1814'
      ctx.fill()
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing || !lastPos.current) return
    const pos = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, SIZE, SIZE)
    setHasStrokes(false)
    setResult('idle')
  }

  const checkWriting = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setChecking(true)
    setAttempts((a) => a + 1)

    const imageData = canvas.toDataURL('image/png').split(',')[1]

    try {
      const res = await fetch('/api/japanese/check-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, expectedCharacter: kanji.character }),
      })
      const data = await res.json()

      if (data.correct) {
        setResult('correct')
      } else {
        setResult('incorrect')
      }
    } catch {
      // If the network or API fails, don't block the user.
      setResult('correct')
    }

    setChecking(false)
  }

  return (
    <div className="flex flex-col items-center px-6 py-8 space-y-5">
      {/* Instructions */}
      <div className="text-center space-y-1">
        <p style={{ fontFamily: 'Shippori Mincho', fontSize: '20px', color: '#1A1814' }}>
          Write from memory
        </p>
        <p className="text-sm text-[#9E9892]" style={{ fontFamily: 'DM Sans' }}>
          {attempts === 0 ? 'No guides this time — you know this' : 'Try again — remember the stroke order'}
        </p>
      </div>

      {/* Blank canvas */}
      <div
        className="relative rounded-[16px] overflow-hidden"
        style={{
          border:
            result === 'correct'
              ? '2px solid #C9920A'
              : result === 'incorrect'
                ? '2px solid #8B3A3A'
                : '1.5px solid #E0DAD2',
          boxShadow:
            result === 'correct'
              ? '0 0 20px rgba(201,146,10,0.2)'
              : result === 'incorrect'
                ? '0 0 16px rgba(139,58,58,0.12)'
                : '0 2px 16px rgba(26,24,20,0.06)',
          transition: 'all 0.3s ease',
          width: SIZE,
          height: SIZE,
        }}
      >
        <svg className="absolute inset-0 pointer-events-none" width={SIZE} height={SIZE}>
          <line x1={SIZE / 2} y1="16" x2={SIZE / 2} y2={SIZE - 16}
            stroke="rgba(26,24,20,0.04)" strokeWidth="1" strokeDasharray="5 4" />
          <line x1="16" y1={SIZE / 2} x2={SIZE - 16} y2={SIZE / 2}
            stroke="rgba(26,24,20,0.04)" strokeWidth="1" strokeDasharray="5 4" />
        </svg>

        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ touchAction: 'none', display: 'block', width: '100%', maxWidth: SIZE }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Result feedback */}
      {result === 'correct' && (
        <p className="text-sm font-medium" style={{ color: '#C9920A', fontFamily: 'DM Sans' }}>
          ⭐ Well done
        </p>
      )}
      {result === 'incorrect' && (
        <p className="text-sm" style={{ color: '#8B3A3A', fontFamily: 'DM Sans' }}>
          Not quite — try again
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-[280px]">
        {hasStrokes && result !== 'correct' && (
          <button
            onClick={clearCanvas}
            className="flex-1 py-3 rounded-[10px] border border-[#E0DAD2] text-sm font-medium text-[#6B6560] hover:border-[#9E9892] transition-colors"
            style={{ fontFamily: 'DM Sans' }}
          >
            Clear
          </button>
        )}
        {hasStrokes && result !== 'correct' && (
          <button
            onClick={checkWriting}
            disabled={checking}
            className="flex-1 py-3 rounded-[10px] bg-[#1B4F8A] text-white text-sm font-medium disabled:opacity-50 hover:bg-[#4A7AB5] transition-colors"
            style={{ fontFamily: 'DM Sans' }}
          >
            {checking ? 'Checking...' : 'Check'}
          </button>
        )}
      </div>

      {/* Finish button — appears after a correct check */}
      {result === 'correct' && (
        <button
          onClick={onComplete}
          className="w-full max-w-[280px] py-4 rounded-[12px] font-semibold text-sm transition-all active:translate-y-px"
          style={{
            backgroundColor: '#C9920A',
            color: 'white',
            fontFamily: 'DM Sans',
            boxShadow: '0 4px 16px rgba(201,146,10,0.3)',
          }}
        >
          Finish
        </button>
      )}

      {/* Skip option after multiple failures */}
      {attempts >= 2 && result === 'incorrect' && (
        <button
          onClick={onComplete}
          className="text-xs text-[#9E9892] hover:text-[#6B6560] transition-colors"
          style={{ fontFamily: 'DM Sans' }}
        >
          Skip and finish anyway →
        </button>
      )}
    </div>
  )
}
